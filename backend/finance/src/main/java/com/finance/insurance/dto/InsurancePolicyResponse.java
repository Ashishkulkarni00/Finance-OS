package com.finance.insurance.dto;

import com.finance.common.money.MoneySerializer;
import com.finance.insurance.CoverStatus;
import com.finance.insurance.domain.InsuranceType;
import com.finance.insurance.domain.PremiumFrequency;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record InsurancePolicyResponse(
        Long id,
        InsuranceType type,
        String typeLabel,
        String name,
        String insurer,
        String policyLastFour,

        /**
         * What you'd be covered for. <strong>Not an asset</strong> - never added to net
         * worth, never spendable. Null when it was never recorded, which is common.
         */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal coverAmount,

        /** Null when the user pays nothing for it - an employer policy still has cover. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal premium,

        PremiumFrequency premiumFrequency,

        /** The premium spread over the months it covers. Null when unknown, never zero. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal monthlyCost,

        LocalDate renewsOn,
        LocalDate startedOn,

        /** LAPSED / RENEWS_SOON / ACTIVE / UNKNOWN - measured against {@code renewsOn}. */
        CoverStatus status,

        /** Negative once it has lapsed. Null without a renewal date. */
        Integer daysToRenewal,

        String covers,
        String note,

        /** The loan that financed this premium, when it was put on a card in instalments. */
        Long loanId,

        /** The bill that pays this premium, or null if it isn't in the plan. */
        Long premiumCommitmentId,

        boolean archived,
        Instant archivedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
