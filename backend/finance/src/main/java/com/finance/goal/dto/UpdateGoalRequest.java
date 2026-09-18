package com.finance.goal.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateGoalRequest(

        @Size(max = 100)
        String name,

        @Positive(message = "Target must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal targetAmount,

        LocalDate targetDate,
        Integer priority,
        Long linkedReservationId,
        Long linkedAccountId
) {
}
