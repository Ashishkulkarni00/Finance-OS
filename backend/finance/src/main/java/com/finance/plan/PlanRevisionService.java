package com.finance.plan;

import com.finance.plan.domain.PlanSubjectType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Reading the plan's history. Writing goes through {@link PlanRevisionRecorder}. */
public interface PlanRevisionService {

    Page<PlanRevisionView> list(Pageable pageable);

    /** Every version of one plan line, newest first - including the rules it superseded. */
    Page<PlanRevisionView> forSubject(PlanSubjectType subjectType, Long subjectId, Pageable pageable);

    /** What changed during a cycle. */
    CyclePlanChanges forCycle(Long cycleId);
}
