package com.finance.reservation;

import com.finance.common.web.PageResponse;
import com.finance.reservation.dto.CreateReservationRequest;
import com.finance.reservation.dto.ReservationResponse;
import com.finance.reservation.dto.UpdateReservationRequest;
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
@RequestMapping("/api/v1/reservations")
public class ReservationController {

    private final ReservationService service;
    private final ReservationMapper mapper;

    public ReservationController(ReservationService service, ReservationMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody CreateReservationRequest request) {
        ReservationView created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/reservations/" + created.reservation().getId()))
                .body(mapper.toResponse(created.reservation(), created.account()));
    }

    @GetMapping
    public PageResponse<ReservationResponse> list(@PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(service.list(pageable), v -> mapper.toResponse(v.reservation(), v.account()));
    }

    @GetMapping("/{id}")
    public ReservationResponse get(@PathVariable Long id) {
        ReservationView view = service.getById(id);
        return mapper.toResponse(view.reservation(), view.account());
    }

    @PatchMapping("/{id}")
    public ReservationResponse update(@PathVariable Long id, @Valid @RequestBody UpdateReservationRequest request) {
        ReservationView view = service.update(id, request);
        return mapper.toResponse(view.reservation(), view.account());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> release(@PathVariable Long id) {
        service.release(id);
        return ResponseEntity.noContent().build();
    }
}
