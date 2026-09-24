package com.finance.state;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Debt as one position rather than a list of loans ({@code FINANCIAL_STATE.md} §2,
 * ROADMAP 2.1).
 *
 * <p><strong>Bank and card EMIs are kept apart, and that is not a formatting choice.</strong>
 * {@code LoanSummary} explains why: an EMI billed to a credit card reaches the user inside
 * the card bill, not as cash leaving separately, so adding the two together and calling the
 * result "what leaves each month" double-counts it — the exact failure rule 4 exists to
 * prevent. {@link #emiMonthlyTotal} is therefore explicitly a measure of <em>obligation</em>,
 * for the share-of-income question, and must never be used as a cash-flow figure. The cycle's
 * own {@code committed} total is the cash-flow answer.
 *
 * @param totalOutstanding    principal still owed across every loan, from recorded payments
 *                            (ADR-0018)
 * @param bankEmiMonthly      EMIs that leave a bank account
 * @param cardEmiMonthly      EMIs billed to a credit card
 * @param emiMonthlyTotal     the two added — an obligation measure only, see above
 * @param emiShareOfIncome    {@code emiMonthlyTotal ÷ expected monthly income}, as a fraction;
 *                            null when income for the cycle isn't known
 * @param weightedAverageRate the rate that actually matters — each loan's rate weighted by
 *                            what is still owed on it, not a plain average across loans.
 *                            Null when any loan with a balance has no rate recorded
 * @param debtFreeDate        the last loan's payoff date. Null when any loan's payoff is
 *                            unknown — a "debt-free date" that quietly omitted a loan would
 *                            be the most encouraging possible lie
 * @param loansWithoutTerms   how many loans have no rate or tenure recorded, so the figures
 *                            above rest on fewer loans than the user has
 * @param basis               every loan counted, and what the totals cannot account for
 */
public record DebtPosition(
        BigDecimal totalOutstanding,
        BigDecimal bankEmiMonthly,
        BigDecimal cardEmiMonthly,
        BigDecimal emiMonthlyTotal,
        BigDecimal emiShareOfIncome,
        BigDecimal weightedAverageRate,
        LocalDate debtFreeDate,
        int loanCount,
        int loansWithoutTerms,
        Provenance basis
) {

    public boolean isDebtFree() {
        return totalOutstanding != null && totalOutstanding.signum() <= 0;
    }
}
