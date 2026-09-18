package com.finance.commitment.dto;

import com.finance.commitment.CycleShape;
import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;

/** {@code GET /cycles/{id}/shape} - see {@link CycleShape}. Fractions are fractions (0.45 = 45%). */
public record CycleShapeResponse(
        CycleShape.State state,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal expectedIn,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal incomeStillExpected,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal committed,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal plannedSavings,
        /** Absent when state is NO_INCOME; an upper bound when INCOMPLETE. May be negative. */
        @JsonSerialize(using = MoneySerializer.class) BigDecimal flexible,
        int unknownAmountCount,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal spent,
        BigDecimal spentShare,
        BigDecimal cycleElapsed
) {
}
