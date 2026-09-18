package com.finance.loan.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AmortisationEntryResponse(
        int period,
        LocalDate dueDate,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal principalComponent,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal interestComponent,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal closingBalance,

        boolean paid
) {
}
