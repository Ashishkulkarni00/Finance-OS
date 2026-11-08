package com.finance.reservation;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Money still set aside for a goal that is over.
 *
 * <p>A reservation stops its money counting as spendable - it is the {@code reserved} in
 * <em>held − reserved − committed</em>. That is exactly right while the goal is running, and
 * exactly wrong once it is not: the money is quietly withheld from Real Balance, and so from
 * the day rate, for something nobody is saving for any more.
 *
 * @param reason why the goal is over - it changes the sentence, and one of the two cases is
 *               considerably more alarming than the other
 * @param since  when the goal was archived. Null when the goal is gone entirely, because
 *               a deleted row cannot say when
 */
public record StrandedReservation(
        Long reservationId,
        String purpose,
        BigDecimal amount,
        Long accountId,
        String accountName,
        Long goalId,
        String goalName,
        Reason reason,
        LocalDate since
) {
    public enum Reason {
        /** The goal was archived - a deliberate statement that it is finished. */
        GOAL_ARCHIVED,
        /** The goal is no longer there at all, so nothing names what this money is for. */
        GOAL_GONE
    }
}
