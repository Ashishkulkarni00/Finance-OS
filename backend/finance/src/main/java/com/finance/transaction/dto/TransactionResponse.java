package com.finance.transaction.dto;

import com.finance.account.dto.AccountSummary;
import com.finance.category.dto.CategorySummary;
import com.finance.effect.dto.WriteEffectResponse;
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
        Instant updatedAt,

        /** What this write just did - room before and after, and anything that crossed a
         *  line (ADR-0017). Absent on reads, and on writes that moved nothing. */
        WriteEffectResponse effect
) {

    /** The same response, now able to say what it cost. Kept as a copy rather than a
     *  mutable field so the mapper stays free of anything the reactive layer needs. */
    public TransactionResponse withEffect(WriteEffectResponse effect) {
        return new TransactionResponse(id, date, description, type, typeLabel, countsAsSpending, amount,
                account, toAccount, category, merchant, note, createdAt, updatedAt, effect);
    }
}
