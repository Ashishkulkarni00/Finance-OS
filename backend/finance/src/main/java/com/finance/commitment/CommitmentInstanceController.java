package com.finance.commitment;

import com.finance.commitment.dto.CommitmentInstanceDetailResponse;
import com.finance.commitment.dto.CommitmentInstanceHistoryEntry;
import com.finance.commitment.dto.CommitmentInstanceResponse;
import com.finance.commitment.dto.CommitmentPlanProgressResponse;
import com.finance.commitment.dto.CycleStandingResponse;
import com.finance.commitment.dto.SetExpectedAmountRequest;
import com.finance.commitment.dto.SettleCommitmentInstanceRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * HTTP for commitment instances - this cycle's occurrences. Nested under
 * {@code /cycles} for listing (an instance only makes sense in its cycle's context)
 * and flat for the two actions, matching {@code TECHNICAL_ARCHITECTURE.md} §4.
 */
@RestController
public class CommitmentInstanceController {

    private final CommitmentInstanceService service;
    private final CommitmentMapper mapper;

    public CommitmentInstanceController(CommitmentInstanceService service, CommitmentMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/api/v1/cycles/{cycleId}/commitment-instances")
    public List<CommitmentInstanceResponse> listForCycle(@PathVariable Long cycleId) {
        return service.listForCycle(cycleId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @GetMapping("/api/v1/cycles/{cycleId}/plan-progress")
    public CommitmentPlanProgressResponse planProgress(@PathVariable Long cycleId) {
        return mapper.toResponse(service.planProgress(cycleId));
    }

    @GetMapping("/api/v1/cycles/{cycleId}/standing")
    public CycleStandingResponse standing(@PathVariable Long cycleId) {
        return mapper.toResponse(service.standing(cycleId));
    }

    @GetMapping("/api/v1/cycles/{cycleId}/shape")
    public com.finance.commitment.dto.CycleShapeResponse shape(@PathVariable Long cycleId) {
        return mapper.toResponse(service.shape(cycleId));
    }

    @GetMapping("/api/v1/commitment-instances/{id}")
    public CommitmentInstanceDetailResponse get(@PathVariable Long id) {
        return mapper.toDetailResponse(service.getDetail(id));
    }

    /** Recent occurrences of one rule, across cycles - the rule detail route's history. */
    @GetMapping("/api/v1/commitments/{commitmentId}/instances")
    public List<CommitmentInstanceHistoryEntry> recentForCommitment(@PathVariable Long commitmentId) {
        return mapper.toHistoryEntries(service.recentForCommitment(commitmentId));
    }

    @PostMapping("/api/v1/commitment-instances/{id}/settle")
    public CommitmentInstanceResponse settle(@PathVariable Long id,
                                             @Valid @RequestBody SettleCommitmentInstanceRequest request) {
        CommitmentInstanceView view = service.settle(id, request);
        return mapper.toResponse(view);
    }

    /** Sets an unpaid occurrence's expected amount - how a variable bill stops blocking Room. */
    @PatchMapping("/api/v1/commitment-instances/{id}")
    public CommitmentInstanceResponse setExpectedAmount(@PathVariable Long id,
                                                        @Valid @RequestBody SetExpectedAmountRequest request) {
        return mapper.toResponse(service.setExpectedAmount(id, request.expectedAmount()));
    }

    @PostMapping("/api/v1/commitment-instances/{id}/skip")
    public CommitmentInstanceResponse skip(@PathVariable Long id) {
        return mapper.toResponse(service.skip(id));
    }

    @PostMapping("/api/v1/commitment-instances/{id}/unskip")
    public CommitmentInstanceResponse unskip(@PathVariable Long id) {
        return mapper.toResponse(service.unskip(id));
    }

    @PostMapping("/api/v1/commitment-instances/{id}/confirm")
    public CommitmentInstanceResponse confirm(@PathVariable Long id) {
        CommitmentInstanceView view = service.confirm(id);
        return mapper.toResponse(view);
    }
}
