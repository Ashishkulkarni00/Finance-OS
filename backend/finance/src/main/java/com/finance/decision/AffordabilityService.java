package com.finance.decision;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.common.money.MoneyScale;
import com.finance.cycle.CurrentCycleResolver;
import com.finance.cycle.domain.Cycle;
import com.finance.common.user.CurrentUserProvider;
import com.finance.position.PositionResult;
import com.finance.position.PositionService;
import com.finance.projection.ProjectionResult;
import com.finance.projection.ProjectionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * "Can I afford this?" — the consequence of a spend, before it happens (ROADMAP 4.2).
 *
 * <p><strong>Nothing is written and nothing is recorded.</strong> This is a simulation over
 * the state the engines already compute: the position, and the chosen account's projection.
 * Remembering the decision afterwards is 4.1, which needs a table and is blocked behind the
 * migration freeze — so this answers the question without pretending to track the answer.
 *
 * <p><strong>Where the honesty lives.</strong> Three places, each a deliberate refusal:
 * <ul>
 *   <li><strong>An incomplete position gives no answer at all.</strong> If a mandatory bill
 *       has no amount, Free until salary is unknown, and a figure derived from an unknown
 *       would be the most confident wrong number this product could produce (ADR-0006).</li>
 *   <li><strong>The shortfall is found by re-walking the projection, not by comparing
 *       totals.</strong> An account can hold plenty today and still fail on the 27th. The
 *       only way to know which payment breaks is to take the amount off the running balance
 *       and see which deduction first drops below the floor — the same walk
 *       {@code ShortfallRule} reads, with one extra withdrawal in it.</li>
 *   <li><strong>"Tightens" is measured against the rate, not against a rupee threshold.</strong>
 *       ₹5,000 is nothing on one month and everything on another. A third of the remaining
 *       day rate is a proportion of the user's own situation rather than a number invented
 *       here.</li>
 * </ul>
 *
 * <p><strong>Read-only, so a GET.</strong> It changes nothing, it is safe to call on every
 * keystroke behind a debounce, and it must never appear in the Ledger.
 */
@Service
public class AffordabilityService {

    /**
     * Past this share of the day rate, the spend is worth remarking on.
     *
     * <p>A third: below it the month absorbs the spend without the reader needing to think,
     * above it the rate they live on visibly moves. Expressed as a proportion rather than an
     * amount on purpose — a fixed rupee threshold would be loud on a lean month and silent
     * on a flush one, which is backwards.
     */
    private static final BigDecimal NOTABLE_SHARE_OF_DAY_RATE = new BigDecimal("0.33");

    private final PositionService positionService;
    private final ProjectionService projectionService;
    private final AccountService accountService;
    private final CurrentCycleResolver cycleResolver;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public AffordabilityService(PositionService positionService, ProjectionService projectionService,
                                AccountService accountService, CurrentCycleResolver cycleResolver,
                                CurrentUserProvider currentUser, Clock clock) {
        this.positionService = positionService;
        this.projectionService = projectionService;
        this.accountService = accountService;
        this.cycleResolver = cycleResolver;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AffordabilityResult check(BigDecimal amount, Long accountId) {
        Long userId = currentUser.currentUserId();
        LocalDate today = LocalDate.now(clock);
        Cycle cycle = cycleResolver.resolve(userId, today);
        int daysToSalary = (int) ChronoUnit.DAYS.between(today, cycle.getEndDate()) + 1;

        Account account = accountService.getById(accountId);
        PositionResult position = positionService.currentPosition();

        if (!position.complete()) {
            return new AffordabilityResult(AffordabilityResult.State.INCOMPLETE, amount,
                    account.getId(), account.getName(),
                    null, null, null, null, daysToSalary,
                    null, null, null, null, null,
                    "A bill this month still has no amount, so what's free can't be known yet - "
                            + "and an answer built on that would be a guess.");
        }

        BigDecimal freeBefore = position.realBalance();
        BigDecimal freeAfter = MoneyScale.normalise(freeBefore.subtract(amount));
        BigDecimal perDayBefore = position.perDay();
        // Never below zero: "−₹34 a day" is not a rate anyone can spend to, and the states
        // below already say what has gone wrong without a negative pretending to be a rate.
        BigDecimal perDayAfter = freeAfter.signum() <= 0
                ? BigDecimal.ZERO
                : freeAfter.divide(BigDecimal.valueOf(Math.max(daysToSalary, 1)), 2, RoundingMode.HALF_UP);

        ProjectionResult projection = projectionService.projectAccount(accountId);
        BigDecimal balanceBefore = projection.currentBalance();
        BigDecimal balanceAfter = MoneyScale.normalise(balanceBefore.subtract(amount));

        if (balanceAfter.signum() < 0) {
            return new AffordabilityResult(AffordabilityResult.State.EXCEEDS_ACCOUNT, amount,
                    account.getId(), account.getName(),
                    freeBefore, freeAfter, perDayBefore, perDayAfter, daysToSalary,
                    balanceBefore, balanceAfter, null, null, null, null);
        }

        Broken broken = firstBrokenBy(projection, amount, floorFor(account));
        if (broken != null) {
            return new AffordabilityResult(AffordabilityResult.State.SHORTFALL, amount,
                    account.getId(), account.getName(),
                    freeBefore, freeAfter, perDayBefore, perDayAfter, daysToSalary,
                    balanceBefore, balanceAfter,
                    broken.name(), broken.on(), broken.shortBy(), null);
        }

        // A comparison against the user's own rate, not against a number chosen here.
        boolean notable = perDayBefore.signum() > 0
                && amount.compareTo(perDayBefore.multiply(NOTABLE_SHARE_OF_DAY_RATE)) > 0;
        return new AffordabilityResult(
                notable ? AffordabilityResult.State.TIGHTENS : AffordabilityResult.State.FITS,
                amount, account.getId(), account.getName(),
                freeBefore, freeAfter, perDayBefore, perDayAfter, daysToSalary,
                balanceBefore, balanceAfter, null, null, null, null);
    }

    /**
     * The first dated payment that stops being covered once this amount has also left.
     *
     * <p>Walks the projection's own deductions, which are already in due-date order, taking
     * the spend off the opening balance. A payment already uncovered before the spend is
     * skipped: it is somebody else's warning (`ShortfallRule` raises it), and blaming this
     * decision for a hole that predates it would be wrong.
     */
    private Broken firstBrokenBy(ProjectionResult projection, BigDecimal amount, BigDecimal floor) {
        BigDecimal running = projection.currentBalance().subtract(amount);
        BigDecimal withoutSpend = projection.currentBalance();
        for (ProjectionResult.Deduction deduction : projection.deductions()) {
            if (deduction.amount() == null) {
                continue;
            }
            running = running.subtract(deduction.amount());
            withoutSpend = withoutSpend.subtract(deduction.amount());
            boolean brokenNow = running.compareTo(floor) < 0;
            boolean brokenAnyway = withoutSpend.compareTo(floor) < 0;
            if (brokenNow && !brokenAnyway) {
                return new Broken(deduction.name(), deduction.dueDate(),
                        MoneyScale.normalise(floor.subtract(running)));
            }
        }
        return null;
    }

    /** The level an account must not drop below: its minimum balance where one is set, else zero. */
    private BigDecimal floorFor(Account account) {
        return account.getMinimumBalance() == null || !account.isMinimumBalanceMandatory()
                ? BigDecimal.ZERO
                : account.getMinimumBalance();
    }

    private record Broken(String name, LocalDate on, BigDecimal shortBy) {
    }
}
