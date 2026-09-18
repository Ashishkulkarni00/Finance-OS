package com.finance.account.domain;

/**
 * How much the opening balance can be trusted.
 *
 * <p>Exists because the product refuses to be confidently wrong. A user setting up
 * an account often genuinely does not know the exact figure - one of their banks may
 * be under maintenance, or the balance may be a recollection rather than a reading.
 *
 * <p>Recording that uncertainty lets downstream figures be labelled "approximate"
 * instead of silently presented as fact.
 */
public enum BalanceConfidence {

    /** Read directly from the bank. */
    CONFIRMED,

    /** A considered figure, but not verified against a statement. */
    ESTIMATED,

    /** Not known. Any total that includes this account must say so. */
    UNKNOWN
}
