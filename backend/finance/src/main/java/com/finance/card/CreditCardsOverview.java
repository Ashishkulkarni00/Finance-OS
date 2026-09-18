package com.finance.card;

import java.math.BigDecimal;
import java.util.List;

/** Every credit card with its totals. Service-layer, not a DTO. */
public record CreditCardsOverview(
        BigDecimal totalOutstanding,
        BigDecimal totalLimit,
        BigDecimal totalAvailable,
        BigDecimal utilisation,
        int billsDueCount,
        BigDecimal billsDueTotal,
        BigDecimal emiMonthlyTotal,
        List<CreditCardView> cards
) {
}
