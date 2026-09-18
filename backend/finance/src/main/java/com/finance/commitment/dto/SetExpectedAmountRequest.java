package com.finance.commitment.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/**
 * Sets what an unpaid occurrence is expected to cost - an estimate is fine. Structural
 * validation only; "is it already settled?" is a business rule, checked in the service.
 */
public record SetExpectedAmountRequest(

        @NotNull(message = "About how much will it be?")
        @Positive(message = "Amount must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal expectedAmount
) {
}
