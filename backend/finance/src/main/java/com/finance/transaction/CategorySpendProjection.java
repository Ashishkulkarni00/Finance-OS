package com.finance.transaction;

import java.math.BigDecimal;

/** One category's total spend within a date range - see {@code TransactionRepository}. */
public interface CategorySpendProjection {
    Long getCategoryId();
    BigDecimal getTotal();
}
