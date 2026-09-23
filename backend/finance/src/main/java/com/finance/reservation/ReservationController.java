package com.finance.reservation;

import com.finance.common.web.PageResponse;
import com.finance.effect.WriteEffects;
import com.finance.effect.dto.WriteEffectResponse;
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
    private final WriteEffects effects;

    public ReservationController(ReservationService service, ReservationMapper mapper, WriteEffects effects) {
        this.service = service;
        this.mapper = mapper;
        this.effects = effects;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody CreateReservationRequest request) {
        var result = effects.around(() -> service.create(request));
        ReservationView created = result.value();
        return ResponseEntity
                .created(URI.create("/api/v1/reservations/" + created.reservation().getId()))
                .body(mapper.toResponse(created.reservation(), created.account())
                        .withEffect(WriteEffectResponse.from(result.effect())));
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
        var result = effects.around(() -> service.update(id, request));
        ReservationView view = result.value();
        return mapper.toResponse(view.reservation(), view.account())
                .withEffect(WriteEffectResponse.from(result.effect()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> release(@PathVariable Long id) {
        service.release(id);
        return ResponseEntity.noContent().build();
    }
}
