package com.finance.loan;

import com.finance.common.web.PageResponse;
import com.finance.loan.dto.AmortisationEntryResponse;
import com.finance.loan.dto.CreateLoanRequest;
import com.finance.loan.dto.LoanEstimateRequest;
import com.finance.loan.dto.LoanEstimateResponse;
import com.finance.loan.dto.LoanResponse;
import com.finance.loan.dto.LoanSummaryResponse;
import com.finance.loan.dto.UpdateLoanRequest;
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
import java.util.List;

@RestController
@RequestMapping("/api/v1/loans")
public class LoanController {

    private final LoanService service;
    private final LoanMapper mapper;
    private final LoanEstimator estimator;

    public LoanController(LoanService service, LoanMapper mapper, LoanEstimator estimator) {
        this.service = service;
        this.mapper = mapper;
        this.estimator = estimator;
    }

    /** Works out what it can from partial loan figures, for the forms to pre-fill. Saves nothing. */
    @PostMapping("/estimate")
    public LoanEstimateResponse estimate(@Valid @RequestBody LoanEstimateRequest request) {
        return estimator.estimate(request);
    }

    @PostMapping
    public ResponseEntity<LoanResponse> create(@Valid @RequestBody CreateLoanRequest request) {
        LoanView created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/loans/" + created.loan().getId()))
                .body(mapper.toResponse(created));
    }

    @GetMapping
    public PageResponse<LoanResponse> list(@PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(service.list(pageable), mapper::toResponse);
    }

    @GetMapping("/summary")
    public LoanSummaryResponse summary() {
        return mapper.toResponse(service.summary());
    }

    @GetMapping("/{id}")
    public LoanResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.getById(id));
    }

    @PatchMapping("/{id}")
    public LoanResponse update(@PathVariable Long id, @Valid @RequestBody UpdateLoanRequest request) {
        return mapper.toResponse(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/schedule")
    public List<AmortisationEntryResponse> schedule(@PathVariable Long id) {
        LoanView view = service.getById(id);
        return mapper.toScheduleResponse(service.schedule(id), view.paidPeriods());
    }
}
