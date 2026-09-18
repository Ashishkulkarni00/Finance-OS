package com.finance.commitment;

import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.commitment.dto.UpdateCommitmentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommitmentService {

    /** A bill for a loan's EMI, following the loan. Returns the existing one if there is one. */
    CommitmentView createFromLoan(Long loanId);

    /** Re-applies a loan's terms to the bills that follow it - after the loan changes. */
    void syncLoanBills(Long loanId);

    /** A bill for a SIP / RD instalment that follows the holding. Returns the existing one if there is one. */
    CommitmentView createFromInvestment(Long investmentId);

    /** Re-applies a source to the bills that follow it - after the loan, holding or goal changes. */
    void syncSourceBills(com.finance.commitment.domain.CommitmentSource sourceType, Long sourceId);

    CommitmentView create(CreateCommitmentRequest request);

    CommitmentView getById(Long id);

    Page<CommitmentView> list(boolean includeArchived, Pageable pageable);

    CommitmentView update(Long id, UpdateCommitmentRequest request);

    CommitmentView archive(Long id);

    CommitmentView unarchive(Long id);

    void delete(Long id);
}
