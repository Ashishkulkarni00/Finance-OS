package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.cycle.CurrentCycleResolver;
import com.finance.cycle.domain.Cycle;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.domain.Transaction;
import com.finance.transaction.domain.TransactionType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

/**
 * Links a payment to a bill occurrence by amount + account + a date window - "auto-match...
 * manual link as fallback" from {@code CLAUDE.md}'s M4 (here, M3) requirement. Silently
 * does nothing when the match is ambiguous or absent; it never guesses.
 *
 * <p>Runs from both directions:
 * <ul>
 *   <li>{@link #tryMatch} - a new expense looks for an open occurrence it pays.</li>
 *   <li>{@link #tryMatchExisting} - a new occurrence looks for an expense already recorded.
 *       Without this, a bill added after it was paid (the common "I forgot to add it"
 *       case) sat unpaid next to its own payment in the Ledger, and settling it from the
 *       Settle sheet would have recorded the same money a second time - rule 4.</li>
 * </ul>
 *
 * <p>Deliberately reads repositories directly rather than going through
 * {@code CommitmentInstanceService} - this runs inside {@code TransactionServiceImpl.create},
 * and that service depending on one that itself depends on {@code TransactionService}
 * (for manual settle's transaction lookup) would be a circular bean dependency. See the
 * equivalent note on {@code AccountBalanceCalculator}.
 */
@Component
public class CommitmentAutoMatcher {

    private static final Logger log = LoggerFactory.getLogger(CommitmentAutoMatcher.class);
    private static final long MATCH_WINDOW_DAYS = 3;
    /** Salary moves with weekends and bank holidays more than a bill's debit does. */
    private static final long INCOME_WINDOW_DAYS = 5;
    /** Salary varies a little (deductions, reimbursements) - within this share of the
     *  expected amount it is still "the salary"; beyond it, it's left for the user to link. */
    private static final BigDecimal INCOME_TOLERANCE = new BigDecimal("0.20");

    private final CommitmentInstanceRepository instanceRepository;
    private final CommitmentRepository commitmentRepository;
    private final CommitmentSettlementCalculator calculator;
    private final CurrentCycleResolver cycleResolver;
    private final TransactionRepository transactionRepository;
    private final CommitmentInstancePaymentRepository payments;
    private final com.finance.loan.LoanPaymentRecorder loanPayments;

    public CommitmentAutoMatcher(CommitmentInstanceRepository instanceRepository,
                                 CommitmentRepository commitmentRepository,
                                 CommitmentSettlementCalculator calculator,
                                 CurrentCycleResolver cycleResolver,
                                 TransactionRepository transactionRepository,
                                 CommitmentInstancePaymentRepository payments,
                                 com.finance.loan.LoanPaymentRecorder loanPayments) {
        this.payments = payments;
        this.loanPayments = loanPayments;
        this.instanceRepository = instanceRepository;
        this.commitmentRepository = commitmentRepository;
        this.calculator = calculator;
        this.cycleResolver = cycleResolver;
        this.transactionRepository = transactionRepository;
    }

    /**
     * A newly created entry looks for the one open occurrence it pays: a bill paid the same
     * way (an expense for most bills; a transfer, investment or income for the others),
     * from the same account, to the same destination when the bill names one.
     */
    public void tryMatch(Transaction transaction) {
        if (transaction.getType() == TransactionType.REFUND) {
            return;
        }

        boolean income = transaction.getType() == TransactionType.INCOME;
        List<Cycle> cycles = new java.util.ArrayList<>();
        cycleResolver.resolveExistingOnly(transaction.getUserId(), transaction.getDate()).ifPresent(cycles::add);
        if (income) {
            // A salary that lands a day or two early falls in the cycle before the one it
            // starts - look at the next cycle too.
            cycleResolver.resolveExistingOnly(transaction.getUserId(), transaction.getDate().plusDays(INCOME_WINDOW_DAYS))
                    .filter(next -> cycles.stream().noneMatch(c -> c.getId().equals(next.getId())))
                    .ifPresent(cycles::add);
        }
        if (cycles.isEmpty()) {
            // No cycle materialised for this date yet - nothing generated against it to match.
            return;
        }

        List<CommitmentInstance> candidates = cycles.stream()
                .flatMap(cycle -> instanceRepository.findOpenForCycleAndAccount(
                        transaction.getUserId(), cycle.getId(), transaction.getAccountId()).stream())
                .toList();

        Map<Long, Commitment> rules = commitmentRepository.findAllById(
                        candidates.stream().map(CommitmentInstance::getCommitmentId).toList()).stream()
                .collect(Collectors.toMap(Commitment::getId, c -> c));
        List<CommitmentInstance> matches = candidates.stream()
                .filter(ci -> paidTheSameWay(rules.get(ci.getCommitmentId()), transaction))
                .filter(ci -> Math.abs(ChronoUnit.DAYS.between(ci.getDueDate(), transaction.getDate())) <= windowDays(income))
                .filter(ci -> amountFits(ci.getExpectedAmount(), transaction.getAmount(), income))
                .toList();

        if (matches.size() != 1) {
            // Zero or ambiguous - never guess. Left for POST /commitment-instances/{id}/settle.
            return;
        }

        CommitmentInstance instance = matches.get(0);
        Commitment commitment = commitmentRepository.findById(instance.getCommitmentId()).orElse(null);
        if (commitment == null) {
            return;
        }
        link(instance, commitment, transaction);
    }

