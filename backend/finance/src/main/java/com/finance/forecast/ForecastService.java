package com.finance.forecast;

/** The forward-looking projection behind Ahead: unlocks, annual items, what-if (STRATEGY_DEEP_DIVE §I1). */
public interface ForecastService {

    /** Projects {@code months} cycles starting with the current one (index 0). */
    ForecastResult forecast(int months);
}
