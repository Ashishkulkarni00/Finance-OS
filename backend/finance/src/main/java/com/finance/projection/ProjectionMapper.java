package com.finance.projection;

import com.finance.projection.dto.ProjectionResponse;
import org.springframework.stereotype.Component;

@Component
public class ProjectionMapper {

    public ProjectionResponse toResponse(ProjectionResult result) {
        var deductions = result.deductions().stream()
                .map(d -> new ProjectionResponse.Deduction(d.commitmentInstanceId(), d.name(), d.dueDate(), d.amount(),
                        d.balanceAfter(), d.covered()))
                .toList();

        return new ProjectionResponse(result.accountId(), result.accountName(), result.currentBalance(),
                result.projectedBalance(), result.projectionDate(), result.shortfall(), deductions);
    }
}
