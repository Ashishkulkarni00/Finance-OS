package com.finance.commitment.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import com.finance.category.dto.CategorySummary;

import java.math.BigDecimal;
import java.util.List;

public record CommitmentPlanProgressResponse(
        int settledCount,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal settledTotal,

        int totalCount,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal plannedTotal,

        int needsYouCount,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal needsYouTotal,

        int upcomingCount,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal upcomingTotal,

        /** Subtotals for This Month's "by category" grouping; category null = no category. */
        List<CategoryGroup> byCategory,

        /** Expected income (salary) this cycle - kept out of every total above. */
        int incomeCount,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal incomeExpectedTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal incomeReceivedTotal,

        /** Subtotals for "by when": one entry per due date, earliest first. Bills only. */
        List<DueDateGroup> byDueDate
) {
    public record DueDateGroup(
            java.time.LocalDate dueDate,
            int count,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal plannedTotal,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal outstandingTotal
    ) {
    }

    public record CategoryGroup(
            CategorySummary category,
            int count,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal plannedTotal,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal outstandingTotal
    ) {
    }
}
