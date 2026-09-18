package com.finance.cycle;

import com.finance.cycle.domain.CycleSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CycleSnapshotRepository extends JpaRepository<CycleSnapshot, Long> {

    Optional<CycleSnapshot> findByCycleIdAndUserId(Long cycleId, Long userId);
}
