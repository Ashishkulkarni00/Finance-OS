package com.finance.transaction;

import java.math.BigDecimal;

/**
 * The Ledger's "stated view" total - the same filters as the list, collapsed into one
 * row, computed independently of pagination so the total never disagrees with itself as
 * the user pages through. See LEDGER_UX_SPEC.md §2 Zone 1.
 *
 * <p>Three figures, not one net: {@code moneyIn} (INCOME, REFUND) and {@code moneyOut}
 * (EXPENSE) kept apart so a mixed view doesn't collapse into a misleading single number,
 * and {@code transferred} (TRANSFER, INVESTMENT) kept out of both entirely - a transfer
 * is not a gain or a loss, it's the same money in a different pocket, and folding it into
 * spending is exactly the double-count rule 4 forbids.
 */
public record TransactionViewSummary(
        BigDecimal moneyIn,
        BigDecimal moneyOut,
        BigDecimal transferred,
        int entryCount
) {
}
