package com.finance.cycle.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/**
 * One salary cycle: the boundary itself, lazily materialised.
 *
 * <p>The boundary dates are a deterministic calendar fact ({@code CycleCalculator}),
 * not a value that could drift like a balance - so storing them once computed does not
 * conflict with ADR-0011. The row exists so {@code CommitmentInstance} and
 * {@code CycleSnapshot} have a stable id to reference, and so "the current cycle" is
 * find-or-create rather than regenerated on every request. Rows are created on first
 * reference to a cycle (see {@code CycleService.resolve}), never pre-generated in bulk.
 */
@Entity
@Table(name = "cycles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "start_date", nullable = false, updatable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false, updatable = false)
    private LocalDate endDate;

    /** Set once, at close. A closed cycle's transactions may still be edited - see ADR note on M13. */
    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public boolean isClosed() {
        return closedAt != null;
    }

    public String label() {
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("d MMM");
        return startDate.format(fmt) + " – " + endDate.format(fmt);
    }
}
