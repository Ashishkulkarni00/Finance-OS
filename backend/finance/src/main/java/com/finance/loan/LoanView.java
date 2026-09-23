package com.finance.loan;

import com.finance.account.domain.Account;
import com.finance.loan.domain.Loan;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A loan plus everything a row needs, derived forward from where the loan stands (V13).
 *
 * @param account              the LOAN account - the liability itself
 * @param payFromAccount       the account the EMI leaves from. Null when never recorded
 * @param outstandingPrincipal owed today. Exactly the stated outstanding balance until the
 *                             first EMI after the balance date falls due; after that it
 *                             needs the rate to split EMIs into principal and interest, so
 *                             it's null without one (or at TBD confidence)
 * @param payoffDate           the last remaining EMI's due date - known without a rate
 * @param paidPeriods          EMIs recorded as paid since the balance date - settled on
 *                             Months, not merely elapsed (ROADMAP 0.2)
 * @param unrecordedEmis       EMIs whose due date has passed with nothing recorded against
 *                             them. Never assumed either way: the balance doesn't move for
 *                             them, and the user is told (ADR-0006)
 * @param oldestUnrecordedDue  the due date of the earliest of those, for naming it
 * @param emisLeft             EMIs still to come today
 * @param remainingPayments    {@code emisLeft × emi}
 * @param firstEmiDate         the first EMI after the balance date
 * @param impliedEmisRemaining how many EMIs it actually takes to clear the outstanding
 *                             balance at this rate; -1 if never; null without a rate
 * @param termsConsistent      whether that agrees with the EMIs left entered (within one);
 *                             null without a rate
 * @param planCommitmentId     the plan bill that pays this EMI, or null if it isn't in the plan
 */
public record LoanView(Loan loan, Account account, Account payFromAccount,
                       BigDecimal outstandingPrincipal, LocalDate payoffDate,
                       int paidPeriods, int unrecordedEmis, LocalDate oldestUnrecordedDue,
                       int emisLeft, BigDecimal remainingPayments,
                       LocalDate firstEmiDate, Integer impliedEmisRemaining, Boolean termsConsistent,
                       Long planCommitmentId) {
}
