package com.finance.recovery;

import com.finance.common.money.MoneyScale;
import com.finance.forecast.ForecastMonth;
import com.finance.forecast.ForecastService;
import com.finance.insight.Wording;
import com.finance.position.PositionResult;
import com.finance.position.PositionService;
import com.finance.state.SpendBaseline;
import com.finance.state.SpendBaselineCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Builds the {@link RecoveryPlan} - ROADMAP 6.2.
 *
 * <h2>When a month needs one</h2>
 * <ul>
 *   <li><strong>BROKEN</strong> - the Real Balance is below zero: the bills still due exceed
 *       what is held after money set aside. Something has to give.</li>
 *   <li><strong>STRETCHED</strong> - everything is covered, but what is left is less than the
 *       user's own usual day-to-day spending for the days remaining. Measured against their
 *       history ({@link SpendBaseline}), never an invented budget; without history there is
 *       no "usual" and this state is never claimed.</li>
 * </ul>
 *
 * <h2>The order of the levers, and why</h2>
 * <ol>
 *   <li><strong>Defer optional payments</strong> - the user already marked them skippable.
 *       Largest first, stopping as soon as the gap is covered, so the plan touches as few
 *       things as possible.</li>
 *   <li><strong>Release money set aside</strong> - reversible, but it is a goal's money, so it
 *       comes second, only for what the deferrals did not cover, and <em>only when BROKEN</em>:
 *       a stretched month is not worth a goal.</li>
 *   <li><strong>Spend less</strong> - whatever remains, as a day rate below usual. Last,
 *       because it is the one lever that depends on willpower rather than a decision.</li>
 * </ol>
 * Mandatory bills are never offered - deferring an EMI costs a fee and a credit score.
 *
 * <p>Then the way back: what was deferred or released is put back from the coming months'
 * room above usual spending, over as few months as that room allows. Read-only; nothing is
 * stored or moved.
 */
@Service
public class RecoveryService {

    private static final int CATCH_UP_HORIZON = 6;

    private final PositionService positionService;
    private final ForecastService forecastService;
    private final SpendBaselineCalculator baselineCalculator;
    private final Clock clock;

