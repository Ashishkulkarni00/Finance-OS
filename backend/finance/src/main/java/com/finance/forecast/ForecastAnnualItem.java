package com.finance.forecast;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A bill due this forecast month that doesn't come every month (QUARTERLY or ANNUAL) -
 * insurance, an annual bonus, a yearly renewal. Called out separately from the monthly
 * total because these are exactly the ones a household forgets between occurrences.
 * {@code amount} is null for a variable bill with no figure to project.
 */
public record ForecastAnnualItem(Long commitmentId, String name, BigDecimal amount, LocalDate dueDate) {
}
