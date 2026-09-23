package com.finance.insurance.dto;

import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;

/** The protection picture in one line - see {@code InsuranceSummary}. */
public record InsuranceSummaryResponse(
        int policies,

        /** Cover across active policies, for reassurance only. **Never net worth**: it is
         *  money you would not have to find, not money you have - and ₹5L of health plus
         *  ₹1cr of life is not a pot you could ever spend. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalCover,

        /** What being covered costs per month. Null when any policy's premium is unknown,
         *  rather than a total silently missing one. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal monthlyPremium,

        int lapsed,
        int renewingSoon,
        int unknownRenewal
) {
}
