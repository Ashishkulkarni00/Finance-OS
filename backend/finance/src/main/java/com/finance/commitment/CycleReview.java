package com.finance.commitment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * "September in 60 seconds" - a month against its plan (STRATEGY_DEEP_DIVE Phase 2 piece 4,
 * read-only version). Derived at read time; nothing is stored.
 *
 * <p>Honest limit, stated on screen: until the plan is locked at month start (the parked
 * integrity design), "planned" means the plan <em>as it stands now</em> - a bill edited
 * after the fact shows its edited figure.
 *
 * <p>Buckets are the month outline's own ({@link CycleShape}): payments = expenses and
 * transfers paying a card or loan; set aside = investments and transfers into money that
 * isn't for spending.
 */
public record CycleReview(
        BigDecimal incomeExpected,
        BigDecimal incomeReceived,
        BigDecimal paymentsPlanned,
        BigDecimal paymentsPaid,
        int paymentsCount,
        int paymentsPaidCount,
        BigDecimal setAsidePlanned,
        BigDecimal setAsideMade,
        /** The month outline's flexible; null when nothing was coming in. */
        BigDecimal flexible,
        BigDecimal spentOutsidePlan,
        List<Item> notDone,
        List<Item> skipped,
        List<Difference> differences,
        List<Spend> largestUnplanned
) {
    /**
     * Must-pay bills that didn't happen and so carry into the next month - the loop ROADMAP 6.4
     * closes: what this month leaves the next one to absorb. Savings that didn't happen are not
     * carried (a missed SIP isn't owed to anyone). <strong>Null when any such bill has no
     * amount</strong> - a total that dropped it would read as the whole of it (ADR-0006).
     */
    public BigDecimal carryOver() {
        BigDecimal total = BigDecimal.ZERO;
        for (Item i : notDone) {
            if (!i.mandatory() || i.savings()) {
                continue;
            }
            if (i.amount() == null) {
                return null;
            }
            total = total.add(i.amount());
        }
        return com.finance.common.money.MoneyScale.normalise(total);
    }

    /** How many must-pay bills {@link #carryOver} covers. */
    public int carryOverCount() {
        return (int) notDone.stream().filter(i -> i.mandatory() && !i.savings()).count();
    }

    /** A plan item that didn't happen (or was skipped) - its amount still owed/planned. */
    public record Item(Long instanceId, String name, BigDecimal amount, LocalDate dueDate, boolean mandatory,
                       boolean savings) {
    }

    /** A settled item whose actual differed from its plan. {@code difference} = actual − planned. */
    public record Difference(Long instanceId, String name, BigDecimal planned, BigDecimal actual, BigDecimal difference) {
    }

    /** One of the month's largest expenses that no plan item accounts for. */
    public record Spend(Long transactionId, String description, LocalDate date, BigDecimal amount, String category) {
    }
}
