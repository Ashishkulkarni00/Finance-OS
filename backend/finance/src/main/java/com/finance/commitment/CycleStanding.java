package com.finance.commitment;

import java.math.BigDecimal;

/**
 * Plan's "Standing" mirror line: "₹57,700 comes in. ₹24,349 is committed before you
 * spend anything - 42%. That leaves about ₹33,351 for everything else this cycle."
 * See docs/product/PLAN_EXPERIENCE.md §2.
 *
 * <p>Lives here rather than in {@code cycle} because it needs both a cycle's income
 * (via {@code CycleService}) and this cycle's committed total (via
 * {@code CommitmentPlanProgress}) - {@code commitment} already depends on
 * {@code cycle} one-way (see {@code CommitmentInstanceServiceImpl}), so combining them
 * here adds no new dependency direction. Putting it in {@code cycle} instead would
 * require {@code cycle} to depend back on {@code commitment}, a real circular bean
 * dependency - the same shape {@code CurrentCycleResolver} exists to avoid.
 */
public record CycleStanding(
        /** Received plus still expected this cycle - see {@code standing}. */
        BigDecimal incomeTotal,
        /** The part of {@code incomeTotal} that hasn't arrived yet. */
        BigDecimal incomeExpectedTotal,
        BigDecimal committedTotal,
        BigDecimal uncommittedTotal,
        BigDecimal committedShare
) {
}
