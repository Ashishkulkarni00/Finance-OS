package com.finance.forecast;

import com.finance.commitment.CommitmentBucket;

import java.math.BigDecimal;

/**
 * A bill whose last occurrence was the month before this one, so this month is the first
 * one it no longer takes from - the "₹6,145/month frees up" moment. Only PAYMENT and
 * SET_ASIDE bills unlock money this way; income ending isn't a good thing, so it's never
 * listed here. A bill with a variable amount is never counted (no figure to free up).
 */
public record ForecastUnlock(Long commitmentId, String name, BigDecimal amount, CommitmentBucket bucket) {
}
