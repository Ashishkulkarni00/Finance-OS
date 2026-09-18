package com.finance.loan;

import com.finance.loan.domain.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    Optional<Loan> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    Page<Loan> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);

    List<Loan> findByUserIdAndDeletedAtIsNull(Long userId);
}
