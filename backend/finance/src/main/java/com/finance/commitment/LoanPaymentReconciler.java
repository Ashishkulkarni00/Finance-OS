package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.common.user.CurrentUserProvider;
import com.finance.loan.LoanPaymentRecorder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Re-derives a loan's payment records from the EMI bills already marked paid.
 *
 * <p>Until 2026-11-09 an EMI settled by <em>auto-matching</em> (a bank debit recorded as an
 * expense) marked the bill paid without telling the loan, so the loan reported paid EMIs as
 * unrecorded. The matcher is fixed; this repairs the months before the fix. It writes nothing
 * the user hasn't already stated - each record comes from a PAID instance and the
 * transaction linked to it - and {@link LoanPaymentRecorder} refuses duplicates by
 * transaction and by period, so running it twice changes nothing.
 */
@Service
public class LoanPaymentReconciler {

    private static final Logger log = LoggerFactory.getLogger(LoanPaymentReconciler.class);

    private final CommitmentRepository commitments;
    private final CommitmentInstanceRepository instances;
    private final LoanPaymentRecorder recorder;
    private final CurrentUserProvider currentUser;

    public LoanPaymentReconciler(CommitmentRepository commitments, CommitmentInstanceRepository instances,
                                 LoanPaymentRecorder recorder, CurrentUserProvider currentUser) {
        this.commitments = commitments;
        this.instances = instances;
        this.recorder = recorder;
        this.currentUser = currentUser;
    }

    /** @return how many payment records were written */
    @Transactional
    public int reconcile(Long loanId) {
        Long userId = currentUser.currentUserId();
        int written = 0;
        for (Commitment c : commitments.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                CommitmentSource.LOAN, loanId, userId)) {
            // Every occurrence already due. The first version read the latest six, and for a loan
            // running to 2029 those were all future months - the October EMI was never seen.
            for (CommitmentInstance i : instances.findByCommitmentIdAndUserIdAndDueDateLessThanEqualOrderByDueDateDesc(
                    c.getId(), userId, java.time.LocalDate.now())) {
                if (i.getStatus() == CommitmentInstanceStatus.PAID && i.getLinkedTransactionId() != null
                        && recorder.record(loanId, userId, i.getDueDate(), i.getLinkedTransactionId())) {
                    written++;
                }
            }
        }
        log.info("Loan payments reconciled loanId={} written={}", loanId, written);
        return written;
    }
}
