package com.finance.insurance;

import com.finance.insurance.domain.InsurancePolicy;

import java.math.BigDecimal;

/**
 * A policy with what's derived from it - never stored (ADR-0011).
 *
 * @param monthlyCost    the premium spread over the months it covers. Null when the premium
 *                       or its frequency is unknown - never zero, which would quietly
 *                       improve the monthly picture
 * @param status         where it stands against its renewal date
 * @param daysToRenewal  negative once it has lapsed. Null without a renewal date
 * @param premiumCommitmentId the bill that pays this premium, or null if it isn't planned
 */
public record InsurancePolicyView(InsurancePolicy policy, BigDecimal monthlyCost, CoverStatus status,
                                  Integer daysToRenewal, Long premiumCommitmentId) {
}
