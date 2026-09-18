package com.finance.loan;

import com.finance.loan.domain.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {

    List<LoanPayment> findByLoanIdAndUserId(Long loanId, Long userId);

    Optional<LoanPayment> findByLoanIdAndPeriodNumberAndUserId(Long loanId, int periodNumber, Long userId);
}
