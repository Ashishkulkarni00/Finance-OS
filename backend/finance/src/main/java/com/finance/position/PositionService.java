package com.finance.position;

/**
 * Real Balance and Room - the product's core computed endpoint.
 *
 * <p>{@code RealBalance = Σ balance(spendable accounts) − Σ reservations −
 * Σ outstanding(open mandatory instances in the current cycle)}. Refuses to compute
 * (returns {@code complete=false}) when a mandatory instance's amount is unknown -
 * Principle 1: never confidently wrong. See DOMAIN_MODEL.md §5.
 */
public interface PositionService {

    PositionResult currentPosition();

    NetWorthResult currentNetWorth();

    /** What's held in cash and bank right now, and how much of it is already spoken for.
     *  Unlike {@link #currentPosition()} this never refuses - see {@link CashPosition}. */
    CashPosition currentCashPosition();
}
