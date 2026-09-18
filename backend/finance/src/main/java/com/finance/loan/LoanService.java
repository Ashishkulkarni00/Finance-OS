package com.finance.loan;

import com.finance.loan.dto.CreateLoanRequest;
import com.finance.loan.dto.UpdateLoanRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LoanService {

    LoanView create(CreateLoanRequest request);

    LoanView getById(Long id);

    Page<LoanView> list(Pageable pageable);

    LoanView update(Long id, UpdateLoanRequest request);

    void delete(Long id);

    /** The generated schedule, each period flagged with whether a payment is linked to it. */
    List<AmortisationEntry> schedule(Long id);

    /** Count and total monthly EMI across every loan - the Debts zone header. */
    LoanSummary summary();
}
