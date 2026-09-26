package com.finance.insight;

import com.finance.common.user.CurrentUserProvider;
import com.finance.insight.domain.InsightState;
import com.finance.insight.domain.InsightStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Turns "what is true now" into "what just changed" (ADR-0017).
 *
 * <p>The rules are stateless and say what is true at this instant. On its own that is not
 * something a product can speak with: re-stating a live warning after every write fires the
 * same sentence eight times a day, and a person learns to ignore the channel within two
 * days. So the set of live warnings is remembered, and only the <em>difference</em> is
 * announced - once when a thing becomes true, and once when it stops.
 *
 * <p>A recovery is announced too, and is new: nothing in the product could previously say
 * "Bangalore trip is no longer behind".
 *
 * <p>An escalation counts as a crossing. A warning that was worth a quiet line yesterday and
 * is now {@code CRITICAL} is a different fact, and staying silent because "we already
 * mentioned it" would be the wrong kind of restraint. Severity is never lowered on a live
 * row: quietly downgrading a warning removes it from view with nothing said.
 */
@Component
public class InsightStateTracker {

    private static final Logger log = LoggerFactory.getLogger(InsightStateTracker.class);

    private final InsightStateRepository repository;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public InsightStateTracker(InsightStateRepository repository, CurrentUserProvider currentUser, Clock clock) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    /**
     * What changed since the last evaluation.
     *
     * @param started warnings that have just become true, ranked as the engine ranked them
     * @param cleared warnings that have just stopped being true, most recent first
     */
    public record Crossings(List<Insight> started, List<InsightState> cleared) {

        public boolean isEmpty() {
            return started.isEmpty() && cleared.isEmpty();
        }

        public static Crossings none() {
            return new Crossings(List.of(), List.of());
        }
    }

    /**
     * Records the current truth and returns the difference from the last recorded truth.
     *
     * <p>Its own transaction is fine to join: this runs after the write it reports on has
     * already committed, so there is nothing here that can roll a user's entry back.
     */
    @Transactional
    public Crossings record(List<Insight> current) {
        Long userId = currentUser.currentUserId();
        Instant now = Instant.now(clock);

        Map<String, InsightState> live = new LinkedHashMap<>();
        for (InsightState state : repository.findByUserIdAndClearedAtIsNull(userId)) {
            live.put(state.getInsightKey(), state);
        }

        List<Insight> started = new ArrayList<>();
        for (Insight insight : current) {
            InsightState existing = live.remove(insight.key());
            if (existing == null) {
                repository.save(open(userId, insight, now));
                started.add(insight);
                continue;
            }
            existing.setLastSeenAt(now);
            existing.setTitle(insight.title());
            // Lower ordinal = more severe (CRITICAL first), so a smaller value is a rise.
            if (insight.severity().ordinal() < existing.getSeverity().ordinal()) {
                existing.setSeverity(insight.severity());
                started.add(insight);
                // The one case where "silent until something changes" needs code: this
                // warning has got worse, so the answer the user gave was to a milder thing
                // (ROADMAP 3.2). A dismissal must not outlive what it dismissed.
                existing.setDismissedAt(null);
                existing.setSnoozedUntil(null);
            }
            repository.save(existing);
        }

        // Whatever is still in `live` was true last time and is not true now.
        List<InsightState> cleared = new ArrayList<>();
        for (InsightState stale : live.values()) {
            stale.setClearedAt(now);
            cleared.add(repository.save(stale));
        }

        if (!started.isEmpty() || !cleared.isEmpty()) {
            // Keys and counts only - never the wording, which carries amounts (ADR-0010).
            log.info("Insight crossings started={} cleared={}",
                    started.stream().map(Insight::key).toList(),
                    cleared.stream().map(InsightState::getInsightKey).toList());
        }
        return new Crossings(started, cleared);
    }

    private InsightState open(Long userId, Insight insight, Instant now) {
        return InsightState.builder()
                .userId(userId)
                .insightKey(insight.key())
                .insightType(insight.type())
                .severity(insight.severity())
                .title(insight.title())
                .firstSeenAt(now)
                .lastSeenAt(now)
                .createdAt(now)
                .build();
    }
}
