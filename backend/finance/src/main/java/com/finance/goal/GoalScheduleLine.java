package com.finance.goal;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One dated amount a goal has to cover - a payment planned against it (a trip's bookings
 * in October), or the part of the target no payment is planned for yet, due on the goal's
 * own date (the rest, at the trip). Derived on every read, never stored (ADR-0011).
 *
 * @param commitmentId     the planned payment, or null for the unplanned remainder
 * @param amount           what it comes to; null when it changes each time and has no figure yet
 * @param paid             already paid against it
 * @param stillNeeded      amount − paid, never negative; null when the amount is unknown
 * @param neededByThen     every unpaid amount up to and including this one
 * @param shortBy          how much of {@code neededByThen} isn't saved yet
 */
public record GoalScheduleLine(
        Long commitmentId,
        String name,
        LocalDate date,
        BigDecimal amount,
        BigDecimal paid,
        BigDecimal stillNeeded,
        BigDecimal neededByThen,
        BigDecimal shortBy,
        Status status) {

    public enum Status {
        /** Fully paid. */
        PAID,
        /** Not paid yet, but what's saved already covers it (and everything before it). */
        COVERED,
        /** Not enough saved yet to cover it by its date. */
        SHORT,
        /** Changes each time and has no amount yet - can't be counted. */
        AMOUNT_UNKNOWN
    }
}
