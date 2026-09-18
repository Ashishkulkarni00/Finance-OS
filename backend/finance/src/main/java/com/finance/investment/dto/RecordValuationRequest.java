package com.finance.investment.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * "Here's what it's worth today" - the one figure the user maintains by hand, and the
 * primary action of the Investments screen.
 *
 * @param asOf optional; defaults to today. Present so a value read off a statement dated
 *             last week can be recorded honestly as last week's, rather than backdated
 *             by guesswork or misfiled as current
 */
public record RecordValuationRequest(

        @NotNull(message = "What's it worth?")
        @PositiveOrZero(message = "A value can't be negative")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal currentValue,

        LocalDate asOf
) {
}
