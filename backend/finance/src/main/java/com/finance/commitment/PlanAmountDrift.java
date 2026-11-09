package com.finance.commitment;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A fixed-amount bill whose last payments keep differing from its plan the same way -
 * ROADMAP 3.1's "subscription drift" (see {@link PlanAmountDriftCalculator}).
 *
 * @param planned  the plan's fixed amount
 * @param latest   the most recent payment
 * @param previous the one before it
 * @param lastOn   when the most recent one was due
 */
public record PlanAmountDrift(Long commitmentId, String name, BigDecimal planned, BigDecimal latest,
                              BigDecimal previous, LocalDate lastOn) {

    public boolean costsMore() {
        return latest.compareTo(planned) > 0;
    }
}