    public RecoveryService(PositionService positionService, ForecastService forecastService,
                           SpendBaselineCalculator baselineCalculator, Clock clock) {
        this.positionService = positionService;
        this.forecastService = forecastService;
        this.baselineCalculator = baselineCalculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public RecoveryPlan current() {
        LocalDate today = LocalDate.now(clock);
        List<ForecastMonth> months = forecastService.forecast(CATCH_UP_HORIZON + 1).months();
        ForecastMonth now = months.get(0);
        int daysLeft = (int) ChronoUnit.DAYS.between(today, now.cycleEnd()) + 1;
        long cycleDays = ChronoUnit.DAYS.between(now.cycleStart(), now.cycleEnd()) + 1;

        PositionResult position = positionService.currentPosition();
        if (!position.complete()) {
            return new RecoveryPlan(RecoveryPlan.State.INCOMPLETE, null, daysLeft, List.of(), null, null, null, null,
                    "A bill this month has no amount yet, so whether the month holds can't be known.");
        }

        SpendBaseline baseline = baselineCalculator.calculate();
        BigDecimal real = position.realBalance();
        BigDecimal usualLeft = baseline.isKnown()
                ? baseline.perCycle().multiply(BigDecimal.valueOf(daysLeft))
                        .divide(BigDecimal.valueOf(Math.max(cycleDays, 1)), 2, RoundingMode.HALF_UP)
                : null;

        RecoveryPlan.State state;
        BigDecimal gap;
        if (real.signum() < 0) {
            state = RecoveryPlan.State.BROKEN;
            gap = real.negate();
        } else if (usualLeft != null && real.compareTo(usualLeft) < 0) {
            state = RecoveryPlan.State.STRETCHED;
            gap = usualLeft.subtract(real);
        } else {
            return new RecoveryPlan(RecoveryPlan.State.ON_COURSE, null, daysLeft, List.of(), null, null, null, null,
                    "Every bill is covered and what's left is at least your usual day-to-day spending.");
        }
        gap = MoneyScale.normalise(gap);

        List<RecoveryPlan.Step> steps = new ArrayList<>();
        BigDecimal remaining = gap;
        BigDecimal deferred = MoneyScale.ZERO;

        List<PositionResult.CommitmentAmount> optional = new ArrayList<>(position.openInstances().stream()
                .filter(c -> !c.mandatory() && c.outstanding() != null && c.outstanding().signum() > 0)
                .toList());
        // Touch as little as possible: if one payment covers what's left, defer the smallest such
        // one; otherwise defer the largest and look again. Largest-first alone would defer a
        // ₹12,000 purchase to cover a ₹500 gap.
        optional.sort(Comparator.comparing(PositionResult.CommitmentAmount::outstanding));
        while (remaining.signum() > 0 && !optional.isEmpty()) {
            final BigDecimal need = remaining;
            PositionResult.CommitmentAmount pick = optional.stream()
                    .filter(c -> c.outstanding().compareTo(need) >= 0)
                    .findFirst()
                    .orElse(optional.get(optional.size() - 1));
            optional.remove(pick);
            steps.add(new RecoveryPlan.Step(RecoveryPlan.Step.Kind.DEFER, pick.commitmentInstanceId(),
                    pick.name(), MoneyScale.normalise(pick.outstanding()), null));
            remaining = remaining.subtract(pick.outstanding());
            deferred = deferred.add(pick.outstanding());
        }

        BigDecimal released = MoneyScale.ZERO;
        // Only when bills would otherwise go unpaid. On a merely stretched month, pointing at goal
        // money would be the product suggesting a raid it then warns about (GOAL_RAIDED) - and a
        // tighter day rate is the honest lever there.
        if (state == RecoveryPlan.State.BROKEN
                && remaining.signum() > 0 && position.reserved() != null && position.reserved().signum() > 0) {
            released = MoneyScale.normalise(remaining.min(position.reserved()));
            steps.add(new RecoveryPlan.Step(RecoveryPlan.Step.Kind.RELEASE, null,
                    "Money set aside for goals", released, null));
            remaining = remaining.subtract(released);
        }

        BigDecimal stillShort = MoneyScale.normalise(remaining.max(BigDecimal.ZERO));
        if (stillShort.signum() > 0) {
            BigDecimal perDay = stillShort.divide(BigDecimal.valueOf(Math.max(daysLeft, 1)), 0, RoundingMode.CEILING);
            steps.add(new RecoveryPlan.Step(RecoveryPlan.Step.Kind.SPEND_LESS, null,
                    "Spend less day to day", stillShort, MoneyScale.normalise(perDay)));
        }

        // The way back: put back what was deferred or released from the room the coming months
        // leave above usual spending. Deferred payments still have to be made, and a goal's money
        // should go home - leaving either implicit is how a bad month becomes a bad quarter.
        BigDecimal catchUp = MoneyScale.normalise(deferred.add(released));
        Integer catchUpMonths = null;
        BigDecimal perMonth = null;
        if (catchUp.signum() > 0 && baseline.isKnown()) {
            BigDecimal room = null;
            for (int i = 1; i < months.size(); i++) {
                BigDecimal flexible = months.get(i).flexible();
                if (flexible == null) {
                    break;
                }
                BigDecimal spare = flexible.subtract(baseline.perCycle());
                room = room == null ? spare : room.min(spare);  // the tightest month sets the pace
                if (room.signum() <= 0) {
                    break;
                }
                if (room.multiply(BigDecimal.valueOf(i)).compareTo(catchUp) >= 0) {
                    catchUpMonths = i;
                    perMonth = MoneyScale.normalise(catchUp.divide(BigDecimal.valueOf(i), 0, RoundingMode.CEILING));
                    break;
                }
            }
        }

        String what = state == RecoveryPlan.State.BROKEN
                ? "The bills still due this month are " + Wording.money(gap) + " more than you hold after money set aside."
                : "Every bill is covered, but what's left is " + Wording.money(gap)
                        + " short of your usual day-to-day spending for the " + daysLeft + " days to salary.";
        return new RecoveryPlan(state, gap, daysLeft, steps, stillShort, catchUp, catchUpMonths, perMonth, what);
    }
}
