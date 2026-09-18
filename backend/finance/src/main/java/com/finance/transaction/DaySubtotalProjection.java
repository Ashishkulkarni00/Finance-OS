package com.finance.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One day's totals within a filtered set - see {@code TransactionRepository.daySubtotals}. */
public interface DaySubtotalProjection {
    LocalDate getDate();
    BigDecimal getMoneyIn();
    BigDecimal getMoneyOut();
    BigDecimal getTransferred();
}
