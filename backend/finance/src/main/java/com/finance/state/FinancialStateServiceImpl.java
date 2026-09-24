package com.finance.state;

import com.finance.commitment.CommitmentInstanceService;
import com.finance.commitment.CycleShape;
import com.finance.cycle.CurrentCycleResolver;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.domain.Cycle;
import com.finance.insight.InsightService;
import com.finance.position.NetWorthResult;
import com.finance.position.PositionResult;
import com.finance.position.PositionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Composes the whole position from the calculators that already own each part.
 *
 * <p>Deliberately thin: it decides <em>what goes in</em> and nothing about <em>how any
 * figure is worked out</em>. The moment this class starts doing arithmetic of its own, there
 * are two places that compute the same number and they will disagree.
 *
 * <p>Uses {@link CurrentCycleResolver} rather than {@code CycleService}, following the
 * house rule on bean cycles: anything reachable from {@code PositionService} must not depend
 * on {@code CycleService}, because {@code CycleServiceImpl.close} calls {@code PositionService}.
 *
 * <p>Not read-only: listing a cycle's occurrences generates any that are missing, exactly as
 * every other reader of the plan does.
 */
@Service
public class FinancialStateServiceImpl implements FinancialStateService {

    private static final Logger log = LoggerFactory.getLogger(FinancialStateServiceImpl.class);

    private final CurrentCycleResolver cycleResolver;
    private final PositionService positionService;
    private final CommitmentInstanceService instanceService;
    private final RunwayCalculator runwayCalculator;
    private final SpendBaselineCalculator baselineCalculator;
    private final DebtPositionCalculator debtCalculator;
    private final InsightService insightService;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public FinancialStateServiceImpl(CurrentCycleResolver cycleResolver, PositionService positionService,
                                     CommitmentInstanceService instanceService, RunwayCalculator runwayCalculator,
                                     SpendBaselineCalculator baselineCalculator, DebtPositionCalculator debtCalculator,
                                     InsightService insightService, CurrentUserProvider currentUser, Clock clock) {
        this.cycleResolver = cycleResolver;
        this.positionService = positionService;
        this.instanceService = instanceService;
        this.runwayCalculator = runwayCalculator;
        this.baselineCalculator = baselineCalculator;
        this.debtCalculator = debtCalculator;
        this.insightService = insightService;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Override
    @Transactional
    public FinancialState current() {
        LocalDate today = LocalDate.now(clock);
        Cycle cycle = cycleResolver.resolve(currentUser.currentUserId(), today);

        PositionResult position = positionService.currentPosition();
        NetWorthResult netWorth = positionService.currentNetWorth();
        CycleShape shape = instanceService.shape(cycle.getId());

        // Expected income is the cycle's own figure, so the EMI share and the cycle's shape
        // are measured against the same income rather than two ideas of "a month".
        BigDecimal expectedIncome = shape == null ? null : shape.expectedIn();

        // Runway is measured against the cycle **ahead**, not the one in progress. It asks
        // "how long could I keep this up from here", so the plan that matters is the one
        // still to be paid: a bill ending this month should not prop the figure up, and a
        // user whose plan starts next month should not be told there is nothing to measure.
        // For a settled plan the two cycles carry the same standing commitments and the
        // answer is identical - this only differs at a boundary, which is exactly where the
        // current cycle gives the wrong answer.
        Cycle nextCycle = cycleResolver.resolve(currentUser.currentUserId(), cycle.getEndDate().plusDays(1));
        Runway runway = runwayCalculator.calculate(nextCycle);
        SpendBaseline baseline = baselineCalculator.calculate();
        DebtPosition debt = debtCalculator.calculate(expectedIncome);

        int attention = attentionCount();

        // +1 because the salary date itself is a day you still have to get through.
        int daysToSalary = (int) ChronoUnit.DAYS.between(today, cycle.getEndDate()) + 1;

        return new FinancialState(today, cycle, daysToSalary, position, shape, netWorth,
                runway, baseline, debt, attention);
    }

    /** The same engine Needs you and the write-effect toast read, so the three agree. */
    private int attentionCount() {
        try {
            return insightService.evaluateAll().size();
        } catch (RuntimeException e) {
            // A state object that cannot count warnings is still worth returning; the
            // figures above are unaffected by it.
            log.warn("Financial state: attention unavailable: {}", e.getClass().getSimpleName());
            return 0;
        }
    }
}
