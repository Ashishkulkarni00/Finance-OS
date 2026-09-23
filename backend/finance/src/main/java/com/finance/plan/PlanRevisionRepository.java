package com.finance.plan;

import com.finance.plan.domain.PlanRevision;
import com.finance.plan.domain.PlanSubjectType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PlanRevisionRepository extends JpaRepository<PlanRevision, Long> {

    /** Every revision for one user, newest decision first. */
    @Query("""
            select r from PlanRevision r
            where r.userId = :userId
            order by r.decidedAt desc, r.id desc
            """)
    Page<PlanRevision> findAllForUser(@Param("userId") Long userId, Pageable pageable);

    /**
     * The history of one plan line. Matches the subject on either side, so a rule that was
     * superseded still turns up when its replacement is asked about - which is what makes
     * "every version of this bill" one query (ADR-0015).
     */
    @Query("""
            select r from PlanRevision r
            where r.userId = :userId
              and r.subjectType = :subjectType
              and (r.subjectId = :subjectId or r.supersededSubjectId = :subjectId)
            order by r.decidedAt desc, r.id desc
            """)
    Page<PlanRevision> findForSubject(@Param("userId") Long userId,
                                      @Param("subjectType") PlanSubjectType subjectType,
                                      @Param("subjectId") Long subjectId,
                                      Pageable pageable);

    /** What changed during one cycle - oldest first, so it reads as a story. */
    @Query("""
            select r from PlanRevision r
            where r.userId = :userId and r.cycleId = :cycleId
            order by r.decidedAt asc, r.id asc
            """)
    List<PlanRevision> findForCycle(@Param("userId") Long userId, @Param("cycleId") Long cycleId);

    long countByUserIdAndCycleId(Long userId, Long cycleId);

    /**
     * Revisions that take effect on or after a date - what a forward-looking view needs to
     * know is already decided but not yet in force.
     */
    @Query("""
            select r from PlanRevision r
            where r.userId = :userId and r.effectiveFrom >= :from
            order by r.effectiveFrom asc, r.id asc
            """)
    List<PlanRevision> findEffectiveFrom(@Param("userId") Long userId, @Param("from") LocalDate from);
}
