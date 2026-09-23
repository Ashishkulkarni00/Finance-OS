package com.finance.account.dto;

import com.finance.effect.dto.WriteEffectResponse;

import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.account.domain.AccountType;
import com.finance.account.domain.BalanceConfidence;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * What the API exposes for an account. The entity itself is never serialised.
 *
 * <p>All monetary fields are emitted as JSON <em>strings</em> to preserve exactness.
 */
public record AccountResponse(

        Long id,
        String name,
        AccountType type,
        String typeLabel,
        String institution,
        String lastFour,
        String currency,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal openingBalance,
        LocalDate openingAsOf,
        BalanceConfidence openingConfidence,

        /**
         * Balance as at {@code balanceAsOf}, derived - never stored.
         *
         * <p>Until transactions exist (milestone 2) this equals the opening balance,
         * which is correct rather than approximate: with no recorded movements the
         * opening balance <em>is</em> the current balance.
         */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal currentBalance,
        LocalDate balanceAsOf,

        /** balance − reserved − mandatory minimum. See AccountAvailableCalculator. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal available,

        /** Why {@code available} is lower than {@code currentBalance}, itemised, so the
         *  gap can be explained on screen instead of merely asserted. */
        AccountHoldResponse hold,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal minimumBalance,
        boolean minimumBalanceMandatory,
        boolean belowMinimumBalance,

        boolean includeInSpendable,
        boolean includeInNetWorth,
        boolean countsAsSpendable,
        boolean asset,
        boolean liability,

        String purpose,
        int displayOrder,
        boolean archived,
        Instant archivedAt,
        Instant createdAt,
        Instant updatedAt,

        /** What this write just did (ADR-0017). Re-basing an opening balance moves Real
         *  Balance directly, which is exactly when the user should hear about it. */
        WriteEffectResponse effect
) {

    public AccountResponse withEffect(WriteEffectResponse effect) {
        return new AccountResponse(id, name, type, typeLabel, institution, lastFour, currency, openingBalance,
                openingAsOf, openingConfidence, currentBalance, balanceAsOf, available, hold, minimumBalance,
                minimumBalanceMandatory, belowMinimumBalance, includeInSpendable, includeInNetWorth,
                countsAsSpendable, asset, liability, purpose, displayOrder, archived, archivedAt,
                createdAt, updatedAt, effect);
    }

}
