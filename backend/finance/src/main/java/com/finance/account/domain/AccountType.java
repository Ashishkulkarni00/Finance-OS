package com.finance.account.domain;

/**
 * What kind of money container this is.
 *
 * <p>An enum rather than a lookup table because the <em>behaviour</em> of each type
 * is compiled into the application: whether it holds spendable cash, whether it is
 * an asset or a liability, and how its balance is signed. A user cannot invent a
 * sixth kind of money without new business rules, so this is not user-managed data.
 *
 * <p>Categories are the opposite case and are a table - see ADR-0008.
 */
public enum AccountType {

    /** Savings or current account at a bank. Spendable, asset. */
    BANK(true, true, false),

    /** Physical cash. Spendable, asset. In India this is not a rounding error. */
    CASH(true, true, false),

    /** Credit card. A liability: a positive balance here means money owed. */
    CREDIT_CARD(false, false, true),

    /** A loan. Liability. Balance is the amount still to repay. */
    LOAN(false, false, true),

    /** Brokerage, mutual fund, RD, PF. Asset, but not spendable today. */
    INVESTMENT(false, true, false),

    /**
     * Internal counterpart for opening balances and pre-tracking history.
     * Never shown to the user, never counted anywhere.
     */
    SYSTEM(false, false, false);

    private final boolean spendable;
    private final boolean asset;
    private final boolean liability;

    AccountType(boolean spendable, boolean asset, boolean liability) {
        this.spendable = spendable;
        this.asset = asset;
        this.liability = liability;
    }

    /** Counts toward Real Balance. Investments and cards deliberately do not. */
    public boolean isSpendable() {
        return spendable;
    }

    /** Counts as a positive component of net worth. */
    public boolean isAsset() {
        return asset;
    }

    /** Counts as a negative component of net worth. */
    public boolean isLiability() {
        return liability;
    }
}
