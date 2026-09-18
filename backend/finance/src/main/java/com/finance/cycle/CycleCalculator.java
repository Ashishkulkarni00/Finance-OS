package com.finance.cycle;

import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Turns a user's {@code cycleStartDay} into the boundary of the cycle containing any
 * given date. Pure and stateless - no database access.
 *
 * <p>{@code cycleStartDay} is constrained to 1-28 at the database level
 * ({@code ck_users_cycle_start_day}), specifically so this arithmetic never has to
 * handle a month too short to contain the start day - every month has at least 28
 * days. That constraint is why this class has no edge cases to speak of.
 */
@Component
public class CycleCalculator {

    public CycleBoundary boundaryContaining(LocalDate date, int cycleStartDay) {
        LocalDate start = date.getDayOfMonth() >= cycleStartDay
                ? date.withDayOfMonth(cycleStartDay)
                : date.minusMonths(1).withDayOfMonth(cycleStartDay);
        LocalDate end = start.plusMonths(1).minusDays(1);
        return new CycleBoundary(start, end);
    }
}
