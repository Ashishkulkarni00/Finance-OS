package com.finance.plan.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * One recorded change to the plan - a commitment or a goal was added, amended, paused or
 * ended, and this is what it was and what it cost. See ADR-0015.
 *
 * <p><strong>Append-only.</strong> This does not extend {@code AuditableEntity} and is
 * never soft-deleted: deleting a commitment writes an {@code ENDED} revision, it does not
 * erase the revisions before it. A plan line's history outliving the line is the entire
 * point - "I have moved this deadline three times" has to survive the fourth move.
 */
@Entity
@Table(name = "plan_revisions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, updatable = false, length = 20)
    private PlanSubjectType subjectType;

    /** The commitment or goal this is about. After a {@code SUPERSEDED} revision this is
     *  the <em>new</em> rule; {@link #supersededSubjectId} is the one it replaced. */
    @Column(name = "subject_id", nullable = false, updatable = false)
    private Long subjectId;

    /** Kept so the log still reads correctly once the subject is deleted and its name gone. */
    @Column(name = "subject_name", nullable = false, length = 100)
    private String subjectName;

    @Enumerated(EnumType.STRING)
    @Column(name = "revision_type", nullable = false, updatable = false, length = 20)
    private PlanRevisionType revisionType;

    /** The rule this one replaced - set only on {@code SUPERSEDED}. Walking this backwards
     *  gives every version of a plan line, which is why no column is needed on
     *  {@code commitments} (ADR-0015). */
    @Column(name = "superseded_subject_id")
    private Long supersededSubjectId;

    /** When the user made the call. */
    @Column(name = "decided_at", nullable = false, updatable = false)
    private Instant decidedAt;

    /** The first day the change is in force. Usually today; the date given as "apply from"
     *  when the rule was split. */
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    /** The cycle the decision was made in - what "what changed this month?" reads. */
    @Column(name = "cycle_id")
    private Long cycleId;

    /** The user's own words. Never demanded; null means they were not asked or did not say,
     *  which is recorded honestly rather than filled in. */
    @Column(name = "reason", length = 255)
    private String reason;

    /**
     * What this decision costs per month, in rupees - positive means more money is needed
     * each month, negative means less. An {@code INCOME} commitment is negated: expecting
     * more salary lowers the requirement.
     *
     * <p>Null means <em>unknown</em>, never zero: a {@code VARIABLE} commitment has no
     * monthly figure to compare against (ADR-0006).
     */
    @Column(name = "monthly_effect", precision = 15, scale = 2)
    private BigDecimal monthlyEffect;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "revision", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    @Builder.Default
    private List<PlanFieldChange> changes = new ArrayList<>();

    public void addChange(PlanFieldChange change) {
        change.setRevision(this);
        changes.add(change);
    }
}
