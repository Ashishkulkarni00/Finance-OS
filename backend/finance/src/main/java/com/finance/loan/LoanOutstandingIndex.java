package com.finance.loan;

import com.finance.loan.domain.Loan;
import com.finance.loan.domain.LoanStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * What every loan still owes today, keyed by the account that represents it.
 *
 * <p><strong>Why this exists.</strong> A LOAN account's balance is
 * {@code openingBalance + postings}, and paying an EMI posts against the bank or the card —
 * never against the loan. So the account balance only ever moves when somebody edits the
 * loan by hand, while the loan's own outstanding falls as payments are recorded (ADR-0018).
 * Net worth read the account balance and the Debts page read the loan, and the two drifted
 * apart: on 2026-11-08 this user's real data had net worth claiming ₹3,40,091.98 of debt
 * against the loans' own ₹3,34,441.70, **₹5,650.28 apart**, with both figures printed on the
 * same screen (FIX_BACKLOG 1.5).
 *
 * <p>A stored figure that should have been derived is exactly what ADR-0011 forbids, and
 * the loan's outstanding is the derived one. So net worth reads this instead.
 *
 * <p><strong>Two queries for every loan, not two per loan.</strong> The loans, then every
 * recorded payment across all of them in one batch, grouped here. This runs inside the
 * position read, which the Pulse, Today and `/financial-state` all sit on.
 *
 * <p><strong>No service dependency, on purpose.</strong> Repositories and a stateless
 * calculator only. {@code PositionService} is reachable from {@code CycleServiceImpl.close},
 * so anything it depends on must stay clear of the services that depend back on it
 * (CLAUDE.md, bean-cycle traps). This is also why the arithmetic is duplicated from
 * {@code LoanServiceImpl.toView} rather than called through {@code LoanService}.
 */
@Component
public class LoanOutstandingIndex {

    private final LoanRepository loans;
    private final LoanPaymentRepository payments;
    private final AmortisationCalculator calculator;

    public LoanOutstandingIndex(LoanRepository loans, LoanPaymentRepository payments,
                                AmortisationCalculator calculator) {
        this.loans = loans;
        this.payments = payments;
        this.calculator = calculator;
    }

    /**
     * Loan account id to what that loan still owes, expressed positive.
     *
     * <p>A closed loan is absent — it owes nothing and its account should carry nothing.
     * A loan with no account to attribute to is absent too.
     *
     * <p><strong>Where the figure cannot be derived, the stated balance stands.</strong>
     * Without a rate, or on a loan whose own figures are flagged as not supporting derived
     * ones, there is no honest way to split a payment into interest and principal — so this
     * returns what the user last stated, which is exactly what net worth used before. That
     * overstates the debt by whatever principal has since been repaid, and it is the same
     * overstatement as today rather than a new one. Saying "unknown" instead would mean net
     * worth itself going unknown over one unpriced loan, which is a worse answer than a
     * figure that is merely stale. Visible in `loansWithoutTerms` on `/financial-state`.
     */
    public Map<Long, BigDecimal> outstandingByAccount(Long userId) {
        List<Loan> all = loans.findByUserIdAndDeletedAtIsNull(userId);
        if (all.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<BigDecimal>> paidByLoan = new HashMap<>();
        // Already ordered by loan then period, so appending preserves payment order - which
        // matters: `balanceAfterPayments` walks them in sequence.
        for (LoanPaymentAmountByLoan payment : payments.findPaidAmountsForUser(userId)) {
            paidByLoan.computeIfAbsent(payment.getLoanId(), k -> new ArrayList<>()).add(payment.getAmount());
        }

        Map<Long, BigDecimal> byAccount = new LinkedHashMap<>();
        for (Loan loan : all) {
            if (loan.getAccountId() == null) {
                continue;
            }
            if (loan.getStatus() == LoanStatus.CLOSED) {
                byAccount.put(loan.getAccountId(), BigDecimal.ZERO);
                continue;
            }
            byAccount.put(loan.getAccountId(), outstanding(loan, paidByLoan.get(loan.getId())));
        }
        return byAccount;
    }

    private BigDecimal outstanding(Loan loan, List<BigDecimal> paid) {
        BigDecimal stated = loan.getOutstandingBalance();
        if (paid == null || paid.isEmpty()) {
            return stated;
        }
        if (!loan.getConfidence().supportsDerivedFigures() || loan.getAnnualRate() == null) {
            return stated;
        }
        return calculator.balanceAfterPayments(stated, loan.getAnnualRate(), paid);
    }
}
