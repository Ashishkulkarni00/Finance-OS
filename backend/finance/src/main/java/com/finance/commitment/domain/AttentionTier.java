package com.finance.commitment.domain;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * How urgently a commitment instance needs the user, as distinct from its raw status.
 * "Pending" alone says nothing about whether to act today - a due-in-20-days item and a
 * due-tomorrow item share a status but not an urgency. See
 * docs/product/MONTH_EXPERIENCE.md §6 and docs/design/MONTH_TAB_UX_SPEC.md §6.
 *
 * <p>Deliberately three tiers, computed here once so Month's worklist, Today's Needs
 * You, and any future surface agree - the same reasoning as {@code CommitmentWorklistGroup}
 * it replaces.
 *
 * <p>Known simplification: does not consider whether the paying account is itself
 * projected to fall short before this instance's due date. That would need this
 * package to call into {@code ProjectionService}, which already depends back on
 * commitment instances - the same circular-dependency shape {@code CurrentCycleResolver}
 * exists to avoid elsewhere. Deferred rather than worked around.
 */
public enum AttentionTier {

    /** Act today - overdue, blocking the truth, or due within 2 days. */
    NEEDS_YOU,

    /** No action today, but shouldn't be a surprise later. */
    WORTH_KNOWING,

    /** Paid and confirmed. Visible, not competing for attention. */
    SETTLED;

    public static AttentionTier of(CommitmentInstance instance, Commitment commitment, LocalDate today) {
        CommitmentInstanceStatus status = instance.getStatus();
        // Skipped is done for the cycle too: nothing to act on, nothing owed.
        if (status.isClosed()) {
            return SETTLED;
        }

        if (status == CommitmentInstanceStatus.NEEDS_REVIEW) {
            return NEEDS_YOU;
        }
        // Money coming in asks nothing of you until it's late - then it's worth checking the
        // bank and recording it, since the plan is counting on it.
        if (commitment.getSettleAs() == com.finance.transaction.domain.TransactionType.INCOME) {
            return status == CommitmentInstanceStatus.OVERDUE ? NEEDS_YOU : WORTH_KNOWING;
        }
        if (commitment.isMandatory() && instance.getExpectedAmount() == null) {
            return NEEDS_YOU;
        }

        boolean overdue = status == CommitmentInstanceStatus.OVERDUE;
        if (overdue) {
            // Overdue is already the strongest possible time signal - only mandatory
            // overdue items are Tier 1. An optional overdue item (its due date is in
            // the past) must NOT fall into the "due within 2 days" check below, which
            // would otherwise catch it trivially (any past date satisfies <= 2).
            return commitment.isMandatory() ? NEEDS_YOU : WORTH_KNOWING;
        }

        long daysUntilDue = ChronoUnit.DAYS.between(today, instance.getDueDate());
        if (daysUntilDue <= 2) {
            return NEEDS_YOU;
        }

        return WORTH_KNOWING;
    }
}
