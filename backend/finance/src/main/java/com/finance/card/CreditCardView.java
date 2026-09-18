package com.finance.card;

import com.finance.account.domain.Account;
import com.finance.card.domain.CardStatement;
import com.finance.card.domain.CreditCardTerms;
import com.finance.card.domain.StatementStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** A credit card plus everything derived about it today. Service-layer, not a DTO. */
public record CreditCardView(
        Account account,
        CreditCardTerms terms,
        Account payFromAccount,
        BigDecimal outstanding,
        BigDecimal availableCredit,
        BigDecimal utilisation,
        BigDecimal unbilled,
        LocalDate nextStatementDate,
        LocalDate nextStatementDueDate,
        LatestStatement latestStatement,
        List<CardEmi> emis,
        BigDecimal emiMonthlyTotal
) {

    public record LatestStatement(CardStatement statement, BigDecimal paidSince, BigDecimal remaining,
                                  BigDecimal minimumDueRemaining, StatementStatus status) {
    }

    public record CardEmi(Long loanId, String name, BigDecimal emi, LocalDate nextChargeDate,
                          LocalDate lastChargeDate, int emisLeft) {
    }
}
