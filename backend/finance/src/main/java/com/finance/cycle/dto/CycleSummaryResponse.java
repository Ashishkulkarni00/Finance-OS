package com.finance.cycle.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;

public record CycleSummaryResponse(
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal incomeTotal,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal expenseTotal,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal investedTotal,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal transferredTotal,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal net,

        /** Null when income was zero for the cycle so far - not a fact, never shown as 0%. */
        BigDecimal savingsRate
) {
}
