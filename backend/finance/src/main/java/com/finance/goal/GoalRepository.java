package com.finance.goal;

import com.finance.goal.domain.Goal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {

    Optional<Goal> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    @Query("""
            select g from Goal g
            where g.userId = :userId and g.deletedAt is null
              and (:includeArchived = true or g.archivedAt is null)
            order by g.priority asc, g.targetDate asc
            """)
    Page<Goal> findAllForUser(@Param("userId") Long userId,
                              @Param("includeArchived") boolean includeArchived,
                              Pageable pageable);
}
