package com.finance.insight;

import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.insight.dto.InsightListResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insights")
public class InsightController {

    private final InsightService service;
    private final CalmVoice calmVoice;
    private final InsightSilencer silencer;

    public InsightController(InsightService service, CalmVoice calmVoice, InsightSilencer silencer) {
        this.service = service;
        this.calmVoice = calmVoice;
        this.silencer = silencer;
    }

    /** What needs the user on one screen: ranked, capped (Today 3, Month 5), with the full count. */
    @GetMapping
    public InsightListResponse list(@RequestParam(defaultValue = "TODAY") Insight.Surface surface) {
        InsightService.Result result = service.forSurface(surface);
        // The calm voice speaks only when nothing is urgent. Printed beside a shortfall or an
        // overdue bill, "here's what moved" reads as the product missing the point (3.3).
        boolean urgent = result.shown().stream().anyMatch(i ->
                i.severity() == Insight.Severity.CRITICAL || i.severity() == Insight.Severity.ATTENTION);
        return InsightListResponse.of(result.shown(), result.total(),
                urgent ? List.of() : calmVoice.whatMoved());
    }

    /**
     * Everything that needs the user - no surface filter and no cap.
     *
     * <p>A screen's list is deliberately short, and said so ("3 of 7 shown") with nowhere to
     * go. This is where the rest lives. Separate from {@code list} rather than a
     * {@code surface=ALL} value, because a surface is a place a warning is shown and "all"
     * is not a place.
     */
    @GetMapping("/all")
    public InsightListResponse all() {
        var insights = service.evaluateAll();
        return new InsightListResponse(
                insights.stream().map(InsightListResponse::item).toList(),
                insights.size(),
                List.of(),
                silencer.silenced().stream()
                        .map(s -> new InsightListResponse.Silenced(
                                s.getInsightKey(), s.getTitle(), s.getDismissedAt(), s.getSnoozedUntil()))
                        .toList());
    }

    /**
     * "I know" - silent until the situation itself changes (ROADMAP 3.2).
     *
     * <p>The key is resolved against what is <em>currently true</em>, so a warning that has
     * already resolved cannot be dismissed - there would be nothing to dismiss, and the row
     * would describe something the user was never told.
     */
    @PostMapping("/{key}/dismiss")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void dismiss(@PathVariable String key) {
        silencer.dismiss(requireCurrent(key));
    }

    /** "Not this week" - silent until a date, whatever happens in the meantime. */
    @PostMapping("/{key}/snooze")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void snooze(@PathVariable String key, @RequestParam(defaultValue = "7") int days) {
        silencer.snooze(requireCurrent(key), days);
    }

    /** Undo. The warning speaks again immediately. */
    @PostMapping("/{key}/restore")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restore(@PathVariable String key) {
        silencer.restore(key);
    }

    private Insight requireCurrent(String key) {
        return service.evaluateAll().stream()
                .filter(i -> i.key().equals(key))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "That's not something we're telling you about right now.", "key"));
    }
}
