package com.finance.goal;

import com.finance.common.money.MoneyScale;
import com.finance.forecast.ForecastMonth;
import com.finance.forecast.ForecastService;
import com.finance.insight.Wording;
import com.finance.position.PositionResult;
import com.finance.position.PositionService;
import com.finance.state.SpendBaseline;
import com.finance.state.SpendBaselineCalculator;
import org.springframework.data.domain.Pageable;
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
 * Can each goal actually be met from the money that will be free before its date?
 * ROADMAP 5.1 (the cash-flow half) and the derived part of 5.2 (contention). See
 * {@link GoalFeasibility} for what each state means.
 *
 * <h2>Where "free" comes from</h2>
 * <ul>
 *   <li><strong>This salary month:</strong> the Real Balance - what is left after every bill
 *       still due - less the usual day-to-day spending for the days that remain.</li>
 *   <li><strong>Each later month:</strong> the forecast's {@code flexible} (income less every
 *       planned bill and saving) less the usual day-to-day spending for a whole month.</li>
 * </ul>
 * The forecast leaves bills with no amount out of its totals, so {@code flexible} is a
 * <em>ceiling</em>; and with no spending history there is no "usual" to subtract. Both make
 * an answer uncertain rather than wrong, so they produce {@code FITS_IF}, never {@code FITS}.
 * Only one comparison is certain: a gap larger than the ceiling - every rupee the plan leaves,
 * before a single meal is bought - cannot be met. That is the only case called fiction.
 *
 * <h2>What it deliberately does not do</h2>
 * It does not move money, allocate it, or recommend dropping a goal. It says which goals the
 * months ahead can carry, in the order the user ranked them, and what each is short by.
 * Read-only, nothing stored (ADR-0011).
 */
@Service
public class GoalFeasibilityService {

    /** Two years of salary months - beyond that a projection of a fixed plan says little. */
    static final int HORIZON = 24;

    private final GoalService goalService;
    private final ForecastService forecastService;
    private final PositionService positionService;
    private final SpendBaselineCalculator baselineCalculator;
    private final Clock clock;

