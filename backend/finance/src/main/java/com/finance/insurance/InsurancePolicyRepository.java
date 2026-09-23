package com.finance.insurance;

import com.finance.insurance.domain.InsurancePolicy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InsurancePolicyRepository extends JpaRepository<InsurancePolicy, Long> {

    Optional<InsurancePolicy> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    List<InsurancePolicy> findByUserIdAndDeletedAtIsNull(Long userId);

    @Query("""
            select p from InsurancePolicy p
            where p.userId = :userId
              and p.deletedAt is null
              and (:includeArchived = true or p.archivedAt is null)
            order by p.renewsOn asc nulls last, p.name asc
            """)
    Page<InsurancePolicy> findAllForUser(@Param("userId") Long userId,
                                         @Param("includeArchived") boolean includeArchived,
                                         Pageable pageable);

    /** Cover that lapses on or before a date - what the timeline and the attention zone read. */
    @Query("""
            select p from InsurancePolicy p
            where p.userId = :userId
              and p.deletedAt is null
              and p.archivedAt is null
              and p.renewsOn is not null
              and p.renewsOn <= :through
            order by p.renewsOn asc
            """)
    List<InsurancePolicy> findRenewingThrough(@Param("userId") Long userId, @Param("through") LocalDate through);

    List<InsurancePolicy> findByLoanIdAndUserIdAndDeletedAtIsNull(Long loanId, Long userId);
}
