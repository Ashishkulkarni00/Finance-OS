package com.finance.state;

import com.finance.state.dto.FinancialStateResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HTTP for the whole position. Deliberately thin - see the note on {@code AccountController}.
 *
 * <p>One endpoint, deliberately without parameters. A screen that needs a slice can already
 * call the endpoint that owns it; this exists for the question no single endpoint answers -
 * "where do I stand" - and adding filters would turn it back into five reads.
 */
@RestController
@RequestMapping("/api/v1/financial-state")
public class FinancialStateController {

    private final FinancialStateService service;
    private final FinancialStateMapper mapper;

    public FinancialStateController(FinancialStateService service, FinancialStateMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public FinancialStateResponse current() {
        return mapper.toResponse(service.current());
    }
}
