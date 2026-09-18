package com.finance.commitment.dto;

import com.finance.commitment.domain.CommitmentSource;
import com.finance.transaction.domain.TransactionType;
import com.finance.account.dto.AccountSummary;
import com.finance.category.dto.CategorySummary;
import com.finance.commitment.domain.AttentionTier;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record CommitmentInstanceResponse(
        Long id,
        Long commitmentId,
        String commitmentName,
        Long cycleId,
        LocalDate dueDate,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal expectedAmount,

        CommitmentInstanceStatus status,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal confirmedAmount,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal outstanding,

        Instant confirmedAt,

        /** The day the money actually moved - the linked transaction's date, not the
         *  moment we were told. Null while unsettled. */
        LocalDate settledOn,

        Long linkedTransactionId,
        boolean mandatory,
        String ifSkipped,

        /** The account this leaves from - shown inline on the row, not behind a click. */
        AccountSummary account,

        /** The bill's category - This Month groups its plan by it. Null when none is set. */
        CategorySummary category,

        /** MANUAL, or what the bill follows (LOAN + sourceId). */
        CommitmentSource sourceType,
        Long sourceId,

        /** The kind of Ledger entry that pays it. */
        TransactionType settleAs,

        /** Where the money goes for a TRANSFER or INVESTMENT bill. */
        Long toAccountId,

        AttentionTier attentionTier,

        /** Positive = cost more than planned, negative = less. Null unless settled with
         *  both figures known - see CommitmentInstance.variance(). */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal variance
) {
}
