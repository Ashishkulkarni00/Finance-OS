package com.finance.commitment;

import com.finance.commitment.domain.CommitmentInstancePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

/**
 * Every entry that has paid a bill - V23, USAGE_ISSUES U2.
 *
 * <p>Every query filters by {@code userId} - see the isolation guarantee established in
 * {@code AccountRepository}.
 */
public interface CommitmentInstancePaymentRepository extends JpaRepository<CommitmentInstancePayment, Long> {

    /** This bill's payments, oldest first - "which entries made up this ₹10,500?". */
    List<CommitmentInstancePayment> findByUserIdAndCommitmentInstanceIdOrderByRecordedAtAsc(
            Long userId, Long commitmentInstanceId);

    /**
     * Is this entry already counted against this bill?
     *
     * <p>Checked before every settle. The unique key enforces it regardless, but a
     * constraint violation surfaces as a 500 - this turns it into the sentence the user
     * needs.
     */
    boolean existsByCommitmentInstanceIdAndTransactionId(Long commitmentInstanceId, Long transactionId);

    /** Is this entry already counted against some *other* bill? One payment, one bill. */
    boolean existsByTransactionIdAndCommitmentInstanceIdNot(Long transactionId, Long commitmentInstanceId);

    /**
     * Where these bills have actually been paid from, oldest payment first - what Real
     * Balance needs in order to stop trusting the plan (ADR-0020).
     *
     * <p>A join, not an association: payments hold {@code transactionId} as a plain column,
     * which is this codebase's style throughout. A soft-deleted entry is excluded - its
     * money went back, so it is no evidence of anything.
     *
     * <p>Ordered so the caller can keep the last row per instance. {@code recordedAt} is
     * captured at settle time and several payments can share a second, so {@code id} breaks
     * the tie - without it "most recent" would be whatever the database felt like.
     */
    @Query("""
            select p.commitmentInstanceId as commitmentInstanceId, t.accountId as accountId
            from CommitmentInstancePayment p, Transaction t
            where p.transactionId = t.id
              and p.userId = :userId
              and t.userId = :userId
              and t.deletedAt is null
              and p.commitmentInstanceId in :instanceIds
            order by p.recordedAt asc, p.id asc
            """)
    List<CommitmentInstancePaymentSourceProjection> findActualSourceAccounts(
            @Param("instanceIds") Collection<Long> instanceIds, @Param("userId") Long userId);
}
