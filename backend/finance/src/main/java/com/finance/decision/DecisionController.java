package com.finance.decision;

import com.finance.decision.dto.AffordabilityResponse;
import com.finance.decision.dto.LumpSumResponse;
import com.finance.decision.dto.UnlockOptionResponse;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
    private final UnlockDecisionService unlockService;
    private final LumpSumService lumpSumService;

    public DecisionController(AffordabilityService service, UnlockDecisionService unlockService,
                              LumpSumService lumpSumService) {
        this.service = service;
        this.unlockService = unlockService;
        this.lumpSumService = lumpSumService;
    }

    /**
     * Where a lump sum could go - each loan prepaid, each goal, or kept - with what each does
     * in its own unit (ROADMAP 4.3). No investment return is assumed; only the bar is stated.
     */
    @GetMapping("/lump-sum")
    public LumpSumResponse lumpSum(
            @RequestParam @Positive(message = "Amount must be more than zero")
            @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places") BigDecimal amount) {
        return LumpSumResponse.from(lumpSumService.evaluate(amount));
    }

    /**
     * What {@code amount} a month, freed up, could do - on each loan, on each goal, or kept
     * (ROADMAP 4.4).
     *
     * <p>Takes the amount rather than the commitment that freed it: the question is the same
     * whether the money came from a loan ending, a subscription cancelled, or a raise, and
     * tying it to an unlock would make it unusable for the other two. {@code startsOn} is
     * when it becomes free (an EMI ending in February); omitted, it is free today.
     */
    @GetMapping("/unlock-options")
    public List<UnlockOptionResponse> unlockOptions(
            @RequestParam @Positive(message = "Amount must be more than zero")
            @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places") BigDecimal amount,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startsOn) {
        return UnlockOptionResponse.from(unlockService.optionsFor(amount, startsOn));
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
