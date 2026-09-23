package com.finance.insight;

import com.finance.insight.dto.InsightListResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insights")
public class InsightController {

    private final InsightService service;

    public InsightController(InsightService service) {
        this.service = service;
    }

    /** What needs the user on one screen: ranked, capped (Today 3, Month 5), with the full count. */
    @GetMapping
    public InsightListResponse list(@RequestParam(defaultValue = "TODAY") Insight.Surface surface) {
        InsightService.Result result = service.forSurface(surface);
        return InsightListResponse.of(result.shown(), result.total());
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
        return InsightListResponse.of(insights, insights.size());
    }
}
