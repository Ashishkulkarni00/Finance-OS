package com.finance.card.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

/** The bank's own figures - typed in, never derived. See {@code CardStatement}. */
public record CreateCardStatementRequest(

        @NotNull(message = "When was this statement generated?")
        LocalDate statementDate,

        @NotNull(message = "When is payment due?")
        LocalDate dueDate,

        @NotNull(message = "What's the total on the statement?")
        @PositiveOrZero(message = "Total can't be negative")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal totalAmount,

        @NotNull(message = "What's the minimum due?")
        @PositiveOrZero(message = "Minimum due can't be negative")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal minimumDue
) {
}
