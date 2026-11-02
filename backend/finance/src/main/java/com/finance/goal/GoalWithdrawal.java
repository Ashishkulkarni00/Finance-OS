package com.finance.goal;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Money taken back out of a goal's account this cycle, outside the plan.
 *
 * <p>The plan is the thing being measured against. A bill that is <em>supposed</em> to move
 * money out of a goal's account is the plan working and is not counted here - only movements
 * nothing planned are.
 *
 * @param netOut  withdrawals minus unplanned deposits back in, so putting the money back
 *                cancels it rather than leaving a permanent accusation on the screen
 * @param lastOn  the most recent withdrawal's date - what the reader needs to place it
 * @param count   how many withdrawals made up {@code netOut}
 */
public record GoalWithdrawal(
        Long goalId,
        String goalName,
        Long accountId,
        String accountName,
        BigDecimal netOut,
        LocalDate lastOn,
        int count
) {
}
