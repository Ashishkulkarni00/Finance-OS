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

        /**
         * What the cycle's commitments were expected to cost. Null when one of them had no
         * known amount - the figure is genuinely unknown, not zero (ADR-0006).
         */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal plannedCommittedTotal,

        /** What they actually cost. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal actualCommittedTotal,

        /** Null on a cycle that closed before any of this was recorded - not zero. */
        Integer commitmentsPlanned,

        /** Paid, or settled in an earlier cycle. The number that has to go up. */
        Integer commitmentsKept,

        /** How many times the plan itself changed during the cycle. */
        Integer planRevisionsCount,

        Instant createdAt
) {
}
