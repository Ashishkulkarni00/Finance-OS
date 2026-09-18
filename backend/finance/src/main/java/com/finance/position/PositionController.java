package com.finance.position;

import com.finance.position.dto.CashPositionResponse;
import com.finance.position.dto.NetWorthResponse;
import com.finance.position.dto.PositionResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The product's core computed endpoint. {@code GET /position} returns the full
 * breakdown, not just the number - Principle 2 (traceability) as an API contract.
 */
@RestController
@RequestMapping("/api/v1")
public class PositionController {

    private final PositionService service;
    private final PositionMapper mapper;

    public PositionController(PositionService service, PositionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/position")
    public PositionResponse position() {
        return mapper.toResponse(service.currentPosition());
    }

    /** Accounts' own standing line - what's held, what's reserved, what's left. */
    @GetMapping("/position/cash")
    public CashPositionResponse cashPosition() {
        return mapper.toResponse(service.currentCashPosition());
    }

    @GetMapping("/net-worth")
    public NetWorthResponse netWorth() {
        return mapper.toResponse(service.currentNetWorth());
    }
}
