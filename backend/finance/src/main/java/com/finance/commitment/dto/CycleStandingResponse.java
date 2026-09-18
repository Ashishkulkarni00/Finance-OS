package com.finance.commitment.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;

public record CycleStandingResponse(
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal incomeTotal,

        /** How much of incomeTotal is still expected (not yet received) - "0.00" once it's all in. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal incomeExpectedTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal committedTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal uncommittedTotal,

        /** Fraction (0.42 means 42%), never pre-multiplied - format with Intl percent, same as savingsRate. */
        BigDecimal committedShare
) {
}
