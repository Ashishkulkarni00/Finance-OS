package com.finance.account;

import com.finance.account.domain.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Data access for accounts.
 *
 * <p><strong>Every query filters by {@code userId}</strong>, including now, with one
 * user. That is the isolation guarantee for multi-user, established before it is
 * needed rather than retrofitted afterwards.
 */
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    /** Includes soft-deleted rows - for resolving a historical reference, never for editing. */
    Optional<Account> findByIdAndUserId(Long id, Long userId);

    @Query("""
            select a from Account a
            where a.userId = :userId
              and a.deletedAt is null
              and (:includeArchived = true or a.archivedAt is null)
            order by a.displayOrder asc, a.name asc
            """)
    Page<Account> findAllForUser(@Param("userId") Long userId,
                                 @Param("includeArchived") boolean includeArchived,
                                 Pageable pageable);

    @Query("""
            select a from Account a
            where a.userId = :userId
              and a.deletedAt is null
              and a.archivedAt is null
            order by a.displayOrder asc, a.name asc
            """)
    List<Account> findActiveForUser(@Param("userId") Long userId);

    boolean existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(Long userId, String name);

    @Query("""
            select count(a) > 0 from Account a
            where a.userId = :userId
              and lower(a.name) = lower(:name)
              and a.id <> :excludeId
              and a.deletedAt is null
            """)
    boolean existsByNameForOtherAccount(@Param("userId") Long userId,
                                        @Param("name") String name,
                                        @Param("excludeId") Long excludeId);
}
