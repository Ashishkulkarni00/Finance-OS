package com.finance.card.dto;

import com.finance.card.domain.CardNetwork;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Partial update of a credit card - its account details and its terms together. On a card
 * account that has no terms yet (created before cards had their own screen), supplying
 * the limit, statement day and due day sets them up.
 *
 * <p>What's owed isn't here: a card's balance is changed with the account's "Update
 * balance", or by recording what was spent and paid.
 */
public record UpdateCreditCardRequest(

        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        /** "" clears. */
        @Size(max = 100, message = "Bank can be at most 100 characters")
        String institution,

        @Pattern(regexp = "^[0-9]{4}$", message = "Use the last 4 digits only")
        String lastFour,

        CardNetwork network,

        @Positive(message = "Limit must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal creditLimit,

        @Min(value = 1, message = "A day from 1 to 28") @Max(value = 28, message = "A day from 1 to 28")
        Integer statementDay,

        @Min(value = 1, message = "A day from 1 to 28") @Max(value = 28, message = "A day from 1 to 28")
        Integer dueDay,

        Long payFromAccountId,

        Boolean clearPayFromAccount
) {
}
