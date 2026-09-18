package com.finance.card.dto;

import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.util.List;

/** Every credit card, with the totals the Cards page leads with - summed server-side. */
public record CreditCardsOverviewResponse(

        /** Owed across all cards (a card in credit counts as zero). */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalOutstanding,

        /** Across cards that are set up. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalLimit,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal totalAvailable,

        /** Owed on set-up cards ÷ their total limit. Null when no card has a limit. */
        BigDecimal utilisation,

        /** Latest statements not yet paid off. */
        int billsDueCount,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal billsDueTotal,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal emiMonthlyTotal,

        List<CreditCardResponse> cards
) {
}
