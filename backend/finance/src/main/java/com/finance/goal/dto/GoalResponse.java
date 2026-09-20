package com.finance.goal.dto;

import java.util.List;
import com.finance.goal.GoalScheduleLine;
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

        /** Saved: what's in the linked account or reservation now. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal currentAmount,
        /** Already paid out of the goal through its planned payments. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal spentAmount,

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

        /** The goal's dated amounts, earliest first - empty when no payments are planned. */
        List<ScheduleLine> schedule,
        boolean archived,
        Instant archivedAt,
        Instant createdAt,
        Instant updatedAt
) {

    /** See {@code GoalScheduleLine}. */
    public record ScheduleLine(
            Long commitmentId,
            String name,
            LocalDate date,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal amount,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal paid,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal stillNeeded,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal neededByThen,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal shortBy,
            GoalScheduleLine.Status status) {
    }
}
