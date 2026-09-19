package com.finance.insight;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

/**
 * One thing worth the user's attention, with the fact behind it and one way to act.
 * Derived at read time (ADR-0011) - never stored. See docs/product/STRATEGY_DEEP_DIVE.md
 * (Phase 1) and PRODUCT_AUDIT.md §6.
 *
 * @param key         stable identity ("instance:31:overdue") - de-duplication now,
 *                    dismiss/snooze later (the insight_state table is deferred SQL)
 * @param title       what is happening, in plain words
 * @param explanation the basis: the figures and dates it comes from. No insight without one.
 * @param impact      rupee size, for ranking; null when not about an amount
 * @param when        the date it matters by, for ranking; null when not dated
 */
public record Insight(
        String key,
        InsightType type,
        Severity severity,
        String title,
        String explanation,
        BigDecimal impact,
        LocalDate when,
        InsightAction action,
        Set<Surface> surfaces
) {

    /** CRITICAL = money is lost if nothing happens (a bounce, a late fee). Never shown red. */
    public enum Severity { CRITICAL, ATTENTION, OPPORTUNITY, INFO }

    public enum Surface { TODAY, MONTH }
}
