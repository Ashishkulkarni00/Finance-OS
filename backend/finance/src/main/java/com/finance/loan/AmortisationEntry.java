package com.finance.loan;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One period of a generated amortisation schedule. Never persisted - see {@code Loan}. */
public record AmortisationEntry(int period, LocalDate dueDate, BigDecimal principalComponent,
                                BigDecimal interestComponent, BigDecimal closingBalance) {
}
