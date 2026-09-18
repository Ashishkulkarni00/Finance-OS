package com.finance.position.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;

public record NetWorthResponse(
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal netWorth,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalAssets,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalLiabilities,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalDebt
) {
}
