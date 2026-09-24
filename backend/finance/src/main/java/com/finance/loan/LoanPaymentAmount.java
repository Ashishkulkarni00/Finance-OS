package com.finance.loan;

import java.math.BigDecimal;

/** One recorded EMI: which period it paid, and what actually left the account. */
public interface LoanPaymentAmount {

    int getPeriodNumber();

    /** The transaction's amount - not the loan's EMI. Paying more than the EMI is allowed,
     *  and the surplus comes off the principal (Phase 1.2). */
    BigDecimal getAmount();
}
