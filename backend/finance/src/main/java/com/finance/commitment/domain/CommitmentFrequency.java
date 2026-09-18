package com.finance.commitment.domain;

/** How often a commitment generates an instance, relative to the salary cycle. */
public enum CommitmentFrequency {

    /** Every cycle. */
    MONTHLY,

    /** Every third cycle from {@code activeFrom}. */
    QUARTERLY,

    /** Once a year, in the cycle containing the anniversary of {@code activeFrom}. */
    ANNUAL
}
