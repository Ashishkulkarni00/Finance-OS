package com.finance.investment.dto;

import com.finance.account.domain.BalanceConfidence;
import com.finance.investment.domain.InvestmentType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Partial update. {@code null} means "leave unchanged".
 *
 * <p>Deliberately cannot set {@code currentValue} - that goes through
 * {@code POST /investments/{id}/value} so a valuation always gets dated. Letting it be
 * patched here would allow an undated value, and an undated valuation looks current
 * forever.
 */
public record UpdateInvestmentRequest(

        @Size(max = 100)
        String name,

        InvestmentType type,

        Long payFromAccountId,

        @PositiveOrZero
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal monthlyContribution,

        @Min(1)
        @Max(31)
        Integer contributionDay,

        @PositiveOrZero
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal statedInvested,

        BalanceConfidence confidence,

        Boolean liquid,

        @Size(max = 500)
        String note
) {
}
