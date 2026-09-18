package com.finance.goal.domain;

import com.finance.common.audit.AuditableEntity;
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
import java.time.LocalDate;

/**
 * A target, honestly tracked - progress, required-per-month, feasibility. Present in
 * MVP but barely surfaced (per DOMAIN_MODEL.md §2): it exists so the product remains
 * reachable later without a rewrite, not as a gamified feature.
 *
 * <p>Progress ({@code GoalView}) is never stored - it is read from whichever of
 * {@code linkedReservationId} or {@code linkedAccountId} is set, at query time.
 * Exactly one of the two is normally set (an emergency fund goal links a reservation;
 * an investment goal links an account); both may be null for a goal that's aspirational
 * only, with nothing concrete behind it yet.
 */
@Entity
@Table(name = "goals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Goal extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "target_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    /** Lower is higher priority - a plain user-defined ordering, not a computed rank. */
    @Column(name = "priority", nullable = false)
    @Builder.Default
    private int priority = 0;

    @Column(name = "linked_reservation_id")
    private Long linkedReservationId;

    @Column(name = "linked_account_id")
    private Long linkedAccountId;

    @Column(name = "archived_at")
    private Instant archivedAt;

    public boolean isArchived() {
        return archivedAt != null;
    }

    public void archive() {
        this.archivedAt = Instant.now();
    }

    public void unarchive() {
        this.archivedAt = null;
    }
}
