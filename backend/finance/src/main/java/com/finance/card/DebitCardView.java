package com.finance.card;

import com.finance.account.domain.Account;
import com.finance.card.domain.DebitCard;

public record DebitCardView(DebitCard card, Account account) {
}
