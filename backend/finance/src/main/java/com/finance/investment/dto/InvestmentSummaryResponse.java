package com.finance.investment.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.investment.InvestmentSummary;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.util.List;

/** See {@code com.finance.investment.InvestmentSummary} - in particular why a gain total
 *  is only ever set against what has actually been valued. */
public record InvestmentSummaryResponse(
        int count,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalInvested,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal valuedTotalInvested,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalCurrentValue,

        /** Null when nothing has been valued at all. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalGain,

        /** Fraction (0.08 is 8%), never pre-multiplied. Null on the same terms. */
        BigDecimal totalGainPercent,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal outsideLedgerTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal illiquidTotal,

        int valuedCount,
        InvestmentSummary.ValuationState valuationState,

        /** Invested in holdings that could be reached if needed. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal liquidTotal,

        /** Every holding's monthly contribution, added up. "0.00" when none is set. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal monthlyContributionTotal,

        /** Largest first. */
        List<AllocationResponse> allocation
) {

    /** One holding's slice. {@code share} is a fraction of {@code totalInvested}, never
     *  pre-multiplied; null when nothing is invested. */
    public record AllocationResponse(
            Long investmentId,
            String name,
            @JsonSerialize(using = MoneySerializer.class)
            BigDecimal totalInvested,
            BigDecimal share,
            boolean liquid
    ) {
    }
}
