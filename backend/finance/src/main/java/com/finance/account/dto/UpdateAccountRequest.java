package com.finance.account.dto;

import com.finance.account.domain.BalanceConfidence;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Partial update. Every field is optional; {@code null} means "leave unchanged".
 *
 * <p>{@code type} is absent on purpose. Changing an account's type would change how
 * every historical figure derived from it is signed and counted, so it is immutable
 * once created. Create a new account instead.
 */
public record UpdateAccountRequest(

        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        @Size(max = 100, message = "Institution can be at most 100 characters")
        String institution,

        @Pattern(regexp = "^[0-9]{4}$", message = "Use the last 4 digits only")
        String lastFour,

        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal openingBalance,

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
