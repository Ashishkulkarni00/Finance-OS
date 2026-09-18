package com.finance.card;

import com.finance.card.dto.CreateDebitCardRequest;
import com.finance.card.dto.DebitCardResponse;
import com.finance.card.dto.UpdateDebitCardRequest;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/debit-cards")
public class DebitCardController {

    private final DebitCardService service;
    private final CardMapper mapper;

    public DebitCardController(DebitCardService service, CardMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<DebitCardResponse> list() {
        return service.list().stream().map(mapper::toResponse).toList();
    }

    @PostMapping
    public ResponseEntity<DebitCardResponse> create(@Valid @RequestBody CreateDebitCardRequest request) {
        DebitCardView created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/debit-cards/" + created.card().getId()))
                .body(mapper.toResponse(created));
    }

    @PatchMapping("/{id}")
    public DebitCardResponse update(@PathVariable Long id, @Valid @RequestBody UpdateDebitCardRequest request) {
        return mapper.toResponse(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
