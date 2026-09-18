package com.finance.commitment;

import java.math.BigDecimal;

/**
 * The month in one line - This Month's derivation strip:
 * <pre>
 *   expected in − committed − planned savings = flexible
 *   spent so far (of flexible) · share of the cycle gone
 * </pre>
 * Everything is derived at read time (ADR-0011).
 *
 * <ul>
 *   <li>{@code committed} - bills that are spent: expenses, and transfers that pay a card or
 *       a loan.</li>
 *   <li>{@code plannedSavings} - SIP/RD instalments and transfers into an account that isn't
 *       spendable (an emergency fund). Moving money between two spendable accounts is
 *       neither.</li>
 *   <li>{@code spent} - expenses in the cycle that aren't paying a planned bill, less
 *       refunds: the flexible money actually used. Never negative.</li>
 * </ul>
 *
 * <p>{@code state} keeps it honest (ADR-0006): {@code NO_INCOME} when nothing is expected or
 * recorded coming in (flexible is null - there is nothing to divide), {@code INCOMPLETE}
 * when a bill still needs an amount (flexible is then an upper bound), else {@code COMPLETE}.
 */
public record CycleShape(
        State state,
        BigDecimal expectedIn,
        BigDecimal incomeStillExpected,
        BigDecimal committed,
        BigDecimal plannedSavings,
        BigDecimal flexible,
        int unknownAmountCount,
        BigDecimal spent,
        /** spent ÷ flexible, as a fraction; null when flexible isn't positive. */
        BigDecimal spentShare,
        /** Share of the cycle's days gone, including today: 0 before it starts, 1 once it ends. */
        BigDecimal cycleElapsed
) {
    public enum State { COMPLETE, INCOMPLETE, NO_INCOME }
}
