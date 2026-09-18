package com.finance.commitment.dto;

import com.finance.commitment.domain.CommitmentSource;
import com.finance.transaction.domain.TransactionType;
import com.finance.account.dto.AccountSummary;
import com.finance.category.dto.CategorySummary;
import com.finance.commitment.domain.AttentionTier;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.transaction.dto.TransactionResponse;
import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Everything the commitment detail route needs in one call: this occurrence, the rule
 * behind it (including why it exists and what happens if it's skipped), the transaction
 * that settled it if any, and its recent history across cycles.
 */
public record CommitmentInstanceDetailResponse(
        Long id,
        LocalDate dueDate,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal expectedAmount,

        CommitmentInstanceStatus status,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal confirmedAmount,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal outstanding,

        Instant confirmedAt,
        AttentionTier attentionTier,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal variance,

        Long commitmentId,
        String commitmentName,
        String why,
        String ifSkipped,
        CommitmentAmountType amountType,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal fixedAmount,

        CommitmentFrequency frequency,
        int dueDay,
        boolean mandatory,
        boolean requiresVerification,
        AccountSummary account,
        CategorySummary category,
        CommitmentSource sourceType,
        Long sourceId,
        TransactionType settleAs,
        Long toAccountId,

        TransactionResponse linkedTransaction,
        List<CommitmentInstanceHistoryEntry> history
) {
}
