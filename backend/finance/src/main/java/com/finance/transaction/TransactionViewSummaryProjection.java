package com.finance.transaction;

import java.math.BigDecimal;

/** One collapsed row over a filtered set of transactions - see {@code TransactionRepository.viewSummary}. */
public interface TransactionViewSummaryProjection {
    BigDecimal getMoneyIn();
    BigDecimal getMoneyOut();
    BigDecimal getTransferred();
    long getEntryCount();
}
