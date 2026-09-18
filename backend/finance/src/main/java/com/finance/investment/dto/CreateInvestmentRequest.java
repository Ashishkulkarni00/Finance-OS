package com.finance.investment.dto;

import com.finance.account.domain.BalanceConfidence;
import com.finance.investment.domain.InvestmentType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateInvestmentRequest(

        @NotBlank(message = "What's this holding called?")
        @Size(max = 100)
        String name,

        @NotNull(message = "What kind of investment is this?")
        InvestmentType type,

        /** The INVESTMENT account it's held in. Omit for a holding tracked outside the
         *  ledger entirely, like an employer-deducted provident fund. */
        Long accountId,

        Long payFromAccountId,

        @PositiveOrZero
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal monthlyContribution,

        @Min(1)
        @Max(31)
        Integer contributionDay,

        /** Required when there's no account - otherwise the account's balance is the truth. */
        @PositiveOrZero
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal statedInvested,

        /** Optional. Leave it out and the register says "never valued" rather than
         *  guessing at a figure. */
        @PositiveOrZero
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal currentValue,

        BalanceConfidence confidence,

        /** Defaults to true. False for anything that couldn't be reached if it were
         *  needed - a provident fund, a locked-in deposit. */
        Boolean liquid,

        @Size(max = 500)
        String note
) {
}
