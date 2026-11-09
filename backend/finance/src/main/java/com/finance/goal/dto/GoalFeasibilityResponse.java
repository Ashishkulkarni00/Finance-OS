package com.finance.goal.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.goal.GoalFeasibility;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** {@code GET /goals/feasibility} - see {@link GoalFeasibility}. Money as strings; null means unknown. */
public record GoalFeasibilityResponse(
        Long goalId,
        String name,
        LocalDate targetDate,
        String state,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal stillNeeded,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal planWillAdd,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal gap,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal freeByDeadline,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal freeCeiling,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal shortBy,
        @JsonSerialize(using = MoneySerializer.class) BigDecimal perMonthFromFree,
        int monthsCounted,
        String reason
) {
    public static List<GoalFeasibilityResponse> from(List<GoalFeasibility> list) {
        return list.stream().map(f -> new GoalFeasibilityResponse(f.goalId(), f.name(), f.targetDate(), f.state().name(),
                f.stillNeeded(), f.planWillAdd(), f.gap(), f.freeByDeadline(), f.freeCeiling(), f.shortBy(),
                f.perMonthFromFree(), f.monthsCounted(), f.reason())).toList();
    }
}
