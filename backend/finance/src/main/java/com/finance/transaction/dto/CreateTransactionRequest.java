package com.finance.transaction.dto;

import com.finance.transaction.domain.TransactionType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Structural validation only - "is this well-formed?".
 *
 * <p>Semantic rules - whether {@code toAccountId} or {@code categoryId} are required
 * or forbidden for this {@code type}, whether the accounts are distinct, ownership,
 * archived state - live in the service and answer 422, not 400.
 */
public record CreateTransactionRequest(

        @NotNull(message = "Tell us when this happened")
        LocalDate date,

        @NotBlank(message = "Give this transaction a description you'll recognise")
        @Size(max = 200, message = "Description can be at most 200 characters")
        String description,

        @NotNull(message = "Choose what kind of transaction this is")
        TransactionType type,

        @NotNull(message = "We need an amount")
        @Positive(message = "Amount must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal amount,

        @NotNull(message = "Choose an account")
        Long accountId,

        Long toAccountId,

        Long categoryId,

        @Size(max = 100, message = "Merchant can be at most 100 characters")
        String merchant,

        @Size(max = 500, message = "Note can be at most 500 characters")
        String note
) {
}
