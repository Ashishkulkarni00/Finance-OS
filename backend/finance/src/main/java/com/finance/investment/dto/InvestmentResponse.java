package com.finance.investment.dto;

import com.finance.account.dto.AccountSummary;
import com.finance.account.domain.BalanceConfidence;
import com.finance.common.money.MoneySerializer;
import com.finance.investment.domain.InvestmentType;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvestmentResponse(
        Long id,
        String name,
        InvestmentType type,
        String typeLabel,

        /** Null for a holding tracked outside the ledger - an employer-deducted fund. */
        AccountSummary account,

        /** Where the contribution comes from. Null when nothing of ours pays it. */
        AccountSummary payFromAccount,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal monthlyContribution,
        Integer contributionDay,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal openingInvested,

        /** Null without a ledger account - nothing is recorded, so there is no figure. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal addedSince,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalInvested,

        /** The hand-kept figure. Null = never valued, which is not zero. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal currentValue,
        LocalDate currentValueAsOf,

        /** How long ago it was valued, so a stale figure can say so. Null when never valued. */
        Integer valuationAgeDays,

        /** Null until valued - "Not updated" in the workbook's own words. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal gain,

        /** Fraction (0.08 is 8%), never pre-multiplied. Null until valued, and when
         *  nothing has gone in to take a share of. */
        BigDecimal gainPercent,

        BalanceConfidence confidence,
        boolean liquid,

        /** True when this has no ledger account, so it sits outside net worth. */
        boolean outsideLedger,

        String note,

        /** The plan bill that pays this holding's monthly instalment (it follows the holding),
         *  or null if the instalment isn't in the plan. */
        Long planCommitmentId
) {
}
