package com.finance.commitment.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/**
 * Manually links a payment to a commitment instance - the fallback when auto-matching
 * (by amount + account + date window, on transaction creation) didn't find it.
 */
public record SettleCommitmentInstanceRequest(

        @NotNull(message = "Which transaction settles this?")
        Long transactionId,

        @NotNull(message = "How much was paid?")
        @Positive(message = "Amount must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal amount
) {
}
