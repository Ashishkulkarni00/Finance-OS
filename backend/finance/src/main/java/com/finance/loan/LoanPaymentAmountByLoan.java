package com.finance.loan;

import java.math.BigDecimal;

/** {@link LoanPaymentAmount} across every loan, so a list view needs one query, not one per loan. */
public interface LoanPaymentAmountByLoan {

    Long getLoanId();

    int getPeriodNumber();

    BigDecimal getAmount();
}
