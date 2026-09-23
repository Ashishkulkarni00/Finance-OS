package com.finance.forecast;

import java.math.BigDecimal;
import java.util.List;

/**
 * {@code GET /forecast?months=} - see {@link ForecastMonth}. Index 0 is the current month.
 *
 * @param unlockedMonthlyTotal what stops leaving every month across the whole horizon, once
 *                             every bill that ends in it has ended. Summed here rather than
 *                             in the browser, which never adds money up
 *                             (FRONTEND_CONVENTIONS §4 rule 2). Zero when nothing ends.
 */
public record ForecastResult(List<ForecastMonth> months, BigDecimal unlockedMonthlyTotal) {
}
