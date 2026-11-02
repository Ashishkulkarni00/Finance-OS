package com.finance.review;

/** The consolidation behind Summary: salary months side by side, and debt walked forward. */
public interface ReviewService {

    /** The last {@code months} salary months that exist, oldest first, including this one. */
    ReviewResult months(int months);

    /** What one month's spending went on, ranked, split committed versus day-to-day. */
    MonthCategories categories(Long cycleId);

    /** Every loan's balance from today to the last payoff. */
    DebtTrajectory debtTrajectory();
}
