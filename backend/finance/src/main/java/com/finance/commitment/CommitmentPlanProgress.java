package com.finance.commitment;

import com.finance.category.domain.Category;

import java.math.BigDecimal;
import java.util.List;

/**
 * "₹23,700 of ₹28,500 settled · 7 of 8" - the Plan zone's progress line, plus a
 * per-tier breakdown so each group heading on the list can carry its own subtotal.
 *
 * <p>{@code plannedTotal} sums every instance's known amount (expected, or confirmed for
 * a variable commitment once it's settled) regardless of status; {@code settledTotal}
 * sums only what's actually been paid. The two pending tiers sum {@code outstanding()} -
 * what is still to leave the account, which is not the same as the expected amount once
 * something is part-paid.
 *
 * <p>The tiers come from {@link com.finance.commitment.domain.AttentionTier}, the same
 * classification the rows themselves are mapped with, so a heading can never disagree
 * with the list under it. All server-computed - never summed client-side.
 */
public record CommitmentPlanProgress(
        int settledCount,
        BigDecimal settledTotal,
        int totalCount,
        BigDecimal plannedTotal,

        /** Tier 1 - mandatory, overdue, due within two days, or missing an amount. */
        int needsYouCount,
        BigDecimal needsYouTotal,

        /** Tier 2 - known, dated, and not yet your problem. */
        int upcomingCount,
        BigDecimal upcomingTotal,

        /** One entry per category that has a bill this cycle; category null = none set.
         *  {@code plannedTotal} sums known amounts, {@code outstandingTotal} what is still
         *  to leave (unsettled bills only). */
        List<CategoryGroupTotal> byCategory,
        /** Expected-income occurrences this cycle (salary). Not in any of the totals above. */
        int incomeCount,
        /** Income still to arrive - the expected amount of occurrences not yet received. */
        BigDecimal incomeExpectedTotal,
        /** Income already received against those occurrences - what arrived, not what was expected. */
        BigDecimal incomeReceivedTotal,
        /** One entry per due date that has a bill this cycle, earliest first - the "by when" view.
         *  Same meaning as {@code byCategory}'s figures. Bills only, not expected income. */
        List<DueDateGroupTotal> byDueDate
) {
    public record DueDateGroupTotal(java.time.LocalDate dueDate, int count, BigDecimal plannedTotal,
                                    BigDecimal outstandingTotal) {
    }

    public record CategoryGroupTotal(Category category, int count, BigDecimal plannedTotal,
                                     BigDecimal outstandingTotal) {
    }
}
