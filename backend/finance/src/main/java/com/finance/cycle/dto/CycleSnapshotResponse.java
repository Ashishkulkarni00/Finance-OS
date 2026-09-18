package com.finance.cycle.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.Instant;

public record CycleSnapshotResponse(
        Long id,
        Long cycleId,

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

        /** Null when income was zero for the cycle - not a fact, not shown as 0%. */
        BigDecimal savingsRate,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal realBalance,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal netWorth,
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalDebt,

        Instant createdAt
) {
}
