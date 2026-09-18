package com.finance.position.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;

/** See {@code com.finance.position.CashPosition}. */
public record CashPositionResponse(
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal heldTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal reservedTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal unreservedTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal cardLiability,

        int accountCount
) {
}
