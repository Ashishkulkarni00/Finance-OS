package com.finance.insight.domain;

import com.finance.insight.Insight;
import com.finance.insight.InsightType;
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

import java.time.Instant;

/**
 * One occurrence of one warning: when it became true, and when it stopped (ADR-0017).
 *
 * <p>This is the product's memory of <strong>what it has already said</strong>. It holds no
 * derived financial value - Room, runway, goal feasibility and obligation cover are all
 * still computed fresh on every read (ADR-0011) - so there is nothing here that can drift
 * from the figures. What it prevents is repetition: without it, a warning fires again on
 * every write while its condition persists, and a person stops reading it within two days.
 *
 * <p>Deliberately <strong>not</strong> an {@code AuditableEntity}. There is nothing to soft
 * delete: a warning that ends is <em>cleared</em>, which is a real event worth keeping, not
 * a row to hide. A recurrence opens a new row rather than reopening an old one - a warning
 * that came back is a different event from one that never left.
 */
@Entity
@Table(name = "insight_state")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsightState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    /** {@link Insight#key()} - "goal:6:pace". Stable across evaluations by design. */
    @Column(name = "insight_key", nullable = false, length = 100, updatable = false)
    private String insightKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "insight_type", nullable = false, length = 40, updatable = false)
    private InsightType insightType;

    /** As it was when this occurrence began, raised if it escalates - never lowered while
     *  live, because quietly downgrading a live warning removes it with nothing said. */
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private Insight.Severity severity;

    /** What was actually said, frozen. A live insight can be re-derived; a cleared one
     *  cannot, and "you were warned about this on the 3rd" is unreadable without words. */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "first_seen_at", nullable = false, updatable = false)
    private Instant firstSeenAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    /** Null means live right now. */
    @Column(name = "cleared_at")
    private Instant clearedAt;

    /**
     * "I know" — the user has seen this and is leaving it as it stands (ROADMAP 3.2).
     *
     * <p>Deliberately on the occurrence, not the key. A warning that clears and later becomes
     * true again opens a <em>new</em> row, and the new row carries no dismissal — so "silent
     * until something changes" needs no expiry rule and nothing to clean up. The only case
     * needing code is escalation, where the same row gets louder.
     */
    @Column(name = "dismissed_at")
    private Instant dismissedAt;

    /** "Not this week." Compared against now, so a lapsed snooze simply stops matching. */
    @Column(name = "snoozed_until")
    private Instant snoozedUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public boolean isLive() {
        return clearedAt == null;
    }

    /** Answered, and so not to be spoken: dismissed outright, or snoozed past now. */
    public boolean isSilenced(Instant now) {
        return dismissedAt != null || (snoozedUntil != null && snoozedUntil.isAfter(now));
    }
}
