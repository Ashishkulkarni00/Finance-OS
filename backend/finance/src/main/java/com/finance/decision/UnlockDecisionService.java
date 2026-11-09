package com.finance.decision;

import com.finance.goal.GoalService;
import com.finance.goal.GoalView;
import com.finance.loan.AmortisationCalculator;
import com.finance.loan.LoanService;
import com.finance.loan.LoanView;
import com.finance.loan.domain.Loan;
import com.finance.loan.domain.LoanStatus;
import com.finance.common.money.MoneyScale;
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
 * What freed-up money could do — ROADMAP 4.4.
 *
 * <p>When a loan's last EMI goes, or a bill stops, ₹X a month stops leaving. The forecast
 * already knows this and Ahead already says it. This turns the statement into a set of
 * costed choices: what that money would do on each loan, on each goal, or kept.
 *
 * <p><strong>Nothing is recommended and nothing is ranked across kinds.</strong> Loans sort
 * by interest saved because that is a hard number; goals sort by how much sooner they land.
 * The two lists are never merged into one ranking, because doing so would need an exchange
 * rate between "saves ₹14,200" and "the emergency fund is ready in March instead of
 * September" — and that rate belongs to the person, not to this file. Keeping the money is
 * always offered and always last, never worded as the lazy choice.
 *
 * <p><strong>An option that cannot be costed says so.</strong> A loan without a rate cannot
 * be projected, so it appears with {@code unknownReason} rather than being dropped: leaving
 * it out would quietly shorten the list of things the user could do, which is a worse
 * failure than admitting the gap (ADR-0006).
 *
 * <p>Read-only. Remembering which option was taken is 4.1, which needs a table and is
 * blocked behind the migration freeze.
 */
@Service
public class UnlockDecisionService {

    private final LoanService loanService;
    private final GoalService goalService;
    private final AmortisationCalculator calculator;
    private final Clock clock;

    public UnlockDecisionService(LoanService loanService, GoalService goalService,
                                 AmortisationCalculator calculator, Clock clock) {
        this.loanService = loanService;
        this.goalService = goalService;
        this.calculator = calculator;
        this.clock = clock;
    }

    /** {@link #optionsFor(BigDecimal, LocalDate)} for money that is free from today. */
    @Transactional(readOnly = true)
    public List<UnlockOption> optionsFor(BigDecimal amount) {
        return optionsFor(amount, null);
    }

    /**
     * Every option for {@code amount} a month, loans first, then goals, then keeping it.
     *
     * <p>{@code startsOn} is when the money actually becomes free - an EMI ending in
     * February frees nothing in November. Each loan and goal is first carried forward at
     * its current pace to that date, and only then is the extra applied. Without it, a goal
     * would appear to land months early, and the loan that is ending would be offered as a
     * place to put its own freed EMI. Null or past means today.
     */
    @Transactional(readOnly = true)
    public List<UnlockOption> optionsFor(BigDecimal amount, LocalDate startsOn) {
        LocalDate today = LocalDate.now(clock);
        LocalDate start = startsOn == null || startsOn.isBefore(today) ? today : startsOn;
        int monthsUntil = (int) ChronoUnit.MONTHS.between(today, start);

        List<UnlockOption> loans = loanOptions(amount, monthsUntil, start);
        List<UnlockOption> goals = goalOptions(amount, start, monthsUntil);

        List<UnlockOption> out = new ArrayList<>(loans.size() + goals.size() + 1);
        out.addAll(loans);
        out.addAll(goals);
        out.add(new UnlockOption(UnlockOption.Kind.KEEP, null, "Keep it", amount,
                null, null, null, null, null));
        return out;
    }

