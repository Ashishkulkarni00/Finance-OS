package com.finance.review;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * This month against the previous one <strong>at the same point in the month</strong>.
 *
 * <p>The obvious comparison - this month's spend against last month's - is a lie for
 * twenty-seven days out of twenty-eight, and it always flatters: a month that is 60%
 * elapsed looks 40% better than it is. So the previous cycle is cut off at the same number
 * of days in, and only then compared. On day 24 of 30 this reads "₹28,447 against ₹24,100
 * by the same day last month", which is a fact, where "against ₹47,755" would not be.
 *
 * <p>Null when there is no previous recorded month to compare against - the first month a
 * person uses the product has nothing behind it, and an invented baseline is worse than
 * none (ADR-0006).
 *
 * @param daysIn      days of the current month elapsed, inclusive of today - the cut-off
 *                    applied to the previous cycle
 * @param cutOff      the date the previous cycle was cut at. Clamped to that cycle's end,
 *                    so a longer month never reaches past where it stopped
 * @param spendChange {@code this month's spend − previous spend to the same day}. Negative
 *                    means less has gone out. Deliberately not labelled better or worse -
 *                    a month with the car insurance in it is not a worse month (rule 8)
 */
public record SamePointComparison(
        Long previousCycleId,
        String previousLabel,
        int daysIn,
        LocalDate cutOff,
        BigDecimal previousSpend,
        BigDecimal spendChange,
        BigDecimal previousIncome,
        BigDecimal incomeChange
) {
}
