package com.finance.cycle;

import com.finance.common.web.PageResponse;
import com.finance.cycle.dto.FlexibleSpendingResponse;
import com.finance.cycle.dto.CycleResponse;
import com.finance.cycle.dto.CycleSnapshotResponse;
import com.finance.cycle.dto.CycleSummaryResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/cycles")
public class CycleController {

    private final CycleService service;
    private final CycleMapper mapper;

    public CycleController(CycleService service, CycleMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/current")
    public CycleResponse current() {
        return mapper.toResponse(service.resolveCurrent());
    }

    /**
     * The cycle containing a date - found, or created if it doesn't exist yet.
     *
     * <p>How This Month moves between months: the previous cycle is the one containing the
     * day before this one starts, the next is the one containing the day after it ends.
     * Creating on demand is deliberate - a future cycle has to exist before bills can be
     * planned into it, and cycles are only boundaries, never stored figures (ADR-0011).
     */
    @GetMapping("/for-date")
    public CycleResponse forDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return mapper.toResponse(service.resolveForDate(date));
    }

    @GetMapping
    public PageResponse<CycleResponse> list(@PageableDefault(size = 12) Pageable pageable) {
        return PageResponse.from(service.list(pageable), mapper::toResponse);
    }

    @GetMapping("/{id}")
    public CycleResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.getById(id));
    }

    @PostMapping("/{id}/close")
    public CycleSnapshotResponse close(@PathVariable Long id) {
        return mapper.toResponse(service.close(id));
    }

    @GetMapping("/{id}/snapshot")
    public CycleSnapshotResponse snapshot(@PathVariable Long id) {
        return mapper.toResponse(service.getSnapshot(id));
    }

    @GetMapping("/{id}/summary")
    public CycleSummaryResponse summary(@PathVariable Long id) {
        return mapper.toResponse(service.previewSummary(id));
    }

    @GetMapping("/{id}/flexible-spending")
    public FlexibleSpendingResponse flexibleSpending(@PathVariable Long id) {
        return mapper.toResponse(service.flexibleSpending(id));
    }
}
