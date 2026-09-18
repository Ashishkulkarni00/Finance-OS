package com.finance.reservation.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Partial update. {@code null} means "leave unchanged". {@code accountId} is immutable. */
public record UpdateReservationRequest(

        @Positive(message = "Amount must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal amount,

        @Size(max = 255, message = "Purpose can be at most 255 characters")
        String purpose,

        Long goalId
) {
}
