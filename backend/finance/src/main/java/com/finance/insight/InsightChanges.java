package com.finance.insight;

import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import com.finance.insight.domain.InsightState;
import com.finance.insight.domain.InsightStateRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * "What changed" - warnings that stopped being true since you last acknowledged them
 * (ROADMAP 3.4).
 *
 * <p>A crossing that starts is already an insight; one that clears was only ever a 10-second
 * toast and one line from {@link CalmVoice} - and only if nothing urgent was live, only the
 * latest, only within a week. A warning that started and resolved between two visits was
 * never mentioned at all. This reads {@code insight_state}'s cleared rows as the timeline
 * they already are.
 *
 * <p><strong>No new column.</strong> {@code dismissed_at} on a cleared row is "Got it": a row
 * the user dismissed while it was live was already answered, and acknowledging a cleared one
 * marks it the same way. A warning that flapped - cleared, came back, cleared again - is
 * shown once, its latest occurrence, with how many times it happened: three separate "No
 * longer" lines for one problem is the repetition this table exists to prevent.
 */
@Component
public class InsightChanges {

    /** Older than this, a resolution is history rather than news. */
    static final int WINDOW_DAYS = 30;

    /**
     * Warnings whose clearing is the ordinary result of the user's own action - a bill due
     * today clears because they paid it; a missing amount clears because they typed it.
     * Telling them so afterwards is an echo, and on real data it was 14 of the first 18 rows,
     * burying the four that were genuinely news (a shortfall that resolved, a card back out
     * of credit). What remains are situations that can resolve without the user looking.
     */
    private static final java.util.Set<InsightType> ROUTINE = java.util.EnumSet.of(
            InsightType.DUE_SOON, InsightType.OVERDUE, InsightType.NEEDS_AMOUNT, InsightType.NEEDS_REVIEW,
            InsightType.UNVERIFIED, InsightType.INCOME_LATE, InsightType.PLANNED_ITEM_MISSED,
            InsightType.CARD_BILL_DUE, InsightType.CARD_BILL_OVERDUE);

    /** Shorter-lived than this, a warning was a flicker mid-edit, not a situation. */
    private static final long FLICKER_SECONDS = 600;

    private final InsightStateRepository repository;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public InsightChanges(InsightStateRepository repository, CurrentUserProvider currentUser, Clock clock) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    /**
     * @param occurrences how many times this warning started and cleared inside the window
     * @param liveAgain   it has since come back - the resolution didn't hold, so it is shown
     *                    as context, not as good news
     */
    public record Change(InsightState latest, int occurrences, boolean liveAgain) {
    }

    @Transactional(readOnly = true)
    public List<Change> unacknowledged() {
        Long userId = currentUser.currentUserId();
        Instant since = Instant.now(clock).minus(WINDOW_DAYS, ChronoUnit.DAYS);
        var liveKeys = repository.findByUserIdAndClearedAtIsNull(userId).stream()
                .map(InsightState::getInsightKey).collect(java.util.stream.Collectors.toSet());

        Map<String, List<InsightState>> byKey = new LinkedHashMap<>();
        for (InsightState s : repository.findByUserIdAndClearedAtIsNotNullOrderByClearedAtDesc(userId)) {
            if (s.getClearedAt().isBefore(since)) {
                break; // newest first, so everything after is older too
            }
            byKey.computeIfAbsent(s.getInsightKey(), k -> new ArrayList<>()).add(s);
        }
        List<Change> out = new ArrayList<>();
        for (var e : byKey.entrySet()) {
            InsightState latest = e.getValue().get(0);
            if (latest.getDismissedAt() != null) {
                continue; // answered - either "I know" while live, or "Got it" since
            }
            if (ROUTINE.contains(latest.getInsightType())
                    || java.time.Duration.between(latest.getFirstSeenAt(), latest.getClearedAt()).getSeconds() < FLICKER_SECONDS) {
                continue;
            }
            if (liveKeys.contains(e.getKey())) {
                continue; // it's back - "no longer" beside the live warning would contradict it
            }
            out.add(new Change(latest, e.getValue().size(), false));
        }
        return out;
    }

    /** "Got it" - this occurrence and any earlier unacknowledged ones for the same warning. */
    @Transactional
    public void acknowledge(Long stateId) {
        Long userId = currentUser.currentUserId();
        InsightState row = repository.findById(stateId)
                .filter(s -> s.getUserId().equals(userId) && s.getClearedAt() != null)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "That change isn't one we're showing you.", "id"));
        Instant now = Instant.now(clock);
        for (InsightState s : repository.findByUserIdAndInsightKeyOrderByFirstSeenAtDesc(userId, row.getInsightKey())) {
            if (s.getClearedAt() != null && s.getDismissedAt() == null) {
                s.setDismissedAt(now);
                repository.save(s);
            }
        }
    }
}
