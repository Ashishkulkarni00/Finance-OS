package com.finance.cycle;

import java.math.BigDecimal;

/**
 * The live in/out/saved figures for a still-open cycle - SCREEN_SPECS S3 hierarchy #2.
 * Distinct from {@code CycleSnapshot}: this is never persisted, recomputed on every
 * read (ADR-0011), and carries no realBalance/netWorth (Month's net-position line
 * doesn't need them, so it doesn't pay for computing them).
 */
public record CycleSummary(BigDecimal incomeTotal, BigDecimal expenseTotal, BigDecimal investedTotal,
                           BigDecimal transferredTotal, BigDecimal net, BigDecimal savingsRate) {
}
