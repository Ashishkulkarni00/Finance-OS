package com.finance.goal.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateGoalRequest(

        @NotBlank(message = "Give this goal a name")
        @Size(max = 100)
        String name,

        @NotNull(message = "What's the target amount?")
        @Positive(message = "Target must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal targetAmount,

        @NotNull(message = "When do you want to reach this by?")
        LocalDate targetDate,

        Integer priority,

        /** At most one of these two - a goal tracks either a reservation or an account, not both. */
        Long linkedReservationId,
        Long linkedAccountId
) {
}
