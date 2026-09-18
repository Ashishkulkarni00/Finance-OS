package com.finance.account.dto;

import com.finance.account.domain.AccountType;
import com.finance.account.domain.BalanceConfidence;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Structural validation only - "is this well-formed?".
 *
 * <p>Semantic rules ("is this allowed, given current state?") live in the service and
 * answer 422, not 400.
 *
 * <p>Note that {@code openingBalance} allows negatives: a credit card or loan opens
 * with money owed.
 */
public record CreateAccountRequest(

        @NotBlank(message = "Give the account a name you'll recognise")
        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        @NotNull(message = "Choose what kind of account this is")
        AccountType type,

        @Size(max = 100, message = "Institution can be at most 100 characters")
        String institution,

        @Pattern(regexp = "^[0-9]{4}$", message = "Use the last 4 digits only")
        String lastFour,

        @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a 3-letter code such as INR")
        String currency,

        @NotNull(message = "We need the balance to tell you what's actually yours to spend")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        @DecimalMin(value = "-9999999999999.99", message = "That amount is out of range")
        @DecimalMax(value = "9999999999999.99", message = "That amount is out of range")
        BigDecimal openingBalance,

        @NotNull(message = "Tell us the date this balance was true")
        LocalDate openingAsOf,

        BalanceConfidence openingConfidence,

        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        @DecimalMin(value = "0.00", message = "A minimum balance can't be negative")
        BigDecimal minimumBalance,

        Boolean minimumBalanceMandatory,

        Boolean includeInSpendable,

        Boolean includeInNetWorth,

        @Size(max = 255, message = "Purpose can be at most 255 characters")
        String purpose,

        Integer displayOrder
) {
}
