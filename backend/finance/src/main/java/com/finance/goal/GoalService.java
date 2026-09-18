package com.finance.goal;

import com.finance.goal.dto.CreateGoalRequest;
import com.finance.goal.dto.UpdateGoalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GoalService {

    GoalView create(CreateGoalRequest request);

    GoalView getById(Long id);

    Page<GoalView> list(boolean includeArchived, Pageable pageable);

    GoalView update(Long id, UpdateGoalRequest request);

    GoalView archive(Long id);

    GoalView unarchive(Long id);

    void delete(Long id);
}
