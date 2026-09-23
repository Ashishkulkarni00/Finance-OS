package com.finance.plan.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One field that moved, inside a {@link PlanRevision} - "Amount, ₹4,050 → ₹4,200".
 *
 * <p>The {@link #label} is written by the domain service that made the change, not looked
 * up here: the commitment package is the only thing that knows {@code activeTo} reads
 * "Last payment" to a person. See ADR-0015.
 */
@Entity
@Table(name = "plan_revision_changes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanFieldChange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "revision_id", nullable = false, updatable = false)
    private PlanRevision revision;

    /** Stable key - {@code fixedAmount}, {@code targetDate}. What code matches on. */
    @Column(name = "field", nullable = false, updatable = false, length = 50)
    private String field;

    /** What a person calls it - "Amount", "Target date". What the UI shows. */
    @Column(name = "label", nullable = false, updatable = false, length = 60)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(name = "value_kind", nullable = false, updatable = false, length = 20)
    private PlanValueKind valueKind;

    /** Null means the field had no value before - not that it was zero or blank. */
    @Column(name = "old_value", length = 255)
    private String oldValue;

    /** Null means the field was cleared. */
    @Column(name = "new_value", length = 255)
    private String newValue;
}
