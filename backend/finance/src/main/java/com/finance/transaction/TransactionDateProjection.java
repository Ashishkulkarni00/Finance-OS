package com.finance.transaction;

import java.time.LocalDate;

/** Just the id and the date - for callers that need "when did this money move" and
 *  nothing else. See {@link TransactionService#datesByIds}. */
public interface TransactionDateProjection {

    Long getId();

    LocalDate getDate();
}
