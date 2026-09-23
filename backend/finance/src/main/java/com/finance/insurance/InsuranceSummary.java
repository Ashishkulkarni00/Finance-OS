package com.finance.insurance;

import java.math.BigDecimal;

/**
 * The protection picture in one line.
 *
 * <p>{@code totalCover} is summed for information only and is <strong>never net worth</strong>:
 * cover is money you would not have to find, not money you have. It is also not a single
 * pot - ₹5L of health and ₹1cr of life don't add up to anything you could spend.
 *
 * @param policies       active policies
 * @param totalCover     cover across them, for reassurance only - see above
 * @param monthlyPremium what protection costs per month. Null when any policy's premium is
 *                       unknown, rather than a total silently missing one (ADR-0006)
 * @param lapsed         policies whose renewal date has passed
 * @param renewingSoon   policies renewing inside the window
 * @param unknownRenewal policies with no renewal date recorded
 */
public record InsuranceSummary(int policies, BigDecimal totalCover, BigDecimal monthlyPremium,
                               int lapsed, int renewingSoon, int unknownRenewal) {
}
