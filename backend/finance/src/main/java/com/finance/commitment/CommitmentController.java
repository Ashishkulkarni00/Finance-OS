package com.finance.commitment;

import com.finance.commitment.dto.CommitmentResponse;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.commitment.dto.UpdateCommitmentRequest;
import com.finance.common.web.PageResponse;
import com.finance.effect.WriteEffects;
import com.finance.effect.dto.WriteEffectResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.function.Supplier;

/** HTTP for commitment rules. See {@code CommitmentInstanceController} for occurrences. */
@RestController
@RequestMapping("/api/v1/commitments")
public class CommitmentController {

    private final CommitmentService service;
    private final CommitmentMapper mapper;
    private final WriteEffects effects;

    public CommitmentController(CommitmentService service, CommitmentMapper mapper, WriteEffects effects) {
        this.service = service;
        this.mapper = mapper;
        this.effects = effects;
    }

    @PostMapping
    public ResponseEntity<CommitmentResponse> create(@Valid @RequestBody CreateCommitmentRequest request) {
        var result = effects.around(() -> service.create(request));
        CommitmentView created = result.value();
        return ResponseEntity
                .created(URI.create("/api/v1/commitments/" + created.commitment().getId()))
                .body(mapper.toResponse(created).withEffect(WriteEffectResponse.from(result.effect())));
    }

    @GetMapping
    public PageResponse<CommitmentResponse> list(
            @RequestParam(defaultValue = "false") boolean includeArchived,
            @PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(service.list(includeArchived, pageable), mapper::toResponse);
    }

    /** Add a loan's EMI to the plan - the bill follows the loan from then on. */
    @PostMapping("/from-loan/{loanId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CommitmentResponse createFromLoan(@PathVariable Long loanId) {
        return reported(() -> service.createFromLoan(loanId));
    }

    /** Add a SIP / RD instalment to the plan - the bill follows the holding from then on. */
    @PostMapping("/from-investment/{investmentId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CommitmentResponse createFromInvestment(@PathVariable Long investmentId) {
        return reported(() -> service.createFromInvestment(investmentId));
    }

    @GetMapping("/{id}")
    public CommitmentResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.getById(id));
    }

    @PatchMapping("/{id}")
    public CommitmentResponse update(@PathVariable Long id, @Valid @RequestBody UpdateCommitmentRequest request) {
        return reported(() -> service.update(id, request));
    }

    @PostMapping("/{id}/archive")
    public CommitmentResponse archive(@PathVariable Long id) {
        return reported(() -> service.archive(id));
    }

    @PostMapping("/{id}/unarchive")
    public CommitmentResponse unarchive(@PathVariable Long id) {
        return reported(() -> service.unarchive(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Runs the write, then reports what it did. Composed only after the write's own
     *  transaction has committed, so it can never roll one back (ADR-0017). */
    private CommitmentResponse reported(Supplier<CommitmentView> write) {
        var result = effects.around(write);
        return mapper.toResponse(result.value()).withEffect(WriteEffectResponse.from(result.effect()));
    }
}
