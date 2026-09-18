package com.finance.card;

import com.finance.card.domain.CreditCardTerms;

import java.math.BigDecimal;

/** Terms plus the three derived figures - never stored, computed on every read. */
public record CreditCardTermsView(CreditCardTerms terms, BigDecimal outstanding, BigDecimal unbilled,
                                  BigDecimal availableCredit) {
}
