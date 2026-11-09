package com.finance.recovery.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.recovery.RecoveryPlan;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.util.List;

/** {@code GET /recovery} - see {@link RecoveryPlan}. Money as strings; null means unknown. */
public record RecoveryPlanResponse(
        String state,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal gap,
        int daysToSalary,
        List<Step> steps,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal stillShort,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal catchUp,
        Integer catchUpMonths,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal catchUpPerMonth,
        String reason
) {
    public record Step(String kind, Long refId, String label,
                       @JsonSerialize(using = MoneySerializer.class) BigDecimal amount,
                       @JsonSerialize(using = MoneySerializer.class) BigDecimal perDayLess) {
    }

    public static RecoveryPlanResponse from(RecoveryPlan p) {
        return new RecoveryPlanResponse(p.state().name(), p.gap(), p.daysToSalary(),
                p.steps().stream().map(s -> new Step(s.kind().name(), s.refId(), s.label(), s.amount(), s.perDayLess())).toList(),
                p.stillShort(), p.catchUp(), p.catchUpMonths(), p.catchUpPerMonth(), p.reason());
    }
}
