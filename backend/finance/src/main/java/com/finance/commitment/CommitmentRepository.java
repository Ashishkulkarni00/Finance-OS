package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CommitmentRepository extends JpaRepository<Commitment, Long> {

    Optional<Commitment> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    /** The live bills that follow one loan / investment / goal. */
    List<Commitment> findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(CommitmentSource sourceType,
                                                                         Long sourceId, Long userId);

    @Query("""
            select c from Commitment c
            where c.userId = :userId and c.deletedAt is null
              and (:includeArchived = true or c.archivedAt is null)
            order by c.name asc
            """)
    Page<Commitment> findAllForUser(@Param("userId") Long userId,
                                    @Param("includeArchived") boolean includeArchived,
                                    Pageable pageable);

    /** Every commitment active at any point during the cycle - what instance generation iterates. */
    @Query("""
            select c from Commitment c
            where c.userId = :userId and c.deletedAt is null and c.archivedAt is null
              and c.activeFrom <= :cycleEnd
              and (c.activeTo is null or c.activeTo >= :cycleStart)
            """)
    List<Commitment> findActiveForCycle(@Param("userId") Long userId,
                                        @Param("cycleStart") LocalDate cycleStart,
                                        @Param("cycleEnd") LocalDate cycleEnd);
}
