package com.finance.plan;

import com.finance.plan.domain.PlanRevision;
import com.finance.plan.dto.CyclePlanChangesResponse;
import com.finance.plan.dto.PlanRevisionResponse;
import org.springframework.stereotype.Component;

@Component
public class PlanRevisionMapper {

    public PlanRevisionResponse toResponse(PlanRevisionView view) {
        PlanRevision revision = view.revision();
        return new PlanRevisionResponse(
                revision.getId(),
                revision.getSubjectType(),
                revision.getSubjectId(),
                revision.getSubjectName(),
                revision.getRevisionType(),
                revision.getRevisionType().isUserDecision(),
                revision.getSupersededSubjectId(),
                revision.getDecidedAt(),
                revision.getEffectiveFrom(),
                revision.getCycleId(),
                revision.getReason(),
                revision.getMonthlyEffect(),
                view.changes().stream()
                        .map(c -> new PlanRevisionResponse.FieldChange(
                                c.getField(), c.getLabel(), c.getValueKind(), c.getOldValue(), c.getNewValue()))
                        .toList());
    }

    public CyclePlanChangesResponse toResponse(CyclePlanChanges changes) {
        return new CyclePlanChangesResponse(
                changes.cycleId(),
                changes.revisions().stream().map(this::toResponse).toList(),
                changes.decisions(),
                changes.followedSources(),
                changes.netMonthlyEffect(),
                changes.effectComplete());
    }
}
