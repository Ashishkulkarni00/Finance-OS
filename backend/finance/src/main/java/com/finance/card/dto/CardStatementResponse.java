package com.finance.card.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record CardStatementResponse(
        Long id,
        Long accountId,
        LocalDate statementDate,
        LocalDate dueDate,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalAmount,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal minimumDue,

        Instant enteredAt
) {
}
