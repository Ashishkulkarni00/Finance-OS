package com.finance.insight.dto;

import com.finance.insight.InsightChanges;

import java.time.Instant;
import java.util.List;

/** {@code GET /insights/changes} - see {@link InsightChanges}. */
public record InsightChangeResponse(Long id, String key, String type, String severity, String title,
                                    Instant firstSeenAt, Instant clearedAt, int occurrences, boolean liveAgain) {
    public static List<InsightChangeResponse> from(List<InsightChanges.Change> changes) {
        return changes.stream().map(c -> new InsightChangeResponse(c.latest().getId(), c.latest().getInsightKey(),
                c.latest().getInsightType().name(), c.latest().getSeverity().name(), c.latest().getTitle(),
                c.latest().getFirstSeenAt(), c.latest().getClearedAt(), c.occurrences(), c.liveAgain())).toList();
    }
}
