package com.finance.commitment;

import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * The state-transition logic from the diagram in {@code CommitmentInstanceStatus} -
 * pure, no repository or service access, so both the manual settle path
 * ({@code CommitmentInstanceServiceImpl}) and the auto-match path
 * ({@code CommitmentAutoMatcher}) apply exactly the same rule without either one
 * depending on the other's service (which would create a circular bean dependency,
 * since auto-matching runs inside transaction creation itself).
 */
@Component
public class CommitmentSettlementCalculator {

    public record Result(CommitmentInstanceStatus status, BigDecimal confirmedAmountTotal) {
    }

    public Result apply(CommitmentInstance instance, boolean requiresVerification, boolean accountMatches,
                        BigDecimal paymentAmount) {
        BigDecimal totalConfirmed = (instance.getConfirmedAmount() == null ? BigDecimal.ZERO : instance.getConfirmedAmount())
                .add(paymentAmount);

        if (!accountMatches) {
            return new Result(CommitmentInstanceStatus.NEEDS_REVIEW, totalConfirmed);
        }

        BigDecimal expected = instance.getExpectedAmount();
        boolean fullyPaid = expected == null || totalConfirmed.compareTo(expected) >= 0;

        if (!fullyPaid) {
            return new Result(CommitmentInstanceStatus.PART_PAID, totalConfirmed);
        }
        // A requiresVerification commitment can never auto-reach PAID directly - see
        // CommitmentInstanceStatus's diagram. Confirming is a separate, explicit step.
        return new Result(requiresVerification ? CommitmentInstanceStatus.UNVERIFIED : CommitmentInstanceStatus.PAID,
                totalConfirmed);
    }

    /**
     * Expected income is received, not paid down: one income entry settles it whatever the
     * amount, and what arrived replaces what was expected. A salary ₹800 short is not
     * "part-received" with ₹800 still to come - treating it that way would count money
     * that is never arriving.
     */
    public Result receive(CommitmentInstance instance, boolean requiresVerification, boolean accountMatches,
                          BigDecimal receivedAmount) {
        BigDecimal totalReceived = (instance.getConfirmedAmount() == null ? BigDecimal.ZERO : instance.getConfirmedAmount())
                .add(receivedAmount);
        if (!accountMatches) {
            return new Result(CommitmentInstanceStatus.NEEDS_REVIEW, totalReceived);
        }
        return new Result(requiresVerification ? CommitmentInstanceStatus.UNVERIFIED : CommitmentInstanceStatus.PAID,
                totalReceived);
    }

    /** The rule for this bill's kind of payment. */
    public Result settle(CommitmentInstance instance, com.finance.commitment.domain.Commitment commitment,
                         boolean accountMatches, BigDecimal amount) {
        return commitment.getSettleAs() == com.finance.transaction.domain.TransactionType.INCOME
                ? receive(instance, commitment.isRequiresVerification(), accountMatches, amount)
                : apply(instance, commitment.isRequiresVerification(), accountMatches, amount);
    }
}
