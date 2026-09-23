package com.finance.reservation.dto;

import com.finance.account.dto.AccountSummary;
import com.finance.effect.dto.WriteEffectResponse;
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
        Instant updatedAt,

        /** What this write just did (ADR-0017). Reserving money is a direct subtraction
         *  from Real Balance, so it always has something to report. */
        WriteEffectResponse effect
) {

    public ReservationResponse withEffect(WriteEffectResponse effect) {
        return new ReservationResponse(id, account, amount, purpose, goalId, createdAt, updatedAt, effect);
    }
}