    /**
     * A newly generated (or restored) occurrence looks for the one expense already
     * recorded that pays it: same account, within the window of its due date, the same
     * amount when the amount is known, and not already paying another bill. Anything
     * other than exactly one candidate is left alone for the user to settle or link.
     */
    public void tryMatchExisting(CommitmentInstance instance) {
        if (instance.getLinkedTransactionId() != null
                || (instance.getStatus() != CommitmentInstanceStatus.PENDING
                    && instance.getStatus() != CommitmentInstanceStatus.OVERDUE)) {
            return;
        }
        Commitment commitment = commitmentRepository.findById(instance.getCommitmentId()).orElse(null);
        if (commitment == null || commitment.isDeleted()) {
            return;
        }

        boolean income = commitment.getSettleAs() == TransactionType.INCOME;
        // **Plan, deliberately** (M1 register, ADR-0020). Both accounts here are the
        // commitment's own, and unlike every other reader this one should keep it that way:
        // auto-matching links a bill without being asked, so a loose match is a silent wrong
        // answer rather than a choice someone made. Narrowing to the planned accounts is what
        // keeps it from guessing. A payment from somewhere else is still linkable - the user
        // does it on the Settle sheet, where they can see what they are agreeing to.
        List<Transaction> matches = transactionRepository.findUnlinkedForMatch(
                        instance.getUserId(), commitment.getSettleAs(), commitment.getAccountId(),
                        commitment.getToAccountId(),
                        instance.getDueDate().minusDays(windowDays(income)),
                        instance.getDueDate().plusDays(windowDays(income))).stream()
                // Amount known: it must match to the paisa. Amount unknown (a variable bill
                // like electricity): "the one expense on that account that week" is far too
                // loose to link retroactively - it would happily mark the bill paid by a ₹400
                // bar tab - so the expense must also be in the bill's own category, and a
                // bill with neither an amount nor a category is never auto-linked at all.
                .filter(t -> instance.getExpectedAmount() != null
                        ? amountFits(instance.getExpectedAmount(), t.getAmount(), income)
                        : commitment.getCategoryId() != null && commitment.getCategoryId().equals(t.getCategoryId()))
                .toList();

        if (matches.size() != 1) {
            return;
        }
        link(instance, commitment, matches.get(0));
    }

    private static long windowDays(boolean income) {
        return income ? INCOME_WINDOW_DAYS : MATCH_WINDOW_DAYS;
    }

    /** A bill's payment matches to the paisa; income within {@link #INCOME_TOLERANCE}. */
    private static boolean amountFits(BigDecimal expected, BigDecimal actual, boolean income) {
        if (expected == null) {
            return true;
        }
        if (!income) {
            return expected.compareTo(actual) == 0;
        }
        return expected.subtract(actual).abs().compareTo(expected.multiply(INCOME_TOLERANCE)) <= 0;
    }

    /** The entry is the kind this bill is paid with, and goes where the bill says. */
    private static boolean paidTheSameWay(Commitment rule, Transaction transaction) {
        if (rule == null || rule.getSettleAs() != transaction.getType()) {
            return false;
        }
        return rule.getToAccountId() == null || rule.getToAccountId().equals(transaction.getToAccountId());
    }

    private void link(CommitmentInstance instance, Commitment commitment, Transaction transaction) {
        CommitmentSettlementCalculator.Result result = calculator.settle(
                instance, commitment, true, transaction.getAmount());

        instance.setStatus(result.status());
        instance.setConfirmedAmount(result.confirmedAmountTotal());
        if (instance.getExpectedAmount() == null) {
            instance.setExpectedAmount(result.confirmedAmountTotal());
        }
        instance.setConfirmedAt(Instant.now());
        instance.setLinkedTransactionId(transaction.getId());
        CommitmentInstance saved = instanceRepository.save(instance);

        // **The same two records a manual settle writes.** Auto-matching used to stop at the
        // status, so a bank EMI recorded as an expense marked the bill paid while the loan
        // never heard of it - on real data every bank-paid EMI since October read
        // "unrecorded", net worth over-stated what was owed, and Momentum couldn't say debt was
        // falling. Found 2026-11-09. Same conditions as CommitmentInstanceServiceImpl.settle.
        payments.save(com.finance.commitment.domain.CommitmentInstancePayment.builder()
                .userId(saved.getUserId())
                .commitmentInstanceId(saved.getId())
                .transactionId(transaction.getId())
                .amount(transaction.getAmount())
                .recordedAt(Instant.now())
                .build());
        if (commitment.getSourceType() == com.finance.commitment.domain.CommitmentSource.LOAN
                && commitment.getSourceId() != null
                && saved.getStatus() == com.finance.commitment.domain.CommitmentInstanceStatus.PAID
                && org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            loanPayments.record(commitment.getSourceId(), saved.getUserId(), saved.getDueDate(), transaction.getId());
        }

        // Ids and status only - never the amount (ADR-0010).
        log.info("Commitment instance auto-matched id={} transactionId={} status={}",
                instance.getId(), transaction.getId(), result.status());
    }
}
