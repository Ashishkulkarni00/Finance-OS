package com.finance.cycle;

import com.finance.cycle.domain.Cycle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface CycleRepository extends JpaRepository<Cycle, Long> {

    Optional<Cycle> findByIdAndUserId(Long id, Long userId);

    Optional<Cycle> findByUserIdAndStartDate(Long userId, LocalDate startDate);

    Page<Cycle> findByUserIdOrderByStartDateDesc(Long userId, Pageable pageable);
}
