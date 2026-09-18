package com.finance.cycle;

import java.math.BigDecimal;
import java.util.List;

/**
 * Day-to-day spending this cycle, broken down by category, largest first.
 *
 * <p>Only FLEXIBLE-group categories. Committed spending (rent, EMIs, utilities) already
 * has a home on the commitment worklist, so counting it here too would show the same
 * rupee twice under two headings.
 *
 * <p>{@code total} exists because the screen leads with it and the browser is not
 * allowed to add money up. {@code largest} names the category with the biggest share,
 * which is the one fact a list of six numbers makes you work to find.
 */
public record FlexibleSpending(
        BigDecimal total,
        List<CategorySpend> categories
) {

    /** The dominant category, or null when nothing has been spent yet. */
    public CategorySpend largest() {
        return categories.isEmpty() ? null : categories.getFirst();
    }
}
