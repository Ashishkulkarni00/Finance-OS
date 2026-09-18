package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.cycle.domain.Cycle;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Turns a {@link Commitment} rule into this cycle's {@link CommitmentInstance}
 * occurrence - the split DOMAIN_MODEL.md §2 calls "the most important structural fix
 * in the MVP". Generation is idempotent at the call site
 * ({@code CommitmentInstanceServiceImpl} finds-or-creates per commitment per cycle).
 */
@Component
public class CommitmentInstanceGenerator {

    public CommitmentInstance generate(Commitment commitment, Cycle cycle) {
        return CommitmentInstance.builder()
                .userId(commitment.getUserId())
                .commitmentId(commitment.getId())
                .cycleId(cycle.getId())
                .dueDate(dueDateWithin(commitment, cycle))
                .expectedAmount(commitment.getAmountType() == CommitmentAmountType.FIXED
                        ? commitment.getFixedAmount() : null)
                .status(CommitmentInstanceStatus.PENDING)
                .build();
    }

    /**
     * Whether this commitment produces an occurrence in this cycle at all.
     *
     * <p>Being active at some point during the cycle is not enough - the occurrence's own
     * due date has to fall inside the commitment's active window. "Electricity, due on the
     * 2nd", added on 12 Sep, overlaps the 28 Aug–27 Sep cycle, so it used to be generated
     * with a due date of 2 Sep: ten days before the bill existed. It was immediately
     * OVERDUE, surfaced in Needs You on Today and Month, and counted as committed money -
     * a false alarm the user had no way to explain. Its first real occurrence is 2 Oct, in
     * the next cycle. The same check bounds the other end: a commitment ending on the 10th
     * owes nothing on the 15th.
     */
    public boolean occursIn(Commitment commitment, Cycle cycle) {
        if (!commitment.isActiveDuring(cycle.getStartDate(), cycle.getEndDate())) {
            return false;
        }
        LocalDate due = dueDateWithin(commitment, cycle);
        if (due.isBefore(commitment.getActiveFrom())
                || (commitment.getActiveTo() != null && due.isAfter(commitment.getActiveTo()))) {
            return false;
        }
        return switch (commitment.getFrequency()) {
            case MONTHLY -> true;
            case QUARTERLY -> monthsSinceStart(commitment, cycle) % 3 == 0;
            case ANNUAL -> monthsSinceStart(commitment, cycle) % 12 == 0;
        };
    }

    /**
     * Finds the occurrence of {@code dueDay} that falls within the cycle - the same
     * pivot logic {@code CycleCalculator} uses, with the commitment's due day playing
     * the role the user's cycle-start day normally plays.
     */
    public LocalDate dueDateWithin(Commitment commitment, Cycle cycle) {
        int cycleStartDay = cycle.getStartDate().getDayOfMonth();
        return commitment.getDueDay() >= cycleStartDay
                ? cycle.getStartDate().withDayOfMonth(commitment.getDueDay())
                : cycle.getStartDate().plusMonths(1).withDayOfMonth(commitment.getDueDay());
    }

    private long monthsSinceStart(Commitment commitment, Cycle cycle) {
        return ChronoUnit.MONTHS.between(commitment.getActiveFrom(), cycle.getStartDate());
    }
}
