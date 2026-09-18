package com.finance.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One day's totals within the Ledger's current filters - the band above each day's
 *  rows. See LEDGER_UX_SPEC.md §2 Zone 4. */
public record DaySubtotal(LocalDate date, BigDecimal moneyIn, BigDecimal moneyOut, BigDecimal transferred) {
}
