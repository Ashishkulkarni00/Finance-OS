package com.finance.projection.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** The shortfall detector's wire shape - "₹6,882 short in IDBI before the 13th". */
public record ProjectionResponse(
        Long accountId,
        String accountName,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal currentBalance,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal projectedBalance,

        LocalDate projectionDate,
        boolean shortfall,
        List<Deduction> deductions
) {
    public record Deduction(Long commitmentInstanceId, String name, LocalDate dueDate,
                            @JsonSerialize(using = MoneySerializer.class) BigDecimal amount,
                            @JsonSerialize(using = MoneySerializer.class) BigDecimal balanceAfter,
                            Boolean covered) {
    }
}
