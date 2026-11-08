package com.finance.commitment;

import java.time.LocalDate;

/**
 * A bill whose plan says one account and whose payments keep coming from another.
 *
 * <p>Settling from an account other than the planned one is allowed on purpose - the Settle
 * sheet's own comment says <em>"Paid from is the plan, not a record"</em>, and a bill paid
 * from somewhere else once is nobody's business but the user's. What was missing is that
 * nothing noticed when it stopped being once.
 *
 * @param consecutive how many of the most recent settlements in a row came from
 *                    {@code actualAccountName}. Two is the floor: one is a one-off, and
 *                    warning about a one-off is how a reader learns to skip the warning
 *                    that matters.
 * @param lastOn      the most recent of those payments, so the reader can place it
 */
public record PlanAccountDrift(
        Long commitmentId,
        String commitmentName,
        Long plannedAccountId,
        String plannedAccountName,
        Long actualAccountId,
        String actualAccountName,
        int consecutive,
        LocalDate lastOn
) {
}
