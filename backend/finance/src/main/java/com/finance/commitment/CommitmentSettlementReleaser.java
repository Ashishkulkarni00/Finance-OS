package com.finance.commitment;

import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstancePayment;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.common.money.MoneyScale;
import com.finance.loan.LoanPaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Lets a bill go of a payment - the other half of {@code settle}, which did not exist.
 *
 * <p><strong>The gap this closes.</strong> Deleting a transaction soft-deleted the row and
 * left every occurrence it had settled still marked PAID, still pointing at it. Found in
 * real use on 2026-10-29: five occurrences claimed to be paid by entries that no longer
 * existed, and the month reported ₹2,07,697 of income against a single ₹1,03,997 credit,
 * because the phantom settlements were counted alongside the real one. There was no way
 * back through the API either - {@code settle} refuses a second time and {@code skip}
 * refuses anything with a payment linked - so correcting a mis-recorded entry, which is an
 * entirely ordinary thing to do, had no undo at all.
 *
 * <p><strong>A component, not a service call.</strong> Reached from both
 * {@code TransactionServiceImpl.delete} and {@code CommitmentInstanceServiceImpl.unsettle},
 * and it depends on repositories only. Routing it through {@code CommitmentInstanceService}
 * would close a bean cycle, since that service already depends on {@code TransactionService}
 * - the same reasoning that put {@code CommitmentAutoMatcher} at this layer.
 *
 * <p><strong>One payment is released, not the whole settlement.</strong> A bill can be paid
 * by several entries (V23); deleting one of them must subtract that one and recompute, not
 * discard the rest. Only when nothing is left does the occurrence go back to being unpaid.
 *
 * <p><strong>Known limitation, deliberate.</strong> {@code settle} fills in
 * {@code expectedAmount} when the bill had none, and releasing cannot tell that apart from
 * an amount the user typed - so the estimate is left in place. Leaving a usable figure is
 * the better failure: the alternative erases something the user may have entered by hand.
 */
@Component
public class CommitmentSettlementReleaser {

    private static final Logger log = LoggerFactory.getLogger(CommitmentSettlementReleaser.class);

    private final CommitmentInstanceRepository instances;
    private final CommitmentInstancePaymentRepository payments;
    private final LoanPaymentRepository loanPayments;
    private final Clock clock;

    public CommitmentSettlementReleaser(CommitmentInstanceRepository instances,
                                        CommitmentInstancePaymentRepository payments,
                                        LoanPaymentRepository loanPayments,
                                        Clock clock) {
        this.instances = instances;
        this.payments = payments;
        this.loanPayments = loanPayments;
        this.clock = clock;
    }

    /**
     * Every bill this entry was paying stops counting it. Returns how many were affected.
     *
     * <p>Called when a transaction is deleted. Both routes are checked: the payments table,
     * which is the complete record, and {@code linkedTransactionId}, which is all an
     * occurrence settled before V23 has.
     */
    @Transactional
    public int releaseTransaction(Long transactionId, Long userId) {
        List<CommitmentInstancePayment> paid = payments.findByUserIdAndTransactionId(userId, transactionId);

        Set<Long> affected = new LinkedHashSet<>();
        paid.forEach(payment -> affected.add(payment.getCommitmentInstanceId()));
        instances.findByUserIdAndLinkedTransactionId(userId, transactionId)
                .forEach(instance -> affected.add(instance.getId()));

        if (affected.isEmpty()) {
            return 0;
        }

        payments.deleteAll(paid);
        // The loan's balance already ignores a deleted transaction (`findPaidAmounts` filters
        // on `deleted_at`), but the row still occupies its period and would block the
        // corrected payment being recorded against it.
        loanPayments.findByTransactionIdAndUserId(transactionId, userId).ifPresent(loanPayments::delete);

        affected.forEach(instanceId -> instances.findByIdAndUserId(instanceId, userId)
                .ifPresent(instance -> recompute(instance, userId)));

        log.info("Released transaction from {} commitment instance(s)", affected.size());
        return affected.size();
    }

    /** "I linked the wrong entry" - every payment on this occurrence is let go. */
    @Transactional
    public CommitmentInstance release(CommitmentInstance instance) {
        Long userId = instance.getUserId();
        List<CommitmentInstancePayment> paid = payments
                .findByUserIdAndCommitmentInstanceIdOrderByRecordedAtAsc(userId, instance.getId());

        paid.forEach(payment -> loanPayments
                .findByTransactionIdAndUserId(payment.getTransactionId(), userId)
                .ifPresent(loanPayments::delete));
        if (instance.getLinkedTransactionId() != null) {
            loanPayments.findByTransactionIdAndUserId(instance.getLinkedTransactionId(), userId)
                    .ifPresent(loanPayments::delete);
        }
        payments.deleteAll(paid);

        CommitmentInstance released = recompute(instance, userId);
        log.info("Commitment instance released id={} status={}", released.getId(), released.getStatus());
        return released;
    }

    /**
     * Restates an occurrence from the payments that are still against it.
     *
     * <p>Derived, never patched: the status and the confirmed total are read back off the
     * remaining rows rather than adjusted by the amount that went, so a release cannot leave
     * the two disagreeing (ADR-0011's reasoning, applied to a write).
     */
    private CommitmentInstance recompute(CommitmentInstance instance, Long userId) {
        List<CommitmentInstancePayment> remaining = payments
                .findByUserIdAndCommitmentInstanceIdOrderByRecordedAtAsc(userId, instance.getId());

        if (remaining.isEmpty()) {
            instance.setStatus(instance.getDueDate().isBefore(LocalDate.now(clock))
                    ? CommitmentInstanceStatus.OVERDUE : CommitmentInstanceStatus.PENDING);
            instance.setConfirmedAmount(null);
            instance.setConfirmedAt(null);
            instance.setLinkedTransactionId(null);
            return instances.save(instance);
        }

        BigDecimal paidTotal = remaining.stream()
                .map(CommitmentInstancePayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expected = instance.getExpectedAmount();

        instance.setConfirmedAmount(MoneyScale.normalise(paidTotal));
        // Still the most recent payment, as settle leaves it - the full record is the table.
        instance.setLinkedTransactionId(remaining.get(remaining.size() - 1).getTransactionId());
        instance.setStatus(expected != null && paidTotal.compareTo(expected) < 0
                ? CommitmentInstanceStatus.PART_PAID : CommitmentInstanceStatus.PAID);
        return instances.save(instance);
    }
}
