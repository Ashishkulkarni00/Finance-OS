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

import java.math.BigDecimal;
import java.time.Instant;

/**
 * The immutable record of a closed cycle - the one deliberate exception to "derived
 * values are never stored" (ADR-0011). A snapshot is a historical fact, not a live
 * cache: trends cannot be reconstructed reliably from a mutable ledger, so the numbers
 * true at close time are captured permanently. Correcting the past after this is
 * written creates an adjustment, never a rewrite of this row. See DOMAIN_MODEL.md §6.
 */
@Entity
@Table(name = "cycle_snapshots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CycleSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "cycle_id", nullable = false, updatable = false)
    private Long cycleId;

    @Column(name = "income_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal incomeTotal;

    @Column(name = "expense_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal expenseTotal;

    @Column(name = "invested_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal investedTotal;

    @Column(name = "transferred_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal transferredTotal;

    @Column(name = "net", nullable = false, precision = 15, scale = 2)
    private BigDecimal net;

    /** Null when income was zero - a savings rate over no income is not a fact. */
    @Column(name = "savings_rate", precision = 7, scale = 4)
    private BigDecimal savingsRate;

    @Column(name = "real_balance", precision = 15, scale = 2)
    private BigDecimal realBalance;

    @Column(name = "net_worth", nullable = false, precision = 15, scale = 2)
    private BigDecimal netWorth;

    @Column(name = "total_debt", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalDebt;

    // -----------------------------------------------------------------------------
    // Plan versus actual (ADR-0015). Everything above is an actual. Without these, a
    // closed cycle cannot be compared against the plan that was in force during it,
    // even in principle - so "did I keep to my plan?" had no data behind it at all.
    //
    // All five are nullable, and null means "this cycle closed before any of it was
    // recorded". Backfilling a zero would have every pre-existing month claim it planned
    // nothing and kept nothing - permanently, in an immutable row (ADR-0006).
    // -----------------------------------------------------------------------------

    /**
     * What the cycle's commitments were expected to cost, summed at close.
     *
     * <p>Null when any one of them had no known amount - a total with the unknowns
     * silently dropped would be permanently wrong, and this row is permanent (ADR-0006).
     */
    @Column(name = "planned_committed_total", precision = 15, scale = 2)
    private BigDecimal plannedCommittedTotal;

    /** What they actually cost - confirmed amounts only. */
    @Column(name = "actual_committed_total", precision = 15, scale = 2)
    private BigDecimal actualCommittedTotal;

    /** How many commitments fell due in the cycle. */
    @Column(name = "commitments_planned")
    private Integer commitmentsPlanned;

    /**
     * How many were kept - paid, or settled in an earlier cycle. The operational form of
     * the North Star: commitments kept is the number that has to go up.
     */
    @Column(name = "commitments_kept")
    private Integer commitmentsKept;

    /** How many times the plan itself changed during the cycle - why this month may not
     *  be comparable with the last. */
    @Column(name = "plan_revisions_count")
    private Integer planRevisionsCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
