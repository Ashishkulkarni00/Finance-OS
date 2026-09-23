package com.finance.insurance.domain;

/**
 * How often a premium is paid. Separate from {@code CommitmentFrequency}, which only knows
 * MONTHLY/QUARTERLY/ANNUAL - most policies are annual, and half-yearly is common enough in
 * India to be worth naming rather than forcing into "every 3 months".
 */
public enum PremiumFrequency {

    MONTHLY("Every month", 12),
    QUARTERLY("Every 3 months", 4),
    HALF_YEARLY("Every 6 months", 2),
    ANNUAL("Every year", 1),
    /** Paid once - a single-premium policy, or one an employer pays. */
    ONE_OFF("One-off", 0);

    private final String label;
    private final int timesPerYear;

    PremiumFrequency(String label, int timesPerYear) {
        this.label = label;
        this.timesPerYear = timesPerYear;
    }

    public String label() {
        return label;
    }

    /** How many premiums fall in a year - 0 for a one-off, which costs nothing per month. */
    public int timesPerYear() {
        return timesPerYear;
    }
}
