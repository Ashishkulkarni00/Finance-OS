package com.finance.card;

import com.finance.card.domain.CardStatement;
import com.finance.card.dto.CreateCreditCardRequest;
import com.finance.card.dto.UpdateCreditCardRequest;

import java.math.BigDecimal;

/** A credit card as the user sees it - its account, terms, bill and EMIs together. */
public interface CreditCardService {

    CreditCardsOverview list();

    CreditCardView get(Long accountId);

    CreditCardView create(CreateCreditCardRequest request);

    CreditCardView update(Long accountId, UpdateCreditCardRequest request);

    /** What's still to pay on a statement - its total less payments and credits since. */
    BigDecimal remainingOn(CardStatement statement);
}
