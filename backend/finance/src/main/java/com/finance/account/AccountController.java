package com.finance.account;

import com.finance.account.domain.Account;
import com.finance.account.dto.AccountResponse;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.account.dto.UpdateAccountRequest;
import com.finance.common.web.PageResponse;
import com.finance.effect.WriteEffects;
import com.finance.effect.dto.WriteEffectResponse;
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
import java.util.function.Supplier;

/**
 * HTTP for accounts.
 *
 * <p>Deliberately thin: accept a DTO, call one service method, map the result. No
 * business rules, no repository access, no {@code @Transactional}, and no try/catch -
 * errors are handled centrally by {@code GlobalExceptionHandler}.
 */
@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountService service;
    private final AccountMapper mapper;
    private final WriteEffects effects;

    public AccountController(AccountService service, AccountMapper mapper, WriteEffects effects) {
        this.service = service;
        this.mapper = mapper;
        this.effects = effects;
    }

    @PostMapping
    public ResponseEntity<AccountResponse> create(@Valid @RequestBody CreateAccountRequest request) {
        var result = effects.around(() -> service.create(request));
        Account created = result.value();
        return ResponseEntity
                .created(URI.create("/api/v1/accounts/" + created.getId()))
                .body(mapper.toResponse(created).withEffect(WriteEffectResponse.from(result.effect())));
    }

    @GetMapping
    public PageResponse<AccountResponse> list(
            @RequestParam(defaultValue = "false") boolean includeArchived,
            @PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(service.list(includeArchived, pageable), mapper::toResponse);
    }

    @GetMapping("/{id}")
    public AccountResponse get(@PathVariable Long id) {
        return mapper.toResponse(service.getById(id));
    }

    @PatchMapping("/{id}")
    public AccountResponse update(@PathVariable Long id,
                                  @Valid @RequestBody UpdateAccountRequest request) {
        return reported(() -> service.update(id, request));
    }

    @PostMapping("/{id}/archive")
    public AccountResponse archive(@PathVariable Long id) {
        return reported(() -> service.archive(id));
    }

    @PostMapping("/{id}/unarchive")
    public AccountResponse unarchive(@PathVariable Long id) {
        return reported(() -> service.unarchive(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Runs the write, then reports what it did (ADR-0017). */
    private AccountResponse reported(Supplier<Account> write) {
        var result = effects.around(write);
        return mapper.toResponse(result.value()).withEffect(WriteEffectResponse.from(result.effect()));
    }
}
