package com.finance.card;

import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Card dates from a card's statement and due days. Pure and stateless, same pivot
 * technique as {@code CycleCalculator}. Statement and due days are capped at 28, so
 * {@code withDayOfMonth} never needs clamping.
 */
@Component
public class CardDueDateCalculator {

    /**
     * Given a purchase date and a card's statement/due days, finds the actual date that
     * purchase falls due - "each purchase shows its actual due date" (B13): once to find
     * which statement the purchase lands on, once to find that statement's due date.
     */
    public LocalDate dueDateFor(LocalDate purchaseDate, int statementDay, int dueDay) {
        LocalDate statementDate = purchaseDate.getDayOfMonth() < statementDay
                ? purchaseDate.withDayOfMonth(statementDay)
                : purchaseDate.plusMonths(1).withDayOfMonth(statementDay);

        return dueDay >= statementDay
                ? statementDate.withDayOfMonth(dueDay)
                : statementDate.plusMonths(1).withDayOfMonth(dueDay);
    }

    /** The most recent statement date on or before {@code today}. */
    public LocalDate latestStatementDate(LocalDate today, int statementDay) {
        return today.getDayOfMonth() >= statementDay
                ? today.withDayOfMonth(statementDay)
                : today.minusMonths(1).withDayOfMonth(statementDay);
    }

    /** The next statement date strictly after {@code today}. */
    public LocalDate nextStatementDate(LocalDate today, int statementDay) {
        return today.getDayOfMonth() < statementDay
                ? today.withDayOfMonth(statementDay)
                : today.plusMonths(1).withDayOfMonth(statementDay);
    }

    /** A statement's due date: the due day later that month, or in the following month
     *  when the due day isn't after the statement's own day. */
    public LocalDate statementDueDate(LocalDate statementDate, int dueDay) {
        return dueDay > statementDate.getDayOfMonth()
                ? statementDate.withDayOfMonth(dueDay)
                : statementDate.plusMonths(1).withDayOfMonth(dueDay);
    }
}
