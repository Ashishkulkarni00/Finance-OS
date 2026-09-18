package com.finance.transaction.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.LocalDate;

/** See {@code com.finance.transaction.DaySubtotal}. */
public record DaySubtotalResponse(
        LocalDate date,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal moneyIn,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal moneyOut,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal transferred
) {
}
