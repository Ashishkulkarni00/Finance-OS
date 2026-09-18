package com.finance.commitment.dto;

import com.finance.commitment.domain.CommitmentSource;
import com.finance.transaction.domain.TransactionType;
import com.finance.account.dto.AccountSummary;
import com.finance.category.dto.CategorySummary;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record CommitmentResponse(
        Long id,
        String name,
        CommitmentAmountType amountType,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal fixedAmount,

        CommitmentFrequency frequency,
        int dueDay,
        AccountSummary account,
        CategorySummary category,

        /** MANUAL, or what the bill follows (LOAN + sourceId). */
        CommitmentSource sourceType,
        Long sourceId,

        /** The kind of Ledger entry that pays it: EXPENSE, TRANSFER, INVESTMENT or INCOME. */
        TransactionType settleAs,

        /** Where the money goes for a TRANSFER or INVESTMENT bill. */
        Long toAccountId,
        boolean mandatory,
        boolean requiresVerification,
        LocalDate activeFrom,
        LocalDate activeTo,
        String why,
        String ifSkipped,
        boolean archived,
        Instant archivedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
