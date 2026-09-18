package com.finance.transaction.domain;

import com.finance.account.domain.AccountType;

/**
 * What kind of money movement this is.
 *
 * <p>An enum, not a table, for the same reason as {@code AccountType} (ADR-0008): the
 * behaviour is compiled in. The type decides whether a destination account is
 * required, whether a category is required, how postings are generated, and whether
 * the movement counts as spending. A user cannot invent a sixth kind of transaction
 * without new business rules.
 */
public enum TransactionType {

    /** Money arriving. Posts +account. Does not count as spending. */
    INCOME(false, true, false),

    /** Money leaving. Posts -account. The only type that counts as spending. */
    EXPENSE(false, true, true),

    /** Money moving between the user's own accounts. Posts -from, +to. Never spending. */
    TRANSFER(true, false, false),

    /** Money moving into an investment account. Posts -from, +investment. Never spending. */
    INVESTMENT(true, false, false),

    /** Money returned against an earlier expense. Posts +account, reduces its category. */
    REFUND(false, true, false);

    private final boolean requiresDestination;
    private final boolean requiresCategory;
    private final boolean countsAsSpending;

    TransactionType(boolean requiresDestination, boolean requiresCategory, boolean countsAsSpending) {
        this.requiresDestination = requiresDestination;
        this.requiresCategory = requiresCategory;
        this.countsAsSpending = countsAsSpending;
    }

    /** TRANSFER and INVESTMENT move money between two accounts the user already holds. */
    public boolean requiresDestination() {
        return requiresDestination;
    }

    /** INCOME, EXPENSE and REFUND are categorised. A transfer of money is not "spending". */
    public boolean requiresCategory() {
        return requiresCategory;
    }

    /** Only EXPENSE counts as spending. See domain rule 6. */
    public boolean countsAsSpending() {
        return countsAsSpending;
    }

    /**
     * Whether {@code accountId} - the source - can actually fund this kind of movement.
     *
     * <p>Confirmed missing until now: {@code POST /transactions} accepted an EXPENSE
     * charged against a LOAN account with no rejection anywhere (LEDGER_IMPROVEMENT_PLAN
     * §2 P1). A loan is a debt you owe, not a wallet you spend from, and letting one fund
     * an expense both means nothing and corrupts the account's balance.
     *
     * <p>Deliberately not {@code AccountType.isSpendable()} - that means "counts toward
     * Real Balance", which excludes {@code CREDIT_CARD}. Reusing it here would silently
     * forbid spending on a credit card, which is obviously wrong.
     */
    public boolean acceptsSource(AccountType accountType) {
        return switch (this) {
            // A refund goes back where the purchase was paid from - most often a card,
            // where it lowers what's owed.
            case EXPENSE, REFUND -> accountType == AccountType.BANK
                    || accountType == AccountType.CASH
                    || accountType == AccountType.CREDIT_CARD;
            case INCOME, TRANSFER, INVESTMENT ->
                    accountType == AccountType.BANK || accountType == AccountType.CASH;
        };
    }

    /**
     * Whether {@code toAccountId} can receive this kind of movement. Only meaningful
     * when {@link #requiresDestination()} is true.
     *
     * <p>{@code CREDIT_CARD} and {@code LOAN} stay valid transfer destinations on
     * purpose: paying a card bill is a transfer (the purchase already counted at swipe -
     * rule 4), and a loan prepayment genuinely reduces principal 1:1. {@code INVESTMENT}
     * only receives the {@code INVESTMENT} type, which exists specifically for that move.
     */
    public boolean acceptsDestination(AccountType accountType) {
        return switch (this) {
            case TRANSFER -> accountType == AccountType.BANK
                    || accountType == AccountType.CASH
                    || accountType == AccountType.CREDIT_CARD
                    || accountType == AccountType.LOAN
                    || accountType == AccountType.INVESTMENT;
            case INVESTMENT -> accountType == AccountType.INVESTMENT;
            case INCOME, EXPENSE, REFUND -> false;
        };
    }
}
