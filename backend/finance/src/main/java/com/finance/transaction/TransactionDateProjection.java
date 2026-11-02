package com.finance.transaction;

import java.time.LocalDate;

/** The id, the day the money moved, and the account it left - what a settled bill needs to
 *  report its payment honestly. The account is here because a bill may be paid from any
 *  account, not only its planned one (USAGE_ISSUES U3), so the row cannot assume the
 *  commitment's. See {@link TransactionService#settlementFactsByIds}. */
public interface TransactionDateProjection {

    Long getId();

    LocalDate getDate();

    /** The account the money actually left - not necessarily the bill's "Paid from". */
    Long getAccountId();
}
