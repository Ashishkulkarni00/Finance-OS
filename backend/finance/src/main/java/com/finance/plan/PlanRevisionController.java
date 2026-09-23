package com.finance.plan;

import com.finance.common.web.PageResponse;
import com.finance.plan.domain.PlanSubjectType;
import com.finance.plan.dto.CyclePlanChangesResponse;
import com.finance.plan.dto.PlanRevisionResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The plan's history. Read-only by design: a revision is written as a side effect of the
 * change it describes, never posted on its own - see ADR-0015.
 */
@RestController
@RequestMapping("/api/v1/plan-revisions")
public class PlanRevisionController {

    private final PlanRevisionService service;
    private final PlanRevisionMapper mapper;

    public PlanRevisionController(PlanRevisionService service, PlanRevisionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    /** Everything, newest first; or one plan line's history when a subject is given. */
    @GetMapping
    public PageResponse<PlanRevisionResponse> list(
            @RequestParam(required = false) PlanSubjectType subjectType,
            @RequestParam(required = false) Long subjectId,
            @PageableDefault(size = 50) Pageable pageable) {

        if (subjectType != null && subjectId != null) {
            return PageResponse.from(service.forSubject(subjectType, subjectId, pageable), mapper::toResponse);
        }
        return PageResponse.from(service.list(pageable), mapper::toResponse);
    }

    /** What changed about the plan during one cycle. */
    @GetMapping("/cycles/{cycleId}")
    public CyclePlanChangesResponse forCycle(@PathVariable Long cycleId) {
        return mapper.toResponse(service.forCycle(cycleId));
    }
}
