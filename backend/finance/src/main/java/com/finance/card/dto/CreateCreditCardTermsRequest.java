package com.finance.card.dto;

import com.finance.card.domain.CardNetwork;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateCreditCardTermsRequest(

        @NotNull(message = "What's the credit limit?")
        @Positive(message = "Limit must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal creditLimit,

        @NotNull(message = "Which day does the statement generate?")
        @Min(1) @Max(28)
        Integer statementDay,

        @NotNull(message = "Which day is payment due?")
        @Min(1) @Max(28)
        Integer dueDay,

        Long payFromAccountId,

        CardNetwork network
) {
}
