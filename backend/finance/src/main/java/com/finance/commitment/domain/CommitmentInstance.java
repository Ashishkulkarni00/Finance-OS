package com.finance.commitment.domain;

import com.finance.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * The <strong>occurrence</strong> - this cycle's ZestMoney EMI, specifically. A
 * confirmation is only ever valid for its own cycle because it lives here, not on the
 * rule. See {@link Commitment} and DOMAIN_MODEL.md rule 11.
 */
@Entity
@Table(name = "commitment_instances")
// Soft delete (ADR-0004) enforced at the entity rather than query by query. The table
// always had deleted_at via AuditableEntity, but none of this repository's eight queries
// filtered on it - so a withdrawn occurrence would still have been summed into Real
// Balance's "committed", still blocked Room as INCOMPLETE, and still appeared in Needs
// You. One restriction covers every query, including the joined @Query ones and any
// written later.
@SQLRestriction("deleted_at is null")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommitmentInstance extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "commitment_id", nullable = false, updatable = false)
    private Long commitmentId;

    @Column(name = "cycle_id", nullable = false, updatable = false)
    private Long cycleId;

    // Updatable: editing a rule's due day moves the occurrences nothing has acted on yet
    // (CommitmentInstanceServiceImpl.listForCycle). A settled occurrence's date never moves.
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    /** Null only for a VARIABLE commitment not yet confirmed - blocks Real Balance if mandatory. */
    @Column(name = "expected_amount", precision = 15, scale = 2)
    private BigDecimal expectedAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CommitmentInstanceStatus status = CommitmentInstanceStatus.PENDING;

    @Column(name = "confirmed_amount", precision = 15, scale = 2)
    private BigDecimal confirmedAmount;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    /** The transaction that settled this, once matched or manually linked. */
    @Column(name = "linked_transaction_id")
    private Long linkedTransactionId;

    /** What is still owed on this instance. Zero once paid, prepaid or skipped. */
    public BigDecimal outstanding() {
        if (status.isClosed()) {
            return BigDecimal.ZERO;
        }
        if (expectedAmount == null) {
            return null;
        }
        BigDecimal paidSoFar = confirmedAmount == null ? BigDecimal.ZERO : confirmedAmount;
        BigDecimal remaining = expectedAmount.subtract(paidSoFar);
        return remaining.signum() < 0 ? BigDecimal.ZERO : remaining;
    }

    /**
     * How far the confirmed amount landed from what was expected - positive means it
     * cost more than planned, negative means less. Null whenever either figure is
     * unknown, or the instance isn't actually settled yet (variance on an unpaid item
     * is not a fact, it's a guess). "₹350 more than planned" on a paid row is the
     * cheapest real insight available and currently invisible - MONTH_EXPERIENCE.md §11.
     */
    public BigDecimal variance() {
        if (status != CommitmentInstanceStatus.PAID && status != CommitmentInstanceStatus.SETTLED_EARLIER) {
            return null;
        }
        if (expectedAmount == null || confirmedAmount == null) {
            return null;
        }
        return confirmedAmount.subtract(expectedAmount);
    }
}
