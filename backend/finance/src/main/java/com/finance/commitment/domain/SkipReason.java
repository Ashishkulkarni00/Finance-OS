package com.finance.commitment.domain;

/**
 * Why one month of a commitment was skipped (2026-11-11).
 *
 * <p>A skip releases money into what is free, so on a must-pay commitment it is a real decision
 * - "no SIP this month, an unexpected expense came up" - and the month's record should say so.
 * A fixed list rather than free text so the reason can be read back and counted (how often the
 * SIP was skipped, and why); the optional note on the instance carries anything the list can't.
 *
 * <p>Deliberately no "cancelled": ending a commitment is a change to the plan (ADR-0015 - edit or
 * archive it), not a skip of one month.
 */
public enum SkipReason {
    /** Something unexpected needed the money this month. */
    MONEY_NEEDED_ELSEWHERE,
    /** Nothing to pay for this time - no trip, no top-up needed. */
    NOT_NEEDED,
    /** Paid, but not through this commitment - recorded as its own entry. */
    PAID_ANOTHER_WAY,
    /** Moved to a later month. */
    POSTPONED,
    /** None of the above; the note says why. */
    OTHER
}
