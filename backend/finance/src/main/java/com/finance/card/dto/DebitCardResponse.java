package com.finance.card.dto;

import com.finance.account.dto.AccountSummary;
import com.finance.card.domain.CardNetwork;

import java.time.Instant;

/** A debit card and the bank account it spends from. No balance - it has none of its own. */
public record DebitCardResponse(
        Long id,
        AccountSummary account,
        String name,
        CardNetwork network,
        String lastFour,
        Instant createdAt
) {
}
