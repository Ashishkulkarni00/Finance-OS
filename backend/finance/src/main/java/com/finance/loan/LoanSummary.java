package com.finance.loan;

import java.math.BigDecimal;

/**
 * The Debts page's standing block - the same three figures the source workbook's Loans
 * sheet closes with, and for the same reason.
 *
 * <p><strong>Why the EMI total is split in two.</strong> The workbook labels them
 * "Monthly EMI leaving a BANK account" and "Monthly EMI billed to the CARD (reaches you
 * inside the card bill, not separately)". One number covering both is worse than useless:
 * a card-billed EMI already arrives as part of the card bill, so counting it again as
 * cash leaving is the exact double-count rule 4 exists to prevent. They are different
 * money at different times and they never get added together here.
 *
 * @param remainingPaymentsTotal everything still to be paid across every loan - the sum
 *                               of each loan's {@code emisLeft × emi}, not of principals
 * @param tbdCount               loans whose terms have never been supplied, so the total
 *                               above is a floor rather than a figure
 */
public record LoanSummary(
        int count,
        BigDecimal bankEmiTotal,
        BigDecimal cardEmiTotal,
        BigDecimal remainingPaymentsTotal,
        int unconfirmedCount,
        int tbdCount
) {
}
