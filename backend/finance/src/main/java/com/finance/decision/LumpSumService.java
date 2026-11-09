package com.finance.decision;

import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CurrentCycleResolver;
import com.finance.goal.GoalFeasibility;
import com.finance.goal.GoalFeasibilityService;
import com.finance.loan.AmortisationCalculator;
import com.finance.loan.LoanService;
import com.finance.loan.LoanView;
import com.finance.loan.domain.Loan;
import com.finance.loan.domain.LoanStatus;
import com.finance.state.Runway;
import com.finance.state.RunwayCalculator;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Prepay vs save vs keep - ROADMAP 4.3, the ₹50,000 question.
 *
 * <p>A bonus arrives. Every option is shown with what it does in its own unit:
 * <ul>
 *   <li><strong>Prepay a loan</strong> - interest saved and months sooner, assuming the EMI
 *       stays the same and the loan ends earlier (the usual default; some lenders cut the EMI
 *       instead, which saves less). If it clears the loan, the EMI it frees is stated too.</li>
 *   <li><strong>Put it towards a goal</strong> - the goal's feasibility verdict before and
 *       after, from {@link GoalFeasibilityService}, so "the trip now fits" is a computed fact.</li>
 *   <li><strong>Keep it</strong> - runway: how many months of must-pay bills the reachable
 *       money covers. Prepaying spends liquidity; this is what it costs.</li>
 * </ul>
 *
 * <p><strong>Investing is not modelled as an option, on purpose.</strong> Any figure for it
 * needs an assumed return, and an assumed return is the confident-wrong number rule 3
 * forbids. What is stated instead is the bar: the dearest loan's rate, which an investment
 * would have to beat after tax and with certainty. That is arithmetic, not a forecast.
 *
 * <p>Nothing is recommended or ranked across kinds (D8). Read-only; nothing stored. Which
 * option was taken would be 4.1, blocked behind the migration freeze.
 */
@Service
public class LumpSumService {

