package com.finance.transaction.dto;

import com.finance.account.dto.AccountSummary;
import com.finance.category.dto.CategorySummary;
import com.finance.transaction.domain.TransactionType;
import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** What the API exposes for a transaction. The entity and its postings are never serialised. */
public record TransactionResponse(
        Long id,
        LocalDate date,
        String description,
        TransactionType type,
        String typeLabel,
        boolean countsAsSpending,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal amount,

        AccountSummary account,
        AccountSummary toAccount,
        CategorySummary category,

        String merchant,
        String note,

        Instant createdAt,
        Instant updatedAt
) {
}
