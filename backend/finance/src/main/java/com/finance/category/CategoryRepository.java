package com.finance.category;

import com.finance.category.domain.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Data access for categories.
 *
 * <p>Every query filters by {@code userId} - see the isolation guarantee established
 * in {@code AccountRepository}.
 */
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    /** Includes soft-deleted rows - for resolving a historical reference, never for editing. */
    Optional<Category> findByIdAndUserId(Long id, Long userId);

    @Query("""
            select c from Category c
            where c.userId = :userId
              and c.deletedAt is null
              and (:includeArchived = true or c.archivedAt is null)
            order by c.displayOrder asc, c.name asc
            """)
    Page<Category> findAllForUser(@Param("userId") Long userId,
                                  @Param("includeArchived") boolean includeArchived,
                                  Pageable pageable);

    boolean existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(Long userId, String name);

    /** Live sub-categories of one category - used to refuse a delete that would orphan
     *  them, and to cascade an archive onto them (V12). */
    @Query("""
            select c from Category c
            where c.userId = :userId
              and c.parentId = :parentId
              and c.deletedAt is null
            order by c.displayOrder asc, c.name asc
            """)
    java.util.List<Category> findChildren(@Param("userId") Long userId,
                                          @Param("parentId") Long parentId);

    @Query("""
            select count(c) > 0 from Category c
            where c.userId = :userId
              and c.parentId = :parentId
              and c.deletedAt is null
            """)
    boolean hasChildren(@Param("userId") Long userId, @Param("parentId") Long parentId);

    @Query("""
            select count(c) > 0 from Category c
            where c.userId = :userId
              and lower(c.name) = lower(:name)
              and c.id <> :excludeId
              and c.deletedAt is null
            """)
    boolean existsByNameForOtherCategory(@Param("userId") Long userId,
                                         @Param("name") String name,
                                         @Param("excludeId") Long excludeId);
}
