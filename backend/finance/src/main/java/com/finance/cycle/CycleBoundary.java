package com.finance.cycle;

import java.time.LocalDate;

/** A pure calendar fact: the start and end date of one salary cycle. Not persisted itself. */
public record CycleBoundary(LocalDate startDate, LocalDate endDate) {
}
