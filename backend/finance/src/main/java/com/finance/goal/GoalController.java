package com.finance.goal;

import com.finance.common.web.PageResponse;
import com.finance.effect.WriteEffects;
import com.finance.effect.dto.WriteEffectResponse;
import com.finance.goal.dto.CreateGoalRequest;
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
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {

    private final GoalService service;
    private final GoalMapper mapper;
    private final WriteEffects effects;

    public GoalController(GoalService service, GoalMapper mapper, WriteEffects effects) {
        this.service = service;
        this.mapper = mapper;
        this.effects = effects;
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
