package com.finance.card;

import com.finance.card.dto.CreateCreditCardRequest;
import com.finance.card.dto.CreditCardResponse;
import com.finance.card.dto.CreditCardsOverviewResponse;
import com.finance.card.dto.UpdateCreditCardRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/** Credit cards as the Cards page sees them - addressed by the card's account id. */
@RestController
@RequestMapping("/api/v1/credit-cards")
public class CreditCardController {

    private final CreditCardService service;
    private final CardMapper mapper;

    public CreditCardController(CreditCardService service, CardMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public CreditCardsOverviewResponse list() {
        return mapper.toResponse(service.list());
    }

    @GetMapping("/{accountId}")
    public CreditCardResponse get(@PathVariable Long accountId) {
        return mapper.toResponse(service.get(accountId));
    }

    @PostMapping
    public ResponseEntity<CreditCardResponse> create(@Valid @RequestBody CreateCreditCardRequest request) {
        CreditCardView created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/credit-cards/" + created.account().getId()))
                .body(mapper.toResponse(created));
    }

    @PatchMapping("/{accountId}")
    public CreditCardResponse update(@PathVariable Long accountId, @Valid @RequestBody UpdateCreditCardRequest request) {
        return mapper.toResponse(service.update(accountId, request));
    }
}
