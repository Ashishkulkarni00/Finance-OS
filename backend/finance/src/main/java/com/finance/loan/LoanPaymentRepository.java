package com.finance.loan;

import com.finance.loan.domain.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {

    List<LoanPayment> findByLoanIdAndUserId(Long loanId, Long userId);

    Optional<LoanPayment> findByLoanIdAndPeriodNumberAndUserId(Long loanId, int periodNumber, Long userId);

    Optional<LoanPayment> findByTransactionIdAndUserId(Long transactionId, Long userId);

    /**
     * What was actually paid against each period, oldest first - the figures a loan's
     * balance is now derived from (Phase 1.2).
     *
     * <p>Native, because {@code LoanPayment.transactionId} is a plain column rather than a
     * mapped association: there is no entity graph to join along, and the alternative is
     * either a second service dependency from {@code LoanService} into transactions (a
     * bean cycle waiting to happen) or a lookup per payment.
     *
     * <p>A soft-deleted transaction is excluded: its money no longer exists, so it cannot
     * go on reducing a balance. The period then reads as unrecorded again, which is true.
     */
    @Query(value = """
            SELECT lp.period_number AS periodNumber, t.amount AS amount
            FROM loan_payments lp
            JOIN transactions t ON t.id = lp.transaction_id
            WHERE lp.loan_id = :loanId
              AND lp.user_id = :userId
              AND t.deleted_at IS NULL
            ORDER BY lp.period_number ASC
            """, nativeQuery = true)
    List<LoanPaymentAmount> findPaidAmounts(@Param("loanId") Long loanId, @Param("userId") Long userId);

    /** Every loan's recorded payments in one query - for list and summary views. */
    @Query(value = """
            SELECT lp.loan_id AS loanId, lp.period_number AS periodNumber, t.amount AS amount
            FROM loan_payments lp
            JOIN transactions t ON t.id = lp.transaction_id
            WHERE lp.user_id = :userId
              AND t.deleted_at IS NULL
            ORDER BY lp.loan_id ASC, lp.period_number ASC
            """, nativeQuery = true)
    List<LoanPaymentAmountByLoan> findPaidAmountsForUser(@Param("userId") Long userId);
}
