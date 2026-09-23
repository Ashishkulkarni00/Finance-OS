package com.finance.card.dto;

import com.finance.account.dto.AccountSummary;
import com.finance.card.domain.CardNetwork;
import com.finance.card.domain.StatementStatus;
import com.finance.common.money.MoneySerializer;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * A credit card and everything derived about it today. Every figure is computed on read
 * from the card account's postings and its typed statements (ADR-0011).
 */
public record CreditCardResponse(
        Long accountId,
        String name,
        String institution,
        String lastFour,
        CardNetwork network,

        /** False for a card account with no terms yet - limit, statement and due day. */
        boolean setUp,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal creditLimit,
        Integer statementDay,
        Integer dueDay,
        AccountSummary payFromAccount,

        /** Owed now, billed and unbilled. Negative means the card is in credit. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal outstanding,

        /** What you could still spend: limit − outstanding − EMI principal still blocked.
         *  Null until set up. Can go negative if the card is over its limit. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal availableCredit,

        /** How much of the limit is used - owed plus blocked EMI principal, over the limit,
         *  as a fraction (0.42 = 42%). Null until set up. */
        BigDecimal utilisation,

        /** Principal still owed on EMIs on this card - blocked against the limit, so it is
         *  already taken out of {@code availableCredit}. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal emiPrincipalBlocked,

        /** Spent on the card since the latest statement - heading for the next bill. Null
         *  when no statement has been recorded. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal unbilled,

        /** The date the card is tracked from - its opening balance's date. */
        LocalDate trackedSince,

        LocalDate nextStatementDate,
        LocalDate nextStatementDueDate,

        /** The latest recorded statement and how much of it is still to pay. Null if none. */
        LatestStatement latestStatement,

        /** EMIs charged to this card: loans whose EMI is paid from it. */
        List<CardEmi> emis,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal emiMonthlyTotal
) {

    public record LatestStatement(
            Long id,
            LocalDate statementDate,
            LocalDate dueDate,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal totalAmount,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal minimumDue,
            /** Payments and credits on the card after the statement date. */
            @JsonSerialize(using = MoneySerializer.class) BigDecimal paidSince,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal remaining,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal minimumDueRemaining,
            StatementStatus status
    ) {
    }

    public record CardEmi(
            Long loanId,
            String name,
            @JsonSerialize(using = MoneySerializer.class) BigDecimal emi,
            LocalDate nextChargeDate,
            LocalDate lastChargeDate,
            int emisLeft
    ) {
    }
}
