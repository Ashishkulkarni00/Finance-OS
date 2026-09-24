package com.finance.goal;

import com.finance.goal.dto.GoalResponse;
import org.springframework.stereotype.Component;

@Component
public class GoalMapper {

    public GoalResponse toResponse(GoalView view) {
        var goal = view.goal();
        return new GoalResponse(
                goal.getId(), goal.getName(), goal.getTargetAmount(), goal.getTargetDate(), goal.getPriority(),
                goal.getLinkedReservationId(), goal.getLinkedAccountId(),
                view.currentAmount(), view.spentAmount(), view.progressPercent(), view.requiredPerMonth(),
                view.fundedPerMonth(), view.fundingVaries(),
                view.pace(), view.timeElapsedPercent(),
                view.schedule().stream()
                        .map(l -> new GoalResponse.ScheduleLine(l.commitmentId(), l.name(), l.date(), l.amount(), l.paid(),
                                l.stillNeeded(), l.neededByThen(), l.shortBy(), l.status()))
                        .toList(),
                goal.isArchived(), goal.getArchivedAt(), goal.getCreatedAt(), goal.getUpdatedAt(),
                // Reads report no effect; a write attaches its own (ADR-0017).
                null);
    }
}
