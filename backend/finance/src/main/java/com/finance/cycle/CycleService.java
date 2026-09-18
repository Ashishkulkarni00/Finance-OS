package com.finance.cycle;

import com.finance.cycle.domain.Cycle;
import com.finance.cycle.domain.CycleSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

/** Cycle use cases - resolving the salary-cycle boundary, and closing a cycle. */
public interface CycleService {

    /** Finds or creates the cycle containing today. */
    Cycle resolveCurrent();

    /** Finds or creates the cycle containing the given date. */
    Cycle resolveForDate(LocalDate date);

    Cycle getById(Long id);

    Page<Cycle> list(Pageable pageable);

    /**
     * Closes a cycle, writing its immutable {@link CycleSnapshot}. Refuses to close a
     * cycle that has not yet ended, and refuses to close an already-closed cycle -
     * closing is a one-time event, not an update.
     */
    CycleSnapshot close(Long id);

    CycleSnapshot getSnapshot(Long cycleId);

    /** The live in/out/saved figures for a cycle that hasn't closed yet - never persisted. */
    CycleSummary previewSummary(Long cycleId);

    /** Expense total per category for this cycle, largest first - "where the money went". */
    FlexibleSpending flexibleSpending(Long cycleId);
}
