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
        Long linkedAccountId,

        /**
         * Why the goal is being changed, in the user's own words. Optional and never
         * demanded. Recorded on the plan revision - moving a target date is a decision,
         * and the reason is the part that is worth reading back a year later. ADR-0015.
         */
        @Size(max = 255, message = "Keep this to one sentence")
        String reason
) {

    /** Without a stated reason. */
    public UpdateGoalRequest(String name, BigDecimal targetAmount, LocalDate targetDate, Integer priority,
                             Long linkedReservationId, Long linkedAccountId) {
        this(name, targetAmount, targetDate, priority, linkedReservationId, linkedAccountId, null);
    }
}
