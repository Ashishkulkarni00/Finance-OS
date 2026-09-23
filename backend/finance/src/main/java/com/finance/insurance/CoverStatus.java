package com.finance.insurance;

/**
 * Where a policy stands against its renewal date - the only status that matters, because
 * a lapsed policy is the one case where the money looks fine and the exposure is total.
 */
public enum CoverStatus {

    /** The renewal date has passed. Cover may already be gone. */
    LAPSED,
    /** Renews within {@link InsurancePolicyServiceImpl#RENEWAL_WINDOW_DAYS} days. */
    RENEWS_SOON,
    ACTIVE,
    /** No renewal date recorded - we don't know, and won't pretend otherwise (ADR-0006). */
    UNKNOWN
}
