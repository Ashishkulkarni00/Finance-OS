package com.finance.forecast;

import java.util.List;

/** {@code GET /forecast?months=} - see {@link ForecastMonth}. Index 0 is the current month. */
public record ForecastResult(List<ForecastMonth> months) {
}
