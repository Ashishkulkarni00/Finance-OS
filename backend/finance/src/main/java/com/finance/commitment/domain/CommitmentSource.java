package com.finance.commitment.domain;

/**
 * Where a bill's figures come from.
 *
 * <p>A {@code MANUAL} bill is typed by the user. Any other source means the bill follows
 * that record: a loan's EMI amount, day, paying account and last payment, for example.
 * The user enters those once, on the loan, and the plan can't drift from them.
 */
public enum CommitmentSource {
    MANUAL,
    LOAN,
    INVESTMENT,
    GOAL,
    /** An insurance premium. The policy holds the amount and how often it falls due; the
     *  bill follows it, the same as an EMI follows its loan (ROADMAP 0.3). */
    INSURANCE
}
