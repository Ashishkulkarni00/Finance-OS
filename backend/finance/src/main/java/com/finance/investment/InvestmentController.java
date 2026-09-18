package com.finance.investment;

import com.finance.common.web.PageResponse;
import com.finance.investment.dto.CreateInvestmentRequest;
import com.finance.investment.dto.InvestmentResponse;
import com.finance.investment.dto.InvestmentSummaryResponse;
import com.finance.investment.dto.RecordValuationRequest;
import com.finance.investment.dto.UpdateInvestmentRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/investments")
public class InvestmentController {

    private final InvestmentService service;
    private final InvestmentMapper mapper;

    public InvestmentController(InvestmentService service, InvestmentMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<InvestmentResponse> create(@Valid @RequestBody CreateInvestmentRequest request) {
        InvestmentView created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/investments/" + created.investment().getId()))
                .body(mapper.toResponse(created));
    }

    @GetMapping
    public PageResponse<InvestmentResponse> list(@PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(service.list(pageable), mapper::toResponse);
    }

    @GetMapping("/summary")
    public InvestmentSummaryResponse summary() {
        return mapper.toResponse(service.summary());
    }

    @GetMapping("/{id}")
    public InvestmentResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.getById(id));
    }

    @PatchMapping("/{id}")
    public InvestmentResponse update(@PathVariable Long id, @Valid @RequestBody UpdateInvestmentRequest request) {
        return mapper.toResponse(service.update(id, request));
    }

    /** The screen's primary action - "here's what it's worth today". Separate from PATCH
     *  so a valuation can never be recorded without a date against it. */
    @PostMapping("/{id}/value")
    public InvestmentResponse recordValuation(@PathVariable Long id, @Valid @RequestBody RecordValuationRequest request) {
        return mapper.toResponse(service.recordValuation(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
