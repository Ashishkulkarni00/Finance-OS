package com.finance.recovery;

import com.finance.recovery.dto.RecoveryPlanResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The way back from a month that has gone wrong (ROADMAP 6.2). Read-only. */
@RestController
@RequestMapping("/api/v1/recovery")
public class RecoveryController {

    private final RecoveryService service;

    public RecoveryController(RecoveryService service) {
        this.service = service;
    }

    /** Always a 200: ON_COURSE carries no steps, INCOMPLETE says why (ADR-0006). */
    @GetMapping
    public RecoveryPlanResponse current() {
        return RecoveryPlanResponse.from(service.current());
    }
}
