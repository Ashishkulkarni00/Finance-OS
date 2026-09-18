package com.finance.loan.dto;

import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * What can be worked out from the figures supplied. Any field is null when the inputs
 * don't determine it - never a guess (ADR-0006).
 */
public record LoanEstimateResponse(

        LocalDate asOf,

        /** The EMI these terms produce, to the rupee. Needs amount, rate and tenure. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal standardEmi,

        /** The EMI to use: as supplied, or else worked out. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal emi,

        /** True when the EMI supplied is more than 1% (min ₹5) away from {@code standardEmi}
         *  - one of amount, rate, tenure or EMI is probably off. Null if not comparable. */
        Boolean emiDiffersFromTerms,

        LocalDate originalFirstEmiDate,
        LocalDate lastEmiDate,

        /** EMIs whose due date is on or before {@code asOf}. */
        Integer emisPaid,
        Integer emisRemaining,
        LocalDate nextEmiDate,

        /** Principal still unpaid on {@code asOf}. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal outstandingBalance
) {
}
