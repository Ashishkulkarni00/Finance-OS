package com.finance.insight;

import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import com.finance.insight.domain.InsightState;
import com.finance.insight.domain.InsightStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Which warnings the user has already answered, and the one door for answering them
 * (ROADMAP 3.2).
 *
 * <p>A warning is derived on every read and never stored, so "delete this" cannot mean
 * anything — the next read works it out again. Dismissal is therefore remembered
 * <em>beside</em> the warning: it stays true, and the product stops saying it.
 *
 * <p><strong>Two promises, kept apart on purpose:</strong> a dismissal is answered by the
 * situation changing, a snooze by the calendar. They are not two settings of one field.
 *
 * <p>"Until something changes" needs no expiry rule, because the mechanism is already there:
 * a warning that clears and returns opens a <em>new</em> {@code insight_state} row, and a new
 * row carries no dismissal. The single case that does need code is escalation — the same row
 * getting louder — which {@link InsightStateTracker} undismisses.
 *
 * <p>Rules stay pure. None of them knows dismissal exists; the filtering happens once, here,
 * so a new rule cannot forget to respect it.
 */
@Component
public class InsightSilencer {

    private static final Logger log = LoggerFactory.getLogger(InsightSilencer.class);

    private final InsightStateRepository repository;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public InsightSilencer(InsightStateRepository repository, CurrentUserProvider currentUser, Clock clock) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    /** What the user has answered, by insight key. */
    @Transactional(readOnly = true)
    public Set<String> silencedKeys() {
        Instant now = Instant.now(clock);
        return live().values().stream()
                .filter(s -> s.isSilenced(now))
                .map(InsightState::getInsightKey)
                .collect(Collectors.toSet());
    }

    /**
     * The answered warnings themselves, so a screen can fold them away rather than lose them.
     *
     * <p>Kept visible-but-folded deliberately: a list you can silently drop things from is a
     * list you stop trusting, and a user who dismissed something by accident would have no
     * way back to it.
     */
    @Transactional(readOnly = true)
    public List<InsightState> silenced() {
        Instant now = Instant.now(clock);
        return live().values().stream()
                .filter(s -> s.isSilenced(now))
                .sorted((a, b) -> b.getFirstSeenAt().compareTo(a.getFirstSeenAt()))
                .toList();
    }

    /** Silent until the situation itself changes. */
    @Transactional
    public void dismiss(Insight insight) {
        InsightState state = rowFor(insight);
        state.setDismissedAt(Instant.now(clock));
        state.setSnoozedUntil(null);
        repository.save(state);
        log.info("Insight dismissed key={}", insight.key());
    }

    /** Silent until a date, whatever happens in the meantime. */
    @Transactional
    public void snooze(Insight insight, int days) {
        if (days < 1 || days > 90) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "Choose between 1 and 90 days.", "days");
        }
        InsightState state = rowFor(insight);
        state.setSnoozedUntil(Instant.now(clock).plus(days, ChronoUnit.DAYS));
        state.setDismissedAt(null);
        repository.save(state);
        log.info("Insight snoozed key={} days={}", insight.key(), days);
    }

    /** Undo - the warning speaks again immediately. */
    @Transactional
    public void restore(String key) {
        InsightState state = live().get(key);
        if (state == null) {
            throw new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                    "There's nothing silenced under that name.", "key");
        }
        state.setDismissedAt(null);
        state.setSnoozedUntil(null);
        repository.save(state);
        log.info("Insight restored key={}", key);
    }

    /**
     * The row this warning is remembered by, created if it does not exist yet.
     *
     * <p>{@link InsightStateTracker} only records on a <strong>write</strong>, because that
     * is what makes a crossing a crossing - recording on read would mean the state was
     * already there by the time anything was written, and the toast would never announce
     * anything (ADR-0017).
     *
     * <p>The consequence is that a warning true since before the user's last write has no row
     * yet. Refusing to dismiss it would be an unexplainable failure: the user can see it on
     * screen, and the button would say it is not there. So dismissing records it, with the
     * same fields the tracker would have written.
     */
    private InsightState rowFor(Insight insight) {
        InsightState existing = live().get(insight.key());
        if (existing != null) {
            return existing;
        }
        Instant now = Instant.now(clock);
        return InsightState.builder()
                .userId(currentUser.currentUserId())
                .insightKey(insight.key())
                .insightType(insight.type())
                .severity(insight.severity())
                .title(insight.title())
                .firstSeenAt(now)
                .lastSeenAt(now)
                .createdAt(now)
                .build();
    }

    private Map<String, InsightState> live() {
        Map<String, InsightState> byKey = new LinkedHashMap<>();
        for (InsightState state : repository.findByUserIdAndClearedAtIsNull(currentUser.currentUserId())) {
            byKey.put(state.getInsightKey(), state);
        }
        return byKey;
    }
}
