package com.finance.account;

import com.finance.account.domain.Account;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.account.dto.UpdateAccountRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.DuplicateResourceException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

/**
 * Business rules for accounts.
 *
 * <p>This is the only layer that may open a transaction, and the only layer that
 * decides what is permitted. Controllers translate HTTP; repositories fetch rows.
 */
@Service
public class AccountServiceImpl implements AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountServiceImpl.class);

    private final AccountRepository repository;
    private final AccountMapper mapper;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public AccountServiceImpl(AccountRepository repository,
                              AccountMapper mapper,
                              CurrentUserProvider currentUser,
                              Clock clock) {
        this.repository = repository;
        this.mapper = mapper;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Override
    @Transactional
    public Account create(CreateAccountRequest request) {
        Long userId = currentUser.currentUserId();
        String name = request.name().trim();

        requireOpeningDateNotInFuture(request.openingAsOf());

        if (repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(userId, name)) {
            throw new DuplicateResourceException(ErrorCode.ACCOUNT_NAME_TAKEN,
                    "You already have an account called \"" + name + "\". Pick a different name.",
                    "name");
        }

        Account saved = repository.save(mapper.toEntity(request, userId));
        // Ids and types only - never amounts or account identifiers. See ADR-0010.
        log.info("Account created id={} type={}", saved.getId(), saved.getType());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Account getById(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(() -> notFound(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Account getByIdIncludingDeleted(Long id) {
        return repository.findByIdAndUserId(id, currentUser.currentUserId())
                .orElseThrow(() -> notFound(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Account> list(boolean includeArchived, Pageable pageable) {
        return repository.findAllForUser(currentUser.currentUserId(), includeArchived, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Account> listActive() {
        return repository.findActiveForUser(currentUser.currentUserId());
    }

    @Override
    @Transactional
    public Account update(Long id, UpdateAccountRequest request) {
        Account account = getById(id);

        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isEmpty()) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "An account needs a name you'll recognise.", "name");
            }
            if (repository.existsByNameForOtherAccount(account.getUserId(), name, account.getId())) {
                throw new DuplicateResourceException(ErrorCode.ACCOUNT_NAME_TAKEN,
                        "You already have an account called \"" + name + "\". Pick a different name.",
                        "name");
            }
            account.setName(name);
        }

        if (request.openingAsOf() != null) {
            requireOpeningDateNotInFuture(request.openingAsOf());
            account.setOpeningAsOf(request.openingAsOf());
        }
        if (request.openingBalance() != null) {
            account.setOpeningBalance(MoneyScale.normalise(request.openingBalance()));
        }
        if (request.openingConfidence() != null) {
            account.setOpeningConfidence(request.openingConfidence());
        }
        if (request.institution() != null) {
            account.setInstitution(blankToNull(request.institution()));
        }
        if (request.lastFour() != null) {
            account.setLastFour(blankToNull(request.lastFour()));
        }
        if (request.minimumBalance() != null) {
            account.setMinimumBalance(MoneyScale.normalise(request.minimumBalance()));
        }
        if (request.minimumBalanceMandatory() != null) {
            account.setMinimumBalanceMandatory(request.minimumBalanceMandatory());
        }
        if (request.includeInSpendable() != null) {
            account.setIncludeInSpendable(request.includeInSpendable());
        }
        if (request.includeInNetWorth() != null) {
            account.setIncludeInNetWorth(request.includeInNetWorth());
        }
        if (request.purpose() != null) {
            account.setPurpose(blankToNull(request.purpose()));
        }
        if (request.displayOrder() != null) {
            account.setDisplayOrder(request.displayOrder());
        }

        log.info("Account updated id={}", account.getId());
        return repository.save(account);
    }

    @Override
    @Transactional
    public Account archive(Long id) {
        Account account = getById(id);
        if (!account.isArchived()) {
            account.archive();
            repository.save(account);
            log.info("Account archived id={}", id);
        }
        return account;
    }

    @Override
    @Transactional
    public Account unarchive(Long id) {
        Account account = getById(id);
        if (account.isArchived()) {
            account.unarchive();
            repository.save(account);
            log.info("Account unarchived id={}", id);
        }
        return account;
    }

    /**
     * Soft delete. Financial records are never removed from the database - history
     * must survive so that corrections stay auditable. See ADR-0004.
     */
    @Override
    @Transactional
    public void delete(Long id) {
        Account account = getById(id);
        account.markDeleted();
        repository.save(account);
        log.info("Account soft-deleted id={}", id);
    }

    private void requireOpeningDateNotInFuture(LocalDate openingAsOf) {
        if (openingAsOf != null && openingAsOf.isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException(ErrorCode.OPENING_DATE_IN_FUTURE,
                    "That date is in the future. Use the date this balance was actually true.",
                    "openingAsOf");
        }
    }

    private ResourceNotFoundException notFound(Long id) {
        return new ResourceNotFoundException(ErrorCode.ACCOUNT_NOT_FOUND,
                "We couldn't find that account. It may have been deleted.");
    }

    private String blankToNull(String value) {
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
