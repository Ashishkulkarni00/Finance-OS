package com.finance.projection;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * {@code Projection(account, date) = balance(account) − Σ instances hitting that
 * account before date}. DOMAIN_MODEL.md §5 also adds "+ Σ expected income" - not
 * implemented here, since income has no recurring/expected model in this build (only
 * {@code Commitment} outflows are modelled as expected future movements). Documented
 * limitation, not an oversight.
 */
public record ProjectionResult(Long accountId, String accountName, BigDecimal currentBalance,
                               BigDecimal projectedBalance, LocalDate projectionDate,
                               boolean shortfall, List<Deduction> deductions) {

    /**
     * One bill still to leave the account, in due-date order. {@code balanceAfter} is the
     * account's balance once this and every earlier bill in the list have left.
     * {@code covered} says whether that stays at or above the account's floor (its minimum
     * balance, else zero); null for accounts where a negative balance is normal (cards).
     */
    public record Deduction(Long commitmentInstanceId, String name, LocalDate dueDate, BigDecimal amount,
                            BigDecimal balanceAfter, Boolean covered) {
    }
}
