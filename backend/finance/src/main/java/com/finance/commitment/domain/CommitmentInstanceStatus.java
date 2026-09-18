package com.finance.commitment.domain;

/**
 * Where one cycle's occurrence of a commitment stands.
 *
 * <pre>
 * PENDING ──pay──► PAID
 *    │              ▲
 *    ├──partial──► PART_PAID ──┘
 *    │
 *    ├──date passed──► OVERDUE
 *    ├──requires_verification──► UNVERIFIED ──user confirms──► PAID
 *    ├──mismatch (amount/account)──► NEEDS_REVIEW
 *    ├──prepaid in earlier cycle──► SETTLED_EARLIER
 *    └──optional, user skips it──► SKIPPED ──undo──► PENDING / OVERDUE
 * </pre>
 *
 * See DOMAIN_MODEL.md §2 "Commitments — the engine".
 */
public enum CommitmentInstanceStatus {

    PENDING,
    PART_PAID,
    PAID,
    OVERDUE,

    /** Paid, but a {@code requiresVerification} commitment can never auto-reach PAID. */
    UNVERIFIED,

    /** Auto-match found a transaction but the amount or account didn't line up. */
    NEEDS_REVIEW,

    /** Already settled in an earlier cycle - this cycle owes nothing further. */
    SETTLED_EARLIER,

    /**
     * An optional bill the user has decided not to pay this cycle. Owes nothing, so it
     * stops counting against what's free. Mandatory bills can't be skipped.
     */
    SKIPPED;

    /** Nothing more will be paid this cycle - paid, prepaid, or skipped. */
    public boolean isClosed() {
        return this == PAID || this == SETTLED_EARLIER || this == SKIPPED;
    }

    /** Still owed, in some form - the set Real Balance's "committed" sums over. */
    public boolean isOpen() {
        return this == PENDING || this == PART_PAID || this == OVERDUE
                || this == UNVERIFIED || this == NEEDS_REVIEW;
    }
}
