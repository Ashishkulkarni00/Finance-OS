package com.finance.transaction;

import com.finance.common.web.PageResponse;
import com.finance.transaction.domain.TransactionType;
import com.finance.transaction.dto.CreateTransactionRequest;
import com.finance.transaction.dto.DaySubtotalResponse;
import com.finance.transaction.dto.TransactionResponse;
import com.finance.transaction.dto.TransactionViewSummaryResponse;
import com.finance.transaction.dto.UpdateTransactionRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

/**
 * HTTP for transactions. Deliberately thin - see the note on {@code AccountController}.
 *
 * <p>The user never sees the word "posting"; this layer only ever speaks in
 * transactions.
 */
@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService service;
    private final TransactionMapper mapper;

    public TransactionController(TransactionService service, TransactionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @Valid @RequestBody CreateTransactionRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        TransactionView created = service.create(request, idempotencyKey);
        return ResponseEntity
                .created(URI.create("/api/v1/transactions/" + created.transaction().getId()))
                .body(mapper.toResponse(created.transaction(), created.account(),
                        created.toAccount(), created.category()));
    }

    @GetMapping
    public PageResponse<TransactionResponse> list(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long cycleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(
                service.search(accountId, categoryId, type, cycleId, dateFrom, dateTo, q, pageable),
                view -> mapper.toResponse(view.transaction(), view.account(), view.toAccount(), view.category()));
    }

    /** The Ledger's stated-view total - same filters as {@link #list}, one row. */
    @GetMapping("/summary")
    public TransactionViewSummaryResponse summary(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long cycleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String q) {
        return mapper.toResponse(service.viewSummary(accountId, categoryId, type, cycleId, dateFrom, dateTo, q));
    }

    /** The Ledger's day-group subtotals - same filters as {@link #list}, one row per day. */
    @GetMapping("/day-subtotals")
    public List<DaySubtotalResponse> daySubtotals(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long cycleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String q) {
        return service.daySubtotals(accountId, categoryId, type, cycleId, dateFrom, dateTo, q).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public TransactionResponse get(@PathVariable Long id) {
        TransactionView view = service.getById(id);
        return mapper.toResponse(view.transaction(), view.account(), view.toAccount(), view.category());
    }

    @PatchMapping("/{id}")
    public TransactionResponse update(@PathVariable Long id,
                                      @Valid @RequestBody UpdateTransactionRequest request) {
        TransactionView view = service.update(id, request);
        return mapper.toResponse(view.transaction(), view.account(), view.toAccount(), view.category());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