    private final LoanService loanService;
    private final GoalFeasibilityService feasibility;
    private final AmortisationCalculator calculator;
    private final RunwayCalculator runwayCalculator;
    private final CurrentCycleResolver cycleResolver;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public LumpSumService(LoanService loanService, GoalFeasibilityService feasibility, AmortisationCalculator calculator,
                          RunwayCalculator runwayCalculator, CurrentCycleResolver cycleResolver,
                          CurrentUserProvider currentUser, Clock clock) {
        this.loanService = loanService;
        this.feasibility = feasibility;
        this.calculator = calculator;
        this.runwayCalculator = runwayCalculator;
        this.cycleResolver = cycleResolver;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public LumpSumResult evaluate(BigDecimal amount) {
        Runway runway = runwayCalculator.calculateAhead(
                cycleResolver.resolve(currentUser.currentUserId(), LocalDate.now(clock)), cycleResolver);

        List<LumpSumOption> prepay = prepayOptions(amount, runway);
        List<LumpSumOption> goals = goalOptions(amount, runway);

        LumpSumOption dearest = prepay.stream()
                .filter(o -> o.annualRate() != null && o.unknownReason() == null)
                .max(Comparator.comparing(LumpSumOption::annualRate))
                .orElse(null);

        List<LumpSumOption> options = new ArrayList<>(prepay);
        options.addAll(goals);
        options.add(new LumpSumOption(LumpSumOption.Kind.KEEP, null, "Keep it", amount,
                null, null, false, null, null, null, null, null,
                runway.isKnown() ? runway.months() : null,
                runway.isKnown() ? null : runway.unknownReason()));

        return new LumpSumResult(amount, runway.isKnown() ? runway.months() : null,
                dearest == null ? null : dearest.annualRate(), dearest == null ? null : dearest.targetName(), options);
    }

    private List<LumpSumOption> prepayOptions(BigDecimal amount, Runway runway) {
        List<LumpSumOption> out = new ArrayList<>();
        for (LoanView view : loanService.list(Pageable.unpaged()).getContent()) {
            Loan loan = view.loan();
            if (loan.getStatus() == LoanStatus.CLOSED) {
                continue;
            }
            String name = view.account() != null ? view.account().getName() : loan.getLender();
            BigDecimal outstanding = view.outstandingPrincipal() == null
                    ? loan.getOutstandingBalance() : view.outstandingPrincipal();
            if (outstanding == null || outstanding.signum() <= 0) {
                continue;
            }
            BigDecimal applied = MoneyScale.normalise(amount.min(outstanding));
            boolean closes = applied.compareTo(outstanding) >= 0;
            BigDecimal emiFreed = closes ? loan.getEmi() : null;
            BigDecimal runwayAfter = runwayAfter(runway, applied, emiFreed);

            if (loan.getAnnualRate() == null) {
                out.add(new LumpSumOption(LumpSumOption.Kind.PREPAY, loan.getId(), name, applied,
                        null, null, closes, emiFreed, null, null, null, null, runwayAfter,
                        "This loan has no interest rate recorded, so what prepaying would save can't be worked out."));
                continue;
            }
            int monthsNow = calculator.impliedEmis(outstanding, loan.getAnnualRate(), loan.getEmi());
            BigDecimal interestNow = calculator.totalInterest(outstanding, loan.getAnnualRate(), loan.getEmi());
            if (monthsNow < 0 || interestNow == null) {
                out.add(new LumpSumOption(LumpSumOption.Kind.PREPAY, loan.getId(), name, applied,
                        null, null, closes, emiFreed, loan.getAnnualRate(), null, null, null, runwayAfter,
                        "This loan's EMI doesn't cover its own monthly interest, so it has no payoff date to bring forward."));
                continue;
            }
            int sooner;
            BigDecimal saved;
            if (closes) {
                sooner = monthsNow;
                saved = interestNow;
            } else {
                BigDecimal left = outstanding.subtract(applied);
                sooner = monthsNow - calculator.impliedEmis(left, loan.getAnnualRate(), loan.getEmi());
                saved = interestNow.subtract(calculator.totalInterest(left, loan.getAnnualRate(), loan.getEmi()));
            }
            out.add(new LumpSumOption(LumpSumOption.Kind.PREPAY, loan.getId(), name, applied,
                    sooner, MoneyScale.normalise(saved.max(BigDecimal.ZERO)), closes, emiFreed, loan.getAnnualRate(),
                    null, null, null, runwayAfter, null));
        }
        // Interest saved, most first - every entry in the same rupees, so this ranking is defensible.
        out.sort(Comparator.comparing(
                (LumpSumOption o) -> o.interestSaved() == null ? BigDecimal.valueOf(-1) : o.interestSaved(),
                Comparator.reverseOrder()));
        return out;
    }

    private List<LumpSumOption> goalOptions(BigDecimal amount, Runway runway) {
        Map<Long, GoalFeasibility> before = feasibility.assess().stream()
                .collect(Collectors.toMap(GoalFeasibility::goalId, Function.identity(), (a, b) -> a));
        List<LumpSumOption> out = new ArrayList<>();
        for (GoalFeasibility f : before.values()) {
            if (f.stillNeeded() == null || f.stillNeeded().signum() <= 0) {
                continue;
            }
            BigDecimal applied = MoneyScale.normalise(amount.min(f.stillNeeded()));
            GoalFeasibility after = feasibility.assessWith(f.goalId(), applied);
            GoalFeasibility.State afterState = after == null ? GoalFeasibility.State.COVERED_BY_PLAN : after.state();
            String afterReason = after == null ? "That reaches the target." : after.reason();
            // Money saved towards a goal stays in the user's own accounts, so it stays reachable:
            // runway is unchanged. That is the honest difference from prepaying.
            out.add(new LumpSumOption(LumpSumOption.Kind.GOAL, f.goalId(), f.name(), applied,
                    null, null, false, null, null, f.state(), afterState, afterReason,
                    runway.isKnown() ? runway.months() : null, null));
        }
        out.sort(Comparator.comparing((LumpSumOption o) -> o.targetName()));
        return out;
    }

    /** Runway after spending {@code spent} of reachable money, with {@code emiFreed} no longer due each month. */
    private static BigDecimal runwayAfter(Runway runway, BigDecimal spent, BigDecimal emiFreed) {
        if (!runway.isKnown() || runway.liquidTotal() == null || runway.monthlyEssentials() == null) {
            return null;
        }
        BigDecimal essentials = runway.monthlyEssentials().subtract(emiFreed == null ? BigDecimal.ZERO : emiFreed);
        if (essentials.signum() <= 0) {
            return null;
        }
        BigDecimal liquid = runway.liquidTotal().subtract(spent).max(BigDecimal.ZERO);
        return liquid.divide(essentials, 1, RoundingMode.DOWN); // same rounding as RunwayCalculator
    }
}
