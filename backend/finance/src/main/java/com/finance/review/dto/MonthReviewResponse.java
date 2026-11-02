package com.finance.review.dto;

import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * {@code GET /api/v1/review/months?months=} - see {@code MonthReview} for what each figure
 * means and, more importantly, when it is null.
 *
 * <p>Money as strings, rates as plain numbers, exactly as {@code FinancialStateResponse}
 * does it. Every ratio and every change is computed here rather than in the browser: the
 * frontend does no money arithmetic (FRONTEND_CONVENTIONS §4 rule 2), and a chart is not an
 * exception to that - only the bar heights are the browser's business.
 */
public record MonthReviewResponse(
        LocalDate asOf,
        List<Month> months,
        int monthsRecorded,
        /** Null when there is no previous recorded month - see {@code SamePointComparison}. */
        SamePoint samePoint
) {

    public record Month(
            Long cycleId,
            LocalDate startDate,
            LocalDate endDate,
            String label,
            boolean current,
            boolean closed,
            /**
             * False when no transaction falls in the month. Every money field below is then
             * null, and the screen must print an em dash rather than a zero - unknown and
             * zero are different facts (ADR-0006).
             */
            boolean recorded,
            /**
             * Whether any commitment fell due in the month at all. **False means
             * `committed`, `flexible` and `committedShare` are withheld**, not zero: a month
             * from before the plan existed has nothing linked to a bill, so the arithmetic
             * reads "0% committed", which is true of the links and false about the person.
             */
            boolean planTracked,
            /** 0-1, how much of the month has passed. Null unless {@code current}. */
            BigDecimal elapsedShare,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal income,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal spend,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal committed,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal flexible,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal invested,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal net,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal leftOver,
            BigDecimal savingsRate,
            BigDecimal committedShare,
            Integer commitmentsPlanned,
            Integer commitmentsKept,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal plannedCommittedTotal,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal actualCommittedTotal
    ) {
    }

    public record SamePoint(
            Long previousCycleId,
            String previousLabel,
            int daysIn,
            LocalDate cutOff,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal previousSpend,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal spendChange,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal previousIncome,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal incomeChange
    ) {
    }
}
