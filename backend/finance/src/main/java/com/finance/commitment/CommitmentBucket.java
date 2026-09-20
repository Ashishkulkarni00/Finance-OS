package com.finance.commitment;

/**
 * Which part of a month's outline a bill belongs to - shared by the current month's shape
 * ({@code CycleShape}), its review against the plan ({@code CycleReview}), and the forward
 * {@code ForecastService}, so all three agree on what counts as spent, saved, or neither.
 * See {@code CommitmentBucketClassifier}.
 */
public enum CommitmentBucket {
    /** Settled by an INCOME entry - money coming in, never a payment. */
    INCOME,
    /** Spent, or moved to pay off a card or loan - spoken-for money either way. */
    PAYMENT,
    /** Invested, or moved into an account that isn't spending money - set aside. */
    SET_ASIDE,
    /** A transfer between two spendable accounts - moved, not spent or saved. */
    NEITHER
}
