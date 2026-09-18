package com.finance.card;

import com.finance.card.domain.CardStatement;
import com.finance.card.dto.CreateCardStatementRequest;
import com.finance.card.dto.CreateCreditCardTermsRequest;
import com.finance.card.dto.UpdateCreditCardTermsRequest;

import java.time.LocalDate;
import java.util.List;

/** A credit card's terms and its typed statements. */
public interface CardService {

    CreditCardTermsView createTerms(Long accountId, CreateCreditCardTermsRequest request);

    CreditCardTermsView getTerms(Long accountId);

    CreditCardTermsView updateTerms(Long accountId, UpdateCreditCardTermsRequest request);

    CardStatement addStatement(Long accountId, CreateCardStatementRequest request);

    List<CardStatement> listStatements(Long accountId);

    /** Withdraw a statement typed in wrong, so it can be entered again. Soft delete. */
    void deleteStatement(Long accountId, Long statementId);

    /** A statement worked out from the card's entries - null date means the latest one. */
    StatementDraft statementDraft(Long accountId, LocalDate statementDate);
}
