package com.finance.decision;

import com.finance.decision.dto.AffordabilityResponse;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/**
 * The decision engine's read surface (ROADMAP Phase 4).
 *
 * <p>A <strong>GET</strong>, because asking what something would cost changes nothing and
 * must never appear in the Ledger. It is safe to call on every keystroke behind a debounce,
 * which is the point: the answer belongs beside the amount field while the amount is being
 * typed, not on a screen you have to go and find.
 */
@RestController
@RequestMapping("/api/v1/decisions")
public class DecisionController {

    private final AffordabilityService service;

    public DecisionController(AffordabilityService service) {
        this.service = service;
    }

    /** What spending {@code amount} from {@code accountId} today would cost. */
    @GetMapping("/afford")
    public AffordabilityResponse afford(
            @RequestParam @Positive(message = "Amount must be more than zero")
            @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places") BigDecimal amount,
            @RequestParam Long accountId) {
        return AffordabilityResponse.from(service.check(amount, accountId));
    }
}
