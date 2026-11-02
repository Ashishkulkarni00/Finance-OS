package com.finance.review;

import com.finance.review.dto.DebtTrajectoryResponse;
import com.finance.review.dto.MonthCategoriesResponse;
import com.finance.review.dto.MonthReviewResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * HTTP for Summary. Two reads, no writes - this screen only ever consolidates what other
 * screens already own.
 *
 * <p>Deliberately not folded into {@code CycleController}: a cycle's own endpoints answer
 * "this month", and every one of them takes an id. These answer "the months together",
 * which is a different question and has no id to take.
 */
@RestController
@RequestMapping("/api/v1/review")
public class ReviewController {

    private final ReviewService service;
    private final ReviewMapper mapper;

    public ReviewController(ReviewService service, ReviewMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    /** The salary months that exist, oldest first, including the one in progress. */
    @GetMapping("/months")
    public MonthReviewResponse months(@RequestParam(defaultValue = "12") int months) {
        return mapper.toResponse(service.months(months));
    }

    /**
     * What one month's spending went on, ranked. A path under {@code /months} rather than a
     * parameter on it: this is detail about one of them, not another view of all of them.
     */
    @GetMapping("/months/{cycleId}/categories")
    public MonthCategoriesResponse categories(@PathVariable Long cycleId) {
        return mapper.toResponse(service.categories(cycleId));
    }

    /** Every loan walked forward to the day the last one clears. */
    @GetMapping("/debt-trajectory")
    public DebtTrajectoryResponse debtTrajectory() {
        return mapper.toResponse(service.debtTrajectory());
    }
}
