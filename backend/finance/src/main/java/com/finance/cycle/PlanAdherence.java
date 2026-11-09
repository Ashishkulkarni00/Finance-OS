package com.finance.cycle;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.common.money.MoneyScale;
import com.finance.transaction.domain.TransactionType;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * How a cycle's commitments went against the plan - captured into the snapshot at close,
 * per ADR-0015.
 *
 * <p><strong>Bills only. Money coming in is never a commitment.</strong> An income
 * commitment - a salary, a bonus - generates occurrences like any other, and before
 * 2026-11-07 they were counted among the promises the user kept. On the real October cycle
 * that read <em>16 of 17 kept</em> against a planned cost of ₹1,24,722, which was the
 * genuine ₹67,022 of bills and savings plus a ₹57,700 salary sitting inside a total
 * labelled as what the plan would cost. A salary arriving is not an act of discipline, and
 * the count of commitments kept is this product's North Star (FIX_BACKLOG 1.15).
 *
 * <p><strong>The filter lives here, and the unfiltered call no longer compiles.</strong>
 * {@code ReviewServiceImpl} had its own {@code billsOnly} and this class did not, so
 * Summary read the right figure while {@code CycleServiceImpl.close} wrote the wrong one
 * into {@code CycleSnapshot} - which is immutable by design, so every month closed would
 * have recorded it permanently. Taking the commitments as a required argument is what makes
 * that divergence impossible: there is no overload that skips the filter, so a future caller
 * cannot reintroduce the bug by forgetting it.
 *
 * <p>Filtered on {@code settleAs} alone, which needs no account lookup - so this stays clear
 * of {@code CommitmentBucketClassifier}, whose spendability branch is blocked behind an open
 * decision (FIX_BACKLOG 1.11).
 *
 * @param plannedTotal what the cycle's bills were expected to cost, or <strong>null
 *                     when any one amount was unknown</strong>. Never a total with the
 *                     unknowns quietly dropped: this goes into an immutable row, so a
 *                     confident wrong answer here is wrong forever (ADR-0006).
 * @param actualTotal  what they actually cost - confirmed amounts only
 * @param planned      how many fell due
 * @param kept         how many were paid, or had been settled in an earlier cycle
 */
public record PlanAdherence(BigDecimal plannedTotal, BigDecimal actualTotal, int planned, int kept) {

    /**
     * The occurrences that are actually promises: everything in the cycle except money
     * coming in.
     *
     * <p>Public because "was anything planned this month at all" is asked separately from
     * "how did it go", and both have to mean the same set of rows or a month with nothing
     * but a salary in it would report a plan it does not have.
     *
     * @param commitments the rules behind {@code instances}. Any instance whose rule is
     *                    absent from this collection is kept: a missing rule is unknown,
     *                    not income, and dropping it would quietly shrink the count.
     */
    public static List<CommitmentInstance> billsOnly(List<CommitmentInstance> instances,
                                                     Collection<Commitment> commitments) {
        if (instances.isEmpty()) {
            return instances;
        }
        Set<Long> income = commitments.stream()
                .filter(commitment -> commitment.getSettleAs() == TransactionType.INCOME)
                .map(Commitment::getId)
                .collect(Collectors.toSet());
        if (income.isEmpty()) {
            return instances;
        }
        return instances.stream()
                .filter(instance -> !income.contains(instance.getCommitmentId()))
                .toList();
    }

    /**
     * Public rather than package-private since Summary reads it too ({@code ReviewServiceImpl}):
     * "how did the plan go" has to be the same arithmetic live as it is at close, or the
     * consolidated view and the snapshot would disagree about the North Star.
     *
     * @param commitments the rules behind {@code instances}, used only to drop income - see
     *                    the note on this class for why it is required rather than optional
     */
    public static PlanAdherence from(List<CommitmentInstance> instances, Collection<Commitment> commitments) {
        List<CommitmentInstance> bills = billsOnly(instances, commitments);

        BigDecimal plannedTotal = BigDecimal.ZERO;
        BigDecimal actualTotal = BigDecimal.ZERO;
        boolean plannedKnown = true;
        int kept = 0;

        for (CommitmentInstance instance : bills) {
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

        int planned = (int) bills.stream()
                .filter(i -> i.getStatus() != CommitmentInstanceStatus.SKIPPED)
                .count();

        return new PlanAdherence(
                plannedKnown ? MoneyScale.normalise(plannedTotal) : null,
                MoneyScale.normalise(actualTotal),
                planned,
                kept);
    }
}
