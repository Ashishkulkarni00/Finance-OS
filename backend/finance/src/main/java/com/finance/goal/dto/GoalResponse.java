package com.finance.goal.dto;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import com.finance.goal.GoalPace;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record GoalResponse(
        Long id,
        String name,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal targetAmount,
        LocalDate targetDate,
        int priority,

        Long linkedReservationId,
        Long linkedAccountId,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal currentAmount,

        /** 0-100. Never over 100 even if the linked amount exceeds the target. */
        BigDecimal progressPercent,

        /** Null when the target date has already passed - there is no "per month" left. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal requiredPerMonth,

        /** Whether saving is keeping up with the target date - see GoalPace. */
        GoalPace pace,

        /** 0-100, share of the time from adding the goal to its target date that has gone.
         *  Null when it can't be worked out. */
        BigDecimal timeElapsedPercent,

        boolean archived,
        Instant archivedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
