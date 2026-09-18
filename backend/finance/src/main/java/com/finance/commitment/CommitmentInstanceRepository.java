package com.finance.commitment;

import com.finance.commitment.domain.CommitmentInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommitmentInstanceRepository extends JpaRepository<CommitmentInstance, Long> {

    Optional<CommitmentInstance> findByIdAndUserId(Long id, Long userId);

    Optional<CommitmentInstance> findByCommitmentIdAndCycleId(Long commitmentId, Long cycleId);

    /** Recent occurrences of the same commitment, most recent first - the detail route's history. */
    List<CommitmentInstance> findTop6ByCommitmentIdAndUserIdOrderByDueDateDesc(Long commitmentId, Long userId);

    List<CommitmentInstance> findByCycleIdAndUserId(Long cycleId, Long userId);

    /**
     * Every open (unsettled) instance in the given cycle, mandatory or not, with its rule
     * joined for ownership. Real Balance subtracts all of them: a bill you plan to pay is
     * spoken-for money whether or not it's a must-pay. Skipping an optional bill closes it.
     */
    @Query("""
            select ci from CommitmentInstance ci, Commitment c
            where ci.commitmentId = c.id
              and c.deletedAt is null
              and ci.userId = :userId
              and ci.cycleId = :cycleId
              and ci.status in ('PENDING', 'PART_PAID', 'OVERDUE', 'UNVERIFIED', 'NEEDS_REVIEW')
            """)
    List<CommitmentInstance> findOpenForCycle(@Param("userId") Long userId, @Param("cycleId") Long cycleId);

    /**
     * Candidates for auto-matching a new transaction, for one cycle + account.
     * Deliberately narrower than {@code CommitmentInstanceStatus.isOpen()}'s full set:
     * an UNVERIFIED or NEEDS_REVIEW instance already has a linked transaction, so it is
     * not a sensible target for matching a second one. See {@code CommitmentAutoMatcher}.
     */
    @Query("""
            select ci from CommitmentInstance ci, Commitment c
            where ci.commitmentId = c.id
              and c.deletedAt is null
              and ci.userId = :userId
              and ci.cycleId = :cycleId
              and c.accountId = :accountId
              and ci.status in ('PENDING', 'PART_PAID', 'OVERDUE')
            """)
    List<CommitmentInstance> findOpenForCycleAndAccount(@Param("userId") Long userId,
                                                         @Param("cycleId") Long cycleId,
                                                         @Param("accountId") Long accountId);

    /**
     * Every genuinely open instance (the full {@code CommitmentInstanceStatus.isOpen()}
     * set) hitting one account in one cycle - what a balance projection must sum over.
     * Distinct from {@link #findOpenForCycleAndAccount} above on purpose: a projection
     * needs every still-outstanding obligation, including one awaiting verification or
     * under review, not just the auto-match candidate pool.
     */
    @Query("""
            select ci from CommitmentInstance ci, Commitment c
            where ci.commitmentId = c.id
              and c.deletedAt is null
              and ci.userId = :userId
              and ci.cycleId = :cycleId
              and c.accountId = :accountId
              and ci.status in ('PENDING', 'PART_PAID', 'OVERDUE', 'UNVERIFIED', 'NEEDS_REVIEW')
            """)
    List<CommitmentInstance> findAllOpenForCycleAndAccount(@Param("userId") Long userId,
                                                            @Param("cycleId") Long cycleId,
                                                            @Param("accountId") Long accountId);

    /**
     * Every open instance due within a date window, across cycles - what the Timeline
     * reads. Spans cycles because a 30-day window can cross a cycle boundary.
     */
    @Query("""
            select ci from CommitmentInstance ci
            where ci.userId = :userId
              and ci.dueDate between :from and :to
              and ci.status in ('PENDING', 'PART_PAID', 'OVERDUE', 'UNVERIFIED', 'NEEDS_REVIEW')
            order by ci.dueDate asc
            """)
    List<CommitmentInstance> findOpenDueBetween(@Param("userId") Long userId,
                                                @Param("from") java.time.LocalDate from,
                                                @Param("to") java.time.LocalDate to);

    /**
     * One transaction type's total in a date range, leaving out entries that pay (or were
     * received against) a bill occurrence. For INCOME: a bonus, or a salary the matcher
     * couldn't link - linked salary is counted through its own occurrence, in the cycle it
     * belongs to, even when it landed before that cycle began. For EXPENSE: the spending
     * that wasn't planned.
     */
    @Query("""
            select coalesce(sum(t.amount), 0.00) from Transaction t
            where t.userId = :userId and t.deletedAt is null
              and t.type = :type
              and t.date between :from and :to
              and not exists (select 1 from CommitmentInstance ci
                              where ci.userId = :userId and ci.linkedTransactionId = t.id)
            """)
    java.math.BigDecimal sumUnlinked(@Param("userId") Long userId,
                                     @Param("type") com.finance.transaction.domain.TransactionType type,
                                     @Param("from") java.time.LocalDate from,
                                     @Param("to") java.time.LocalDate to);

    /**
     * Un-retires a soft-deleted occurrence of this rule in this cycle. Returns rows restored.
     *
     * <p>Native, deliberately: the entity's {@code @SQLRestriction} hides deleted rows from
     * every JPQL query, and {@code uk_commitment_instances_commitment_cycle} still counts
     * them - so once an occurrence has been retired, generating a fresh one for the same
     * rule and cycle would fail on the unique key. When a rule change makes that occurrence
     * valid again (e.g. its start date moved back into this cycle), bringing the original
     * row back is the only insert-free way to do it, and keeps its id stable.
     */
    @Modifying(flushAutomatically = true)
    @Query(value = """
            update commitment_instances
            set deleted_at = null
            where commitment_id = :commitmentId
              and cycle_id = :cycleId
              and deleted_at is not null
            """, nativeQuery = true)
    int restoreRetired(@Param("commitmentId") Long commitmentId, @Param("cycleId") Long cycleId);

    /** Whether a transaction already pays some other occurrence - one payment, one bill (rule 4). */
    boolean existsByLinkedTransactionIdAndIdNot(Long linkedTransactionId, Long id);
}
