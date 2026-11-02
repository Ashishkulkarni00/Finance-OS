package com.finance.review.dto;

import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * {@code GET /api/v1/review/debt-trajectory} - see {@code DebtTrajectory}.
 *
 * <p>{@code debtFreeDate} is null whenever {@code excludedLoanCount} is above zero. That is
 * not a quirk: the date is only true if every loan is in the curve, and a loan with no rate
 * recorded cannot be walked forward at all.
 */
public record DebtTrajectoryResponse(
        LocalDate asOf,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal outstandingNow,
        LocalDate debtFreeDate,
        Integer monthsToDebtFree,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal interestAhead,
        /** EMIs already due with nothing recorded. The curve walks past them regardless. */
        int unrecordedEmis,
        List<Point> points,
        /**
         * One balance series per loan, aligned index-for-index with `points` and ordered
         * **soonest payoff first**, so stacked bands peel off the top as each loan clears.
         * Every point's series values sum to that point's `outstanding`.
         */
        List<Series> series,
        List<Loan> loans,
        int excludedLoanCount,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal excludedOutstanding
) {

    public record Point(
            LocalDate month,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal outstanding,
            /**
             * What the EMIs falling in this month take off the principal, and what they cost
             * in interest. **Both absent on the first point** - that is the month in
             * progress, and the walk is forward-only from today, so an EMI already due
             * earlier this month is not in these sums. Zero would read as "nothing was due".
             */
            @JsonSerialize(using = MoneySerializer.class) BigDecimal principalDue,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal interestDue
    ) {
    }

    public record Series(
            Long loanId,
            String name,
            @JsonSerialize(contentUsing = MoneySerializer.class) List<BigDecimal> balances
    ) {
    }

    public record Loan(
            Long loanId,
            String name,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal outstanding,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal emi,
            LocalDate payoffDate,
            boolean inCurve
    ) {
    }
}
