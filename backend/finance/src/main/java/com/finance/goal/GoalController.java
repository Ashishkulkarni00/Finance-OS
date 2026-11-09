package com.finance.goal;

import com.finance.common.web.PageResponse;
import com.finance.effect.WriteEffects;
import com.finance.effect.dto.WriteEffectResponse;
import com.finance.goal.dto.CreateGoalRequest;
import com.finance.goal.dto.GoalFeasibilityResponse;
import com.finance.goal.dto.GoalResponse;
import com.finance.goal.dto.UpdateGoalRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {

    private final GoalService service;
    private final GoalMapper mapper;
    private final WriteEffects effects;
    private final GoalFeasibilityService feasibility;
    private final SuggestedOrderService suggestedOrder;

    public GoalController(GoalService service, GoalMapper mapper, WriteEffects effects,
                          GoalFeasibilityService feasibility, SuggestedOrderService suggestedOrder) {
        this.suggestedOrder = suggestedOrder;
        this.service = service;
        this.mapper = mapper;
        this.effects = effects;
        this.feasibility = feasibility;
    }

    /**
     * Which goals the months ahead can actually carry (ROADMAP 5.1/5.2) - judged in priority
     * order against free money after usual spending, each taking its share before the next.
     */
    /**
     * A suggested order for spare money - buffer, dear debt, full cushion, dated goals, then
     * cheap debt or investing - and where the user stands on it (ROADMAP 5.3). Never enforced.
     */
    @GetMapping("/suggested-order")
    public List<SuggestedOrderService.Step> suggestedOrder() {
        return suggestedOrder.steps();
    }

    @GetMapping("/feasibility")
    public List<GoalFeasibilityResponse> feasibility() {
        return GoalFeasibilityResponse.from(feasibility.assess());
    }

    @PostMapping
    public ResponseEntity<GoalResponse> create(@Valid @RequestBody CreateGoalRequest request) {
        var result = effects.around(() -> service.create(request));
        GoalView created = result.value();
        return ResponseEntity
                .created(URI.create("/api/v1/goals/" + created.goal().getId()))
                .body(mapper.toResponse(created).withEffect(WriteEffectResponse.from(result.effect())));
    }

    @GetMapping
    public PageResponse<GoalResponse> list(
            @RequestParam(defaultValue = "false") boolean includeArchived,
            @PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(service.list(includeArchived, pageable), mapper::toResponse);
    }

    @GetMapping("/{id}")
    public GoalResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.getById(id));
    }

    @PatchMapping("/{id}")
    public GoalResponse update(@PathVariable Long id, @Valid @RequestBody UpdateGoalRequest request) {
        return reported(() -> service.update(id, request));
    }

    @PostMapping("/{id}/archive")
    public GoalResponse archive(@PathVariable Long id) {
        return reported(() -> service.archive(id));
    }

    @PostMapping("/{id}/unarchive")
    public GoalResponse unarchive(@PathVariable Long id) {
        return reported(() -> service.unarchive(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Runs the write, then reports what it did (ADR-0017). */
    private GoalResponse reported(Supplier<GoalView> write) {
        var result = effects.around(write);
        return mapper.toResponse(result.value()).withEffect(WriteEffectResponse.from(result.effect()));
    }
}
