package com.finance.card;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.card.domain.DebitCard;
import com.finance.card.dto.CreateDebitCardRequest;
import com.finance.card.dto.UpdateDebitCardRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Debit cards belong to a bank account. They have no balance and change nothing that is
 * calculated - a spend on one is an expense from its bank account.
 */
@Service
public class DebitCardServiceImpl implements DebitCardService {

    private static final Logger log = LoggerFactory.getLogger(DebitCardServiceImpl.class);

    private final DebitCardRepository repository;
    private final AccountService accountService;
    private final CurrentUserProvider currentUser;

    public DebitCardServiceImpl(DebitCardRepository repository, AccountService accountService, CurrentUserProvider currentUser) {
        this.repository = repository;
        this.accountService = accountService;
        this.currentUser = currentUser;
    }

    @Override
    @Transactional
    public DebitCardView create(CreateDebitCardRequest request) {
        Account account = requireBankAccount(request.accountId());
        DebitCard saved = repository.save(DebitCard.builder()
                .userId(currentUser.currentUserId())
                .accountId(account.getId())
                .name(request.name().trim())
                .network(request.network())
                .lastFour(request.lastFour())
                .build());
        log.info("Debit card created id={} accountId={}", saved.getId(), account.getId());
        return new DebitCardView(saved, account);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebitCardView> list() {
        return repository.findByUserIdAndDeletedAtIsNullOrderByNameAsc(currentUser.currentUserId()).stream()
                .map(card -> new DebitCardView(card, accountService.getByIdIncludingDeleted(card.getAccountId())))
                .toList();
    }

    @Override
    @Transactional
    public DebitCardView update(Long id, UpdateDebitCardRequest request) {
        DebitCard card = requireOwned(id);

        if (request.accountId() != null) {
            card.setAccountId(requireBankAccount(request.accountId()).getId());
        }
        if (request.name() != null) {
            if (request.name().isBlank()) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "A card needs a name you'll recognise.", "name");
            }
            card.setName(request.name().trim());
        }
        if (Boolean.TRUE.equals(request.clearNetwork())) {
            card.setNetwork(null);
        } else if (request.network() != null) {
            card.setNetwork(request.network());
        }
        if (Boolean.TRUE.equals(request.clearLastFour())) {
            card.setLastFour(null);
        } else if (request.lastFour() != null) {
            card.setLastFour(request.lastFour());
        }

        DebitCard saved = repository.save(card);
        log.info("Debit card updated id={}", id);
        return new DebitCardView(saved, accountService.getByIdIncludingDeleted(saved.getAccountId()));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        DebitCard card = requireOwned(id);
        card.markDeleted();
        repository.save(card);
        log.info("Debit card deleted id={}", id);
    }

    private Account requireBankAccount(Long accountId) {
        Account account = accountService.getById(accountId);
        if (account.getType() != AccountType.BANK) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                    "A debit card spends from a bank account - pick one of your bank accounts.", "accountId");
        }
        return account;
    }

    private DebitCard requireOwned(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "That debit card doesn't exist."));
    }
}
