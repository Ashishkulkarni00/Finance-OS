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

    /**
     * Cycles that have already started, newest first - the months there is anything to say
     * about.
     *
     * <p>Summary needs the run of months behind today without creating any, which is what
     * separates it from {@code CurrentCycleResolver}: that one finds-or-creates, because a
     * month the user is working in has to exist. A report must not leave rows behind, and
     * cycles well into the future exist here only because a bill was once planned into one.
     */
    Page<Cycle> findByUserIdAndStartDateLessThanEqualOrderByStartDateDesc(
            Long userId, LocalDate startDate, Pageable pageable);
}