    /**
     * Each running loan, with what adding this to its EMI would do.
     *
     * <p>Sorted by interest saved, most first — the one place in this service where a
     * ranking is defensible, because every entry is measured in the same rupees. Loans that
     * cannot be projected sink to the bottom rather than being dropped.
     */
    private List<UnlockOption> loanOptions(BigDecimal amount, int monthsUntil, LocalDate start) {
        List<UnlockOption> out = new ArrayList<>();
        for (LoanView view : loanService.list(Pageable.unpaged()).getContent()) {
            Loan loan = view.loan();
            if (loan.getStatus() == LoanStatus.CLOSED) {
                continue;
            }
            // The account's name, not the lender's: one lender often holds several loans (two
            // HDFC card EMIs here), and a choice between two identical labels isn't a choice.
            String name = view.account() != null ? view.account().getName() : loan.getLender();
            BigDecimal outstanding = view.outstandingPrincipal() == null
                    ? loan.getOutstandingBalance() : view.outstandingPrincipal();

            // Ends before the money arrives - including the very loan whose end freed it. Its own
            // payoff date is the authority; the month count below is only an approximation of it.
            if (view.payoffDate() != null && start != null && view.payoffDate().isBefore(start)) {
                continue;
            }
            if (outstanding != null && loan.getAnnualRate() != null && monthsUntil > 0) {
                // Where this loan will stand when the money arrives, at its own EMI. One that
                // has cleared by then - including the very loan whose end freed this money -
                // is no longer somewhere to put it.
                outstanding = calculator.balanceAfter(outstanding, loan.getAnnualRate(), loan.getEmi(), monthsUntil);
                if (outstanding.signum() <= 0) {
                    continue;
                }
            } else if (monthsUntil > 0 && view.emisLeft() <= monthsUntil) {
                continue;
            }

            if (loan.getAnnualRate() == null || outstanding == null || outstanding.signum() <= 0) {
                out.add(new UnlockOption(UnlockOption.Kind.LOAN, loan.getId(), name, amount,
                        null, null, null, null,
                        "This loan has no interest rate recorded, so what the extra would save can't be worked out."));
                continue;
            }

            int now = calculator.impliedEmis(outstanding, loan.getAnnualRate(), loan.getEmi());
            int faster = calculator.impliedEmis(outstanding, loan.getAnnualRate(), loan.getEmi().add(amount));
            if (now < 0 || faster < 0) {
                out.add(new UnlockOption(UnlockOption.Kind.LOAN, loan.getId(), name, amount,
                        null, null, null, null,
                        "This loan's EMI doesn't cover its own monthly interest, so it has no payoff date to improve."));
                continue;
            }

            // Summed interest on each path. Not EMI x count: the final payment is partial, and
            // charging it as a full EMI overstated the faster path enough to report ₹0 saved
            // on a loan that clears eight months sooner.
            BigDecimal saved = MoneyScale.normalise(
                    calculator.totalInterest(outstanding, loan.getAnnualRate(), loan.getEmi())
                            .subtract(calculator.totalInterest(outstanding, loan.getAnnualRate(),
                                    loan.getEmi().add(amount))));

            if (now - faster <= 0) {
                continue; // on its last EMI - extra money can't end it any sooner
            }
            out.add(new UnlockOption(UnlockOption.Kind.LOAN, loan.getId(), name, amount,
                    now - faster, saved.signum() > 0 ? saved : BigDecimal.ZERO,
                    null, null, null));
        }
        out.sort(Comparator.comparing(
                (UnlockOption o) -> o.interestSaved() == null ? BigDecimal.valueOf(-1) : o.interestSaved(),
                Comparator.reverseOrder()));
        return out;
    }

    /**
     * Each unmet goal, with when it would land instead.
     *
     * <p>A goal whose current funding is unknown gets a date but no "sooner by": with no
     * honest pace to compare against, a months-sooner figure would be invented. The goal
     * still appears, because "this would reach it by March" is useful on its own.
     */
    private List<UnlockOption> goalOptions(BigDecimal amount, LocalDate start, int monthsUntil) {
        List<UnlockOption> out = new ArrayList<>();

        for (GoalView view : goalService.list(false, Pageable.unpaged()).getContent()) {
            BigDecimal target = view.goal().getTargetAmount();
            if (target == null) {
                continue;
            }
            // Due before the money is free: it can't help, and offering it would be a date
            // after the deadline dressed up as an option.
            if (view.goal().getTargetDate() != null && view.goal().getTargetDate().isBefore(start)) {
                continue;
            }
            BigDecimal saved = view.currentAmount() == null ? BigDecimal.ZERO : view.currentAmount();
            BigDecimal remaining = target.subtract(saved);
            if (remaining.signum() <= 0) {
                continue;
            }

            BigDecimal funded = view.fundingVaries() > 0 ? null : view.fundedPerMonth();
            if (funded != null && monthsUntil > 0) {
                // Carried forward at its own pace to the day the money arrives; a goal met
                // before then needs none of it.
                remaining = remaining.subtract(funded.multiply(BigDecimal.valueOf(monthsUntil)));
                if (remaining.signum() <= 0) {
                    continue;
                }
            }
            BigDecimal withExtra = (funded == null ? BigDecimal.ZERO : funded).add(amount);
            int monthsWith = months(remaining, withExtra);
            if (monthsWith < 0) {
                continue;
            }

            Integer sooner = null;
            if (funded != null && funded.signum() > 0) {
                int monthsNow = months(remaining, funded);
                if (monthsNow >= 0) {
                    sooner = monthsNow - monthsWith;
                }
            }

            out.add(new UnlockOption(UnlockOption.Kind.GOAL, view.goal().getId(), view.goal().getName(), amount,
                    null, null, start.plusMonths(monthsWith), sooner,
                    funded == null
                            ? "What goes in each month varies, so there's no current pace to compare this against."
                            : null));
        }
        // Soonest first: the goal this money finishes quickest is the one worth seeing first.
        out.sort(Comparator.comparing(UnlockOption::reachesOn, Comparator.nullsLast(Comparator.naturalOrder())));
        return out;
    }

    /** Whole months to cover {@code remaining} at {@code perMonth}, or -1 when it never does. */
    private int months(BigDecimal remaining, BigDecimal perMonth) {
        if (perMonth == null || perMonth.signum() <= 0) {
            return -1;
        }
        return remaining.divide(perMonth, 0, RoundingMode.CEILING).intValue();
    }
}
