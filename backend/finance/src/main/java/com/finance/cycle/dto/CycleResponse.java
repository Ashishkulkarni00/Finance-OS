package com.finance.cycle.dto;

import java.time.Instant;
import java.time.LocalDate;

public record CycleResponse(
        Long id,
        LocalDate startDate,
        LocalDate endDate,
        String label,
        boolean closed,
        Instant closedAt
) {
}
