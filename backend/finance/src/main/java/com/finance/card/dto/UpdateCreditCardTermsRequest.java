package com.finance.card.dto;

import com.finance.card.domain.CardNetwork;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/** Partial update - null leaves a field unchanged. */
public record UpdateCreditCardTermsRequest(

        @Positive(message = "Limit must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal creditLimit,

        @Min(1) @Max(28)
        Integer statementDay,

        @Min(1) @Max(28)
        Integer dueDay,

        Long payFromAccountId,

        CardNetwork network,

        /** Forget the usual paying account. */
        Boolean clearPayFromAccount
) {
}