    public GoalFeasibilityService(GoalService goalService, ForecastService forecastService,
                                  PositionService positionService, SpendBaselineCalculator baselineCalculator,
                                  Clock clock) {
        this.goalService = goalService;
        this.forecastService = forecastService;
        this.positionService = positionService;
        this.baselineCalculator = baselineCalculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<GoalFeasibility> assess() {
        List<GoalView> goals = goalService.list(false, Pageable.unpaged()).getContent();
        if (goals.isEmpty()) {
            return List.of();
        }
        return assess(goals, forecastService.forecast(HORIZON).months(),
                positionService.currentPosition(), baselineCalculator.calculate(), LocalDate.now(clock));
    }

    /**
     * The same assessment with {@code extra} already added to one goal's savings - "what if this
     * money went into that goal?" (ROADMAP 4.3). The goal's verdict after the move; null when the
     * goal isn't an active one with something left to fund.
     */
    @Transactional(readOnly = true)
    public GoalFeasibility assessWith(Long goalId, BigDecimal extra) {
        List<GoalView> goals = new ArrayList<>();
        for (GoalView g : goalService.list(false, Pageable.unpaged()).getContent()) {
            if (g.goal().getId().equals(goalId)) {
                BigDecimal saved = g.currentAmount() == null ? BigDecimal.ZERO : g.currentAmount();
                g = new GoalView(g.goal(), saved.add(extra), g.spentAmount(), g.progressPercent(), g.requiredPerMonth(),
                        g.fundedPerMonth(), g.fundingVaries(), g.pace(), g.timeElapsedPercent(), g.schedule());
            }
            goals.add(g);
        }
        return assess(goals, forecastService.forecast(HORIZON).months(), positionService.currentPosition(),
                baselineCalculator.calculate(), LocalDate.now(clock))
                .stream().filter(f -> f.goalId().equals(goalId)).findFirst().orElse(null);
    }

    /** The pure calculation - every input passed in, so it can be reasoned about (and later tested) alone. */
    List<GoalFeasibility> assess(List<GoalView> goals, List<ForecastMonth> months, PositionResult position,
                                 SpendBaseline baseline, LocalDate today) {
        int n = months.size();
        BigDecimal[] expected = new BigDecimal[n];   // null = unknown
        BigDecimal[] ceiling = new BigDecimal[n];
        boolean[] uncertain = new boolean[n];

        BigDecimal usual = baseline.isKnown() ? baseline.perCycle() : null;
        for (int i = 0; i < n; i++) {
            ForecastMonth m = months.get(i);
            if (i == 0) {
                BigDecimal real = position != null && position.complete() ? position.realBalance() : null;
                ceiling[i] = real;
                if (real != null && usual != null) {
                    long total = ChronoUnit.DAYS.between(m.cycleStart(), m.cycleEnd()) + 1;
                    long left = ChronoUnit.DAYS.between(today, m.cycleEnd()) + 1;
                    BigDecimal share = usual.multiply(BigDecimal.valueOf(left))
                            .divide(BigDecimal.valueOf(Math.max(total, 1)), 2, RoundingMode.HALF_UP);
                    expected[i] = real.subtract(share);
                }
                uncertain[i] = real == null || usual == null;
            } else {
                ceiling[i] = m.flexible();
                expected[i] = m.flexible() == null || usual == null ? null : m.flexible().subtract(usual);
                uncertain[i] = m.flexible() == null || usual == null || m.unknownAmountCount() > 0;
            }
        }

        List<GoalView> ordered = new ArrayList<>(goals);
        ordered.sort(Comparator
                .comparing((GoalView g) -> g.goal().getPriority(), Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(g -> g.goal().getTargetDate(), Comparator.nullsLast(Comparator.naturalOrder())));

        BigDecimal consumed = MoneyScale.ZERO;
        List<GoalFeasibility> out = new ArrayList<>();
        for (GoalView view : ordered) {
            String name = view.goal().getName();
            BigDecimal target = view.goal().getTargetAmount();
            LocalDate date = view.goal().getTargetDate();
            BigDecimal saved = (view.currentAmount() == null ? BigDecimal.ZERO : view.currentAmount())
                    .add(view.spentAmount() == null ? BigDecimal.ZERO : view.spentAmount());

            if (target == null) {
                out.add(unknown(view, null, "This goal has no target amount, so there's nothing to measure against."));
                continue;
            }
            BigDecimal stillNeeded = MoneyScale.normalise(target.subtract(saved).max(BigDecimal.ZERO));
            if (stillNeeded.signum() == 0) {
                continue; // met - nothing left to judge
            }
            if (date == null) {
                out.add(unknown(view, stillNeeded, "This goal has no date, so there's no deadline to fit it into."));
                continue;
            }
            if (date.isBefore(today)) {
                out.add(unknown(view, stillNeeded, "This goal's date has passed. Move the date to see whether it fits."));
                continue;
            }
            int counted = 0;
            while (counted < n && !months.get(counted).cycleStart().isAfter(date)) {
                counted++;
            }
            if (counted == n && months.get(n - 1).cycleEnd().isBefore(date)) {
                out.add(unknown(view, stillNeeded, "This goal is more than two years away - too far to project a fixed plan honestly."));
                continue;
            }

            // The plan's own funding, for every month after this one (this month's is already in "saved" or still to come
            // as a bill, which the Real Balance has already set aside).
            BigDecimal funded = view.fundingVaries() > 0 ? null : view.fundedPerMonth();
            BigDecimal planWillAdd = funded == null ? null
                    : MoneyScale.normalise(funded.multiply(BigDecimal.valueOf(Math.max(counted - 1, 0))));
            BigDecimal gap = MoneyScale.normalise(stillNeeded.subtract(planWillAdd == null ? BigDecimal.ZERO : planWillAdd)
                    .max(BigDecimal.ZERO));

            if (gap.signum() == 0) {
                out.add(new GoalFeasibility(view.goal().getId(), name, date, GoalFeasibility.State.COVERED_BY_PLAN,
                        stillNeeded, planWillAdd, gap, null, null, null, null, counted,
                        "What the plan already puts in reaches " + Wording.money(target) + " by " + Wording.date(date, today) + "."));
                continue;
            }

            BigDecimal ceilingSum = MoneyScale.ZERO;
            BigDecimal expectedSum = MoneyScale.ZERO;
            boolean expectedKnown = true;
            boolean anyUncertain = planWillAdd == null;
            boolean ceilingKnown = true;
            for (int i = 0; i < counted; i++) {
                if (ceiling[i] == null) {
                    ceilingKnown = false;
                } else {
                    ceilingSum = ceilingSum.add(ceiling[i]);
                }
                BigDecimal e = expected[i];
                if (e != null && i > 0 && i == counted - 1) {
                    // The month the date falls in only spends until the date: charging it a whole
                    // month of day-to-day living would sink a goal due on salary day itself.
                    ForecastMonth m = months.get(i);
                    long total = ChronoUnit.DAYS.between(m.cycleStart(), m.cycleEnd()) + 1;
                    long used = Math.min(ChronoUnit.DAYS.between(m.cycleStart(), date) + 1, total);
                    BigDecimal share = usual.multiply(BigDecimal.valueOf(used))
                            .divide(BigDecimal.valueOf(Math.max(total, 1)), 2, RoundingMode.HALF_UP);
                    e = m.flexible().subtract(share);
                }
                if (e == null) {
                    expectedKnown = false;
                } else {
                    expectedSum = expectedSum.add(e);
                }
                anyUncertain |= uncertain[i];
            }
            BigDecimal ceilingLeft = ceilingKnown ? MoneyScale.normalise(ceilingSum.subtract(consumed)) : null;
            BigDecimal expectedLeft = expectedKnown ? MoneyScale.normalise(expectedSum.subtract(consumed)) : null;
            BigDecimal perMonth = MoneyScale.normalise(gap.divide(BigDecimal.valueOf(counted), 2, RoundingMode.CEILING));

            GoalFeasibility.State state;
            BigDecimal shortBy = null;
            String reason;
            String need = Wording.money(gap) + " beyond what the plan puts in";
            String by = " by " + Wording.date(date, today);

            if (ceilingLeft != null && gap.compareTo(ceilingLeft) > 0) {
                state = GoalFeasibility.State.DOES_NOT_FIT;
                shortBy = MoneyScale.normalise(gap.subtract(ceilingLeft.max(BigDecimal.ZERO)));
                reason = "Needs " + need + by + ", and even with no day-to-day spending at all the months before it leave "
                        + (ceilingLeft.signum() > 0 ? "only " + Wording.money(ceilingLeft) : "nothing")
                        + (consumed.signum() > 0 ? " after the goals ranked above it" : "")
                        + ". A later date or a smaller target would make it real.";
            } else if (!anyUncertain && expectedLeft != null && gap.compareTo(expectedLeft) <= 0) {
                state = GoalFeasibility.State.FITS;
                reason = "Needs " + need + by + " - about " + Wording.money(perMonth) + " a month - and after usual spending "
                        + Wording.money(expectedLeft) + " is free. Nothing moves on its own, though.";
            } else if (ceilingLeft == null) {
                state = GoalFeasibility.State.UNKNOWN;
                reason = "A month before this goal's date has nothing planned to come in, so what's free can't be worked out.";
            } else {
                state = GoalFeasibility.State.FITS_IF;
                if (expectedLeft != null && gap.compareTo(expectedLeft) > 0) {
                    reason = "Needs " + need + by + ". After usual spending only " + Wording.money(expectedLeft.max(BigDecimal.ZERO))
                            + " is free, so it fits only if day-to-day spending comes in about "
                            + Wording.money(gap.subtract(expectedLeft)) + " under usual"
                            + (counted > 1 ? " across those " + counted + " months - roughly "
                                    + Wording.money(gap.subtract(expectedLeft).divide(BigDecimal.valueOf(counted), 0, RoundingMode.CEILING))
                                    + " a month" : "") + ".";
                } else if (expectedLeft == null) {
                    reason = "Needs " + need + by + ". It fits within what the plan leaves, but there isn't enough spending history yet"
                            + " to know how much of that day-to-day life takes.";
                } else {
                    reason = "Needs " + need + by + " and should fit, but some bills before then have no amount yet - if they're large, it won't.";
                }
            }

            BigDecimal take = expectedLeft != null ? gap.min(expectedLeft.max(BigDecimal.ZERO))
                    : gap.min(ceilingLeft == null ? BigDecimal.ZERO : ceilingLeft.max(BigDecimal.ZERO));
            consumed = consumed.add(take);

            out.add(new GoalFeasibility(view.goal().getId(), name, date, state, stillNeeded, planWillAdd, gap,
                    expectedLeft, ceilingLeft, shortBy, perMonth, counted, reason));
        }
        return out;
    }

    private static GoalFeasibility unknown(GoalView view, BigDecimal stillNeeded, String reason) {
        return new GoalFeasibility(view.goal().getId(), view.goal().getName(), view.goal().getTargetDate(),
                GoalFeasibility.State.UNKNOWN, stillNeeded, null, null, null, null, null, null, 0, reason);
    }
}
