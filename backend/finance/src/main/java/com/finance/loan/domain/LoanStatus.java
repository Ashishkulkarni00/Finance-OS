package com.finance.loan.domain;

/** Where a loan is in its life. Distinct from {@link LoanConfidence}, which is about how
 *  much we know rather than what is happening. */
public enum LoanStatus {

    ACTIVE,

    /**
     * A payment we could not verify. The workbook's own note: <em>"Sep-2026 payment is
     * UNVERIFIED because IDBI was under maintenance. Never assume it is paid."</em>
     * Treated as still owed until confirmed - the safe direction to be wrong in.
     */
    UNCONFIRMED,

    /** Agreed, but the first EMI has not fallen yet. */
    SCHEDULED,

    CLOSED
}
