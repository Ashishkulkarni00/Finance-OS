package com.finance.reservation.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateReservationRequest(

        @NotNull(message = "Choose which account this money sits in")
        Long accountId,

        @NotNull(message = "We need an amount")
        @Positive(message = "Amount must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal amount,

        @NotBlank(message = "Say what this money is for")
        @Size(max = 255, message = "Purpose can be at most 255 characters")
        String purpose,

        Long goalId
) {
}
