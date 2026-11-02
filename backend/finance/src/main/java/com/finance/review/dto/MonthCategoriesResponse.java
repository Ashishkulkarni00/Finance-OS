package com.finance.review.dto;

import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * {@code GET /api/v1/review/months/{cycleId}/categories} - what one salary month's spending
 * went on, ranked largest first.
 *
 * <p><strong>It reconciles to the month.</strong> Every row's {@code total} sums to
 * {@code spend}, and each row's {@code committed} and {@code flexible} sum to its own total,
 * because the split comes from the same commitment link the rest of Summary uses. A
 * breakdown printed beside a chart that did not add up to it would be worse than none.
 *
 * <p><strong>Not the same question as {@code GET /cycles/{id}/flexible-spending}</strong>,
 * which totals the FLEXIBLE <em>category group</em>. On the real October cycle that gives
 * ₹14,864 where this gives ₹28,447 of day-to-day money, and both are correct: a
 * fixed-category expense that no commitment covers is day-to-day by the link and fixed by
 * its group. Real Balance is built on the link, so this follows the link.
 */
public record MonthCategoriesResponse(
        Long cycleId,
        String label,
        LocalDate startDate,
        LocalDate endDate,
        /** False when nothing was spent in the month - render an em dash, not a zero row. */
        boolean recorded,
        /** False when no commitment fell due, so the per-row committed split is withheld. */
        boolean planTracked,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal spend,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal committed,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal flexible,
        List<Line> categories
) {

    public record Line(
            Long categoryId,
            String name,
            String group,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal total,
            /** Absent when {@code planTracked} is false - withheld, never zero. */
            @JsonSerialize(using = MoneySerializer.class) BigDecimal committed,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal flexible,
            /** Of the month's whole spend. */
            BigDecimal share,
            /** Of its day-to-day money - the more telling of the two. */
            BigDecimal shareOfFlexible
    ) {
    }
}
