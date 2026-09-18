package com.finance.category.domain;

/**
 * How a category groups spending for reporting.
 *
 * <p>Mostly informational - unlike {@code AccountType}, no money calculation branches
 * on this value; it exists so the Month screen can group spending sensibly, and the
 * committed/flexible split that actually drives Real Balance lives on
 * {@code Commitment}, not here. See OPEN_QUESTIONS Q2.
 *
 * <p>{@link #INCOME} is the one exception that <em>is</em> enforced: a transaction's
 * direction and its category's group must agree ({@code TransactionServiceImpl}), so an
 * income category can no longer land on an expense or vice versa. Confirmed missing
 * until this was added - "Salary Credit" was seeded into {@code FLEXIBLE}, a
 * discretionary-spending group, because no income group existed for it to belong to
 * (LEDGER_IMPROVEMENT_PLAN §2 P2).
 */
public enum CategoryGroup {

    /** Discretionary day-to-day spending: groceries, drinks, transport. */
    FLEXIBLE,

    /** Recurring and largely non-negotiable: rent, EMIs, subscriptions. */
    FIXED,

    /** One-off, planned: a trip, a gift, a festival. */
    EVENT,

    /** Movements that are not spending at all: transfers, investments. */
    NON_SPEND,

    /**
     * Money arriving that isn't a reversal of spending: salary, freelance income,
     * interest. Only {@code INCOME} transactions require a category from this group.
     *
     * <p>{@code REFUND} deliberately does <strong>not</strong> use this group - a refund
     * reverses an earlier expense (a returned shirt is negative Shopping, not income), so
     * it takes an expense-side category, keeping that category's net total truthful. It
     * would otherwise show as spending in Shopping and, separately, as unrelated income.
     */
    INCOME
}
