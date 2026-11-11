package com.finance.commitment.dto;

import com.finance.commitment.domain.CommitmentSource;
import com.finance.commitment.domain.SkipReason;
import com.finance.transaction.domain.TransactionType;
import com.finance.account.dto.AccountSummary;
import com.finance.category.dto.CategorySummary;
import com.finance.commitment.domain.AttentionTier;
import com.finance.effect.dto.WriteEffectResponse;
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

        /** This month's amount was set by hand and no longer follows the bill (V22). */
        boolean amountOverridden,

        /**
         * What the bill itself says, when it says anything - so a changed month can show
         * what it is changed *from* ("usually ₹1,790"). Null for a bill whose amount varies,
         * which has no usual figure to diverge from.
         */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal ruleAmount,

        /** The account this leaves from - shown inline on the row, not behind a click. */
        AccountSummary account,

        /**
         * Where the money actually left from, when that is not the bill's own account.
         *
         * <p>Null when they agree. A bill may be settled from any account - "Paid from" is
         * the plan, not a gate (USAGE_ISSUES U3) - so a settled row cannot report the
         * commitment's account and call it the truth.
         */
        AccountSummary settledFromAccount,

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
        BigDecimal variance,

        /** Why this month was skipped, and the user's note. Null unless SKIPPED. */
        SkipReason skipReason,
        String skipNote,

        /** What this write just did (ADR-0017). Absent on reads, and on writes that moved
         *  nothing - settling a bill is the moment "what did that cost me?" is asked. */
        WriteEffectResponse effect
) {

    public CommitmentInstanceResponse withEffect(WriteEffectResponse effect) {
        return new CommitmentInstanceResponse(id, commitmentId, commitmentName, cycleId, dueDate, expectedAmount,
                status, confirmedAmount, outstanding, confirmedAt, settledOn, linkedTransactionId, mandatory,
                ifSkipped, amountOverridden, ruleAmount, account, settledFromAccount, category, sourceType, sourceId,
                settleAs, toAccountId, attentionTier, variance, skipReason, skipNote, effect);
    }
}
