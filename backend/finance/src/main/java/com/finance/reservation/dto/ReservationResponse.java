package com.finance.reservation.dto;

import com.finance.account.dto.AccountSummary;
import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.Instant;

public record ReservationResponse(
        Long id,
        AccountSummary account,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal amount,

        String purpose,
        Long goalId,
        Instant createdAt,
        Instant updatedAt
) {
}
