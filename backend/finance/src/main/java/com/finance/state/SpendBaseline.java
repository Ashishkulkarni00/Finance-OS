package com.finance.state;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * What this user's day-to-day spending usually is, from their own history
 * ({@code FINANCIAL_STATE.md} §2, ROADMAP 2.1).
 *
 * <p>This exists so the product can say <em>"₹3,200 above your usual"</em> without ever
 * having invented a budget. Rule 8 forbids judging the user, and the settled decision on
 * per-category budgets is <strong>no</strong>: a number picked in an optimistic moment is a
 * number to fail against. A baseline is different in kind — it is a measurement of what they
 * already do, and it cannot be failed.
 *
 * <p><strong>Nothing may be claimed until there is history to claim it from.</strong> With
 * fewer than {@link SpendBaselineCalculator#MINIMUM_CYCLES} complete cycles, {@code perCycle}
 * is null, and null means unknown (ADR-0006). This is not a placeholder to be filled in with
 * zero later: a first-month user genuinely has no usual, and a product that invents one is
 * back to being a budget.
 *
 * @param perCycle        the usual flexible spend in one salary cycle; null until there is
 *                        enough history
 * @param cyclesObserved  how many complete cycles it was measured over
 * @param observedFrom    the start of the earliest cycle counted; null when none were
 * @param observedTo      the end of the latest cycle counted; null when none were
 * @param lowest          the quietest complete cycle seen, for range; null when none
 * @param highest         the busiest complete cycle seen, for range; null when none
 */
public record SpendBaseline(
        BigDecimal perCycle,
        int cyclesObserved,
        LocalDate observedFrom,
        LocalDate observedTo,
        BigDecimal lowest,
        BigDecimal highest
) {

    public boolean isKnown() {
        return perCycle != null;
    }

    static SpendBaseline unknown(int cyclesObserved) {
        return new SpendBaseline(null, cyclesObserved, null, null, null, null);
    }
}
