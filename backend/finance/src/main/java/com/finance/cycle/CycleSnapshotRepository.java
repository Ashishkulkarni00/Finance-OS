package com.finance.cycle;

import com.finance.cycle.domain.CycleSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CycleSnapshotRepository extends JpaRepository<CycleSnapshot, Long> {

    Optional<CycleSnapshot> findByCycleIdAndUserId(Long cycleId, Long userId);

    /** Every closed month for this user, in the order they were closed - momentum's history (ROADMAP 6.3). */
    java.util.List<CycleSnapshot> findByUserIdOrderByCreatedAtAsc(Long userId);
}
