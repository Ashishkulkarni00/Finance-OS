package com.finance.loan.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;

/** See {@code com.finance.loan.LoanSummary} - in particular why the two EMI totals are
 *  never added together. */
public record LoanSummaryResponse(
        int count,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal bankEmiTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal cardEmiTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal remainingPaymentsTotal,

        int unconfirmedCount,
        int tbdCount
) {
}
