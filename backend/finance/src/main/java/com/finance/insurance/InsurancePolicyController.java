package com.finance.insurance;

import com.finance.common.web.PageResponse;
import com.finance.insurance.dto.CreateInsurancePolicyRequest;
import com.finance.insurance.dto.InsurancePolicyResponse;
import com.finance.insurance.dto.InsuranceSummaryResponse;
import com.finance.insurance.dto.UpdateInsurancePolicyRequest;
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

@RestController
@RequestMapping("/api/v1/insurance-policies")
public class InsurancePolicyController {

    private final InsurancePolicyService service;
    private final InsurancePolicyMapper mapper;

    public InsurancePolicyController(InsurancePolicyService service, InsurancePolicyMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<InsurancePolicyResponse> create(@Valid @RequestBody CreateInsurancePolicyRequest request) {
        InsurancePolicyView created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/insurance-policies/" + created.policy().getId()))
                .body(mapper.toResponse(created));
    }

    @GetMapping
    public PageResponse<InsurancePolicyResponse> list(
            @RequestParam(defaultValue = "false") boolean includeArchived,
            @PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(service.list(includeArchived, pageable), mapper::toResponse);
    }

    @GetMapping("/summary")
    public InsuranceSummaryResponse summary() {
        return mapper.toResponse(service.summary());
    }

    @GetMapping("/{id}")
    public InsurancePolicyResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.getById(id));
    }

    @PatchMapping("/{id}")
    public InsurancePolicyResponse update(@PathVariable Long id, @Valid @RequestBody UpdateInsurancePolicyRequest request) {
        return mapper.toResponse(service.update(id, request));
    }

    @PostMapping("/{id}/archive")
    public InsurancePolicyResponse archive(@PathVariable Long id) {
        return mapper.toResponse(service.archive(id));
    }

    @PostMapping("/{id}/unarchive")
    public InsurancePolicyResponse unarchive(@PathVariable Long id) {
        return mapper.toResponse(service.unarchive(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
