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
                view.currentAmount(), view.progressPercent(), view.requiredPerMonth(),
                view.pace(), view.timeElapsedPercent(),
                goal.isArchived(), goal.getArchivedAt(), goal.getCreatedAt(), goal.getUpdatedAt());
    }
}
