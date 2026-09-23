package com.finance.cycle;

import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.common.money.MoneyScale;

import java.math.BigDecimal;
import java.util.List;

/**
 * How a cycle's commitments went against the plan - captured into the snapshot at close,
 * per ADR-0015.
 *
 * @param plannedTotal what the cycle's commitments were expected to cost, or <strong>null
 *                     when any one amount was unknown</strong>. Never a total with the
 *                     unknowns quietly dropped: this goes into an immutable row, so a
 *                     confident wrong answer here is wrong forever (ADR-0006).
 * @param actualTotal  what they actually cost - confirmed amounts only
 * @param planned      how many fell due
 * @param kept         how many were paid, or had been settled in an earlier cycle
 */
public record PlanAdherence(BigDecimal plannedTotal, BigDecimal actualTotal, int planned, int kept) {

    static PlanAdherence from(List<CommitmentInstance> instances) {
        BigDecimal plannedTotal = BigDecimal.ZERO;
        BigDecimal actualTotal = BigDecimal.ZERO;
        boolean plannedKnown = true;
        int kept = 0;

        for (CommitmentInstance instance : instances) {
            // A skipped optional bill was never going to be paid, so it is not part of what
            // the cycle planned to spend - counting it would make every month look overspent.
            if (instance.getStatus() == CommitmentInstanceStatus.SKIPPED) {
                continue;
            }
            if (instance.getExpectedAmount() == null) {
                plannedKnown = false;
            } else {
                plannedTotal = plannedTotal.add(instance.getExpectedAmount());
            }
            if (instance.getConfirmedAmount() != null) {
                actualTotal = actualTotal.add(instance.getConfirmedAmount());
            }
            if (instance.getStatus() == CommitmentInstanceStatus.PAID
                    || instance.getStatus() == CommitmentInstanceStatus.SETTLED_EARLIER) {
                kept++;
            }
        }

        int planned = (int) instances.stream()
                .filter(i -> i.getStatus() != CommitmentInstanceStatus.SKIPPED)
                .count();

        return new PlanAdherence(
                plannedKnown ? MoneyScale.normalise(plannedTotal) : null,
                MoneyScale.normalise(actualTotal),
                planned,
                kept);
    }
}
