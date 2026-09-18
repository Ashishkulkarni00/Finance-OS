package com.finance.card.dto;

import com.finance.card.domain.CardNetwork;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A credit card in one step: its own liability account and its terms, created together
 * so a card never exists without its limit and statement cycle.
 */
public record CreateCreditCardRequest(

        @NotBlank(message = "What do you call this card?")
        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        @Size(max = 100, message = "Bank can be at most 100 characters")
        String institution,

        @Pattern(regexp = "^[0-9]{4}$", message = "Use the last 4 digits only")
        String lastFour,

        CardNetwork network,

        @NotNull(message = "What's the credit limit?")
        @Positive(message = "Limit must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal creditLimit,

        @NotNull(message = "Which day does the statement generate?")
        @Min(value = 1, message = "A day from 1 to 28") @Max(value = 28, message = "A day from 1 to 28")
        Integer statementDay,

        @NotNull(message = "Which day is the bill due?")
        @Min(value = 1, message = "A day from 1 to 28") @Max(value = 28, message = "A day from 1 to 28")
        Integer dueDay,

        /** The bank account the bill is usually paid from. A suggestion, not a link. */
        Long payFromAccountId,

        /** Everything owed on the card now, billed and unbilled. Defaults to zero. */
        @PositiveOrZero(message = "What's owed can't be negative")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal outstanding,

        /** The date {@code outstanding} is true for. Defaults to today. */
        LocalDate outstandingAsOf
) {
}
