package com.finance.forecast;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * One forecast month: what the plan as it stands today says would happen, applying the
 * same rule engine ({@code CommitmentInstanceGenerator}) and bucket classification
 * ({@code CommitmentBucketClassifier}) as the current month's own shape and review - so a
 * forecast for "this month" (index 0) matches {@code CycleShape} exactly, and every later
 * month is the same calculation projected forward. Nothing here is stored (ADR-0011); it is
 * recomputed on every request from the commitments that exist right now.
 *
 * <p><strong>This is a projection, not a prediction</strong> (STRATEGY_DEEP_DIVE §V): it
 * assumes every rule keeps recurring exactly as written, with no unplanned spending and no
 * rule changes. A one-off due only in one specific month appears only there; a rule with an
 * end date stops appearing after it.
 *
 * @param incomeExpected  planned income this month (rules settled as INCOME)
 * @param committed       planned spending, and transfers paying off a card or loan
 * @param setAside        planned investments, and transfers into money that isn't for spending
 * @param flexible        {@code incomeExpected - committed - setAside}; null when nothing is
 *                        planned to come in this month (nothing to divide - ADR-0006)
 * @param unknownAmountCount how many of this month's bills are variable (no amount to project);
 *                           they contribute nothing to the totals above, so those are a floor
 * @param unlocks         bills that stop recurring starting this month because their last
 *                        occurrence was last month - money that becomes free
 * @param annualItems     bills due this month that don't come every month (quarterly, annual) -
 *                        the ones easy to forget between occurrences
 */
public record ForecastMonth(
        LocalDate cycleStart,
        LocalDate cycleEnd,
        BigDecimal incomeExpected,
        BigDecimal committed,
        BigDecimal setAside,
        BigDecimal flexible,
        int unknownAmountCount,
        List<ForecastUnlock> unlocks,
        List<ForecastAnnualItem> annualItems
) {
}
