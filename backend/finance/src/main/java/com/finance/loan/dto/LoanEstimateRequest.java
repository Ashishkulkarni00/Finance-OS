package com.finance.loan.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Whatever the user knows about a loan so far - every field optional. The estimate fills
 * in what can be worked out from it; nothing is saved.
 *
 * <p>Two starting points are understood:
 * <ul>
 *   <li><strong>The original terms</strong> - amount, rate, tenure, disbursal / first EMI -
 *       from which EMIs paid, EMIs left, the next EMI and the outstanding principal on
 *       {@code asOf} follow.</li>
 *   <li><strong>Today's figures</strong> - outstanding principal plus two of rate, EMI and
 *       EMIs left - from which the third follows.</li>
 * </ul>
 */
public record LoanEstimateRequest(

        @Positive @Digits(integer = 13, fraction = 2)
        BigDecimal principal,

        @PositiveOrZero @Digits(integer = 3, fraction = 3)
        BigDecimal annualRate,

        @Min(1) @Max(600)
        Integer tenureMonths,

        /** When the loan was disbursed. */
        LocalDate startDate,

        /** The original loan's first EMI. Defaults to a month after {@code startDate}. */
        LocalDate originalFirstEmiDate,

        @Positive @Digits(integer = 13, fraction = 2)
        BigDecimal emi,

        @PositiveOrZero @Digits(integer = 13, fraction = 2)
        BigDecimal outstandingBalance,

        @Min(0) @Max(600)
        Integer emisRemaining,

        @Min(1) @Max(31)
        Integer emiDay,

        /** The date to estimate the position on. Defaults to today. */
        LocalDate asOf
) {
}
