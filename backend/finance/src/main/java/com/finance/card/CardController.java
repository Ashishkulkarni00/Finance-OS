package com.finance.card;

import com.finance.card.dto.CardStatementResponse;
import com.finance.card.dto.CreateCardStatementRequest;
import com.finance.card.dto.CreateCreditCardTermsRequest;
import com.finance.card.dto.CreditCardTermsResponse;
import com.finance.card.dto.StatementDraftResponse;
import com.finance.card.dto.UpdateCreditCardTermsRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts/{accountId}")
public class CardController {

    private final CardService service;
    private final CardMapper mapper;

    public CardController(CardService service, CardMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping("/card-terms")
    public ResponseEntity<CreditCardTermsResponse> createTerms(@PathVariable Long accountId,
                                                                @Valid @RequestBody CreateCreditCardTermsRequest request) {
        CreditCardTermsView view = service.createTerms(accountId, request);
        return ResponseEntity
                .created(URI.create("/api/v1/accounts/" + accountId + "/card-terms"))
                .body(mapper.toResponse(view));
    }

    @GetMapping("/card-terms")
    public CreditCardTermsResponse getTerms(@PathVariable Long accountId) {
        return mapper.toResponse(service.getTerms(accountId));
    }

    @PatchMapping("/card-terms")
    public CreditCardTermsResponse updateTerms(@PathVariable Long accountId,
                                               @Valid @RequestBody UpdateCreditCardTermsRequest request) {
        return mapper.toResponse(service.updateTerms(accountId, request));
    }

    @PostMapping("/statements")
    public ResponseEntity<CardStatementResponse> addStatement(@PathVariable Long accountId,
                                                               @Valid @RequestBody CreateCardStatementRequest request) {
        var statement = service.addStatement(accountId, request);
        return ResponseEntity
                .created(URI.create("/api/v1/accounts/" + accountId + "/statements/" + statement.getId()))
                .body(mapper.toResponse(statement));
    }

    @GetMapping("/statements")
    public List<CardStatementResponse> listStatements(@PathVariable Long accountId) {
        return service.listStatements(accountId).stream().map(mapper::toResponse).toList();
    }

    /** What the statement should say, from the card's entries - for pre-filling. Saves nothing. */
    @GetMapping("/statements/draft")
    public StatementDraftResponse statementDraft(@PathVariable Long accountId,
                                                 @RequestParam(required = false)
                                                 @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate statementDate) {
        return mapper.toResponse(service.statementDraft(accountId, statementDate));
    }

    @DeleteMapping("/statements/{statementId}")
    public ResponseEntity<Void> deleteStatement(@PathVariable Long accountId, @PathVariable Long statementId) {
        service.deleteStatement(accountId, statementId);
        return ResponseEntity.noContent().build();
    }
}
