package com.finance.reservation;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.reservation.domain.Reservation;
import com.finance.reservation.dto.CreateReservationRequest;
import com.finance.reservation.dto.UpdateReservationRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Business rules for reservations.
 *
 * <p>A reservation can never exceed what is actually held in the account - reserving
 * money that is not there would make "reserved" lie the same way an invented budget
 * does. Checked against {@code AccountBalanceCalculator}, not a stored balance.
 */
@Service
public class ReservationServiceImpl implements ReservationService {

    private static final Logger log = LoggerFactory.getLogger(ReservationServiceImpl.class);

    private final ReservationRepository repository;
    private final ReservationMapper mapper;
    private final AccountService accountService;
    private final AccountBalanceCalculator balanceCalculator;
    private final CurrentUserProvider currentUser;

    public ReservationServiceImpl(ReservationRepository repository,
                                  ReservationMapper mapper,
                                  AccountService accountService,
                                  AccountBalanceCalculator balanceCalculator,
                                  CurrentUserProvider currentUser) {
        this.repository = repository;
        this.mapper = mapper;
        this.accountService = accountService;
        this.balanceCalculator = balanceCalculator;
        this.currentUser = currentUser;
    }

    @Override
    @Transactional
    public ReservationView create(CreateReservationRequest request) {
        Long userId = currentUser.currentUserId();
        Account account = requireSpendableAccount(request.accountId());

        requireWithinBalance(account, request.amount(), BigDecimal.ZERO);

        Reservation saved = repository.save(mapper.toEntity(request, userId));
        log.info("Reservation created id={} accountId={}", saved.getId(), account.getId());
        return new ReservationView(saved, account);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationView getById(Long id) {
        Reservation reservation = requireOwned(id);
        return new ReservationView(reservation, accountService.getByIdIncludingDeleted(reservation.getAccountId()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReservationView> list(Pageable pageable) {
        return repository.findByUserIdAndDeletedAtIsNull(currentUser.currentUserId(), pageable)
                .map(r -> new ReservationView(r, accountService.getByIdIncludingDeleted(r.getAccountId())));
    }

    @Override
    @Transactional
    public ReservationView update(Long id, UpdateReservationRequest request) {
        Reservation reservation = requireOwned(id);
        Account account = accountService.getById(reservation.getAccountId());

        if (request.amount() != null) {
            requireWithinBalance(account, request.amount(), reservation.getAmount());
            reservation.setAmount(MoneyScale.normalise(request.amount()));
        }
        if (request.purpose() != null) {
            String purpose = request.purpose().trim();
            if (purpose.isEmpty()) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "A reservation needs to say what it's for.", "purpose");
            }
            reservation.setPurpose(purpose);
        }
        if (request.goalId() != null) {
            reservation.setGoalId(request.goalId());
        }

        Reservation saved = repository.save(reservation);
        log.info("Reservation updated id={}", saved.getId());
        return new ReservationView(saved, account);
    }

    @Override
    @Transactional
    public void release(Long id) {
        Reservation reservation = requireOwned(id);
        reservation.markDeleted();
        repository.save(reservation);
        log.info("Reservation released id={}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal totalReservedForUser() {
        return repository.sumReservedForUser(currentUser.currentUserId());
    }

    private Reservation requireOwned(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESERVATION_NOT_FOUND,
                        "We couldn't find that reservation. It may have been released."));
    }

    private Account requireSpendableAccount(Long accountId) {
        Account account = accountService.getById(accountId);
        if (account.isArchived()) {
            throw new BusinessRuleException(ErrorCode.ACCOUNT_ARCHIVED,
                    "That account is archived. Unarchive it first, or choose a different account.", "accountId");
        }
        if (!account.getType().isSpendable()) {
            throw new BusinessRuleException(ErrorCode.ACCOUNT_NOT_SPENDABLE,
                    "Only spendable money - a bank or cash account - can be reserved.", "accountId");
        }
        return account;
    }

    /**
     * A reservation can never exceed what the account actually holds. {@code ownAmount}
     * is the reservation's own current amount (already included in the account's
     * reserved total) so an update doesn't double-count it against itself; pass
     * {@link BigDecimal#ZERO} when creating a new one.
     */
    private void requireWithinBalance(Account account, BigDecimal requestedAmount, BigDecimal ownAmount) {
        BigDecimal othersReserved = repository.sumReservedForAccount(account.getId(), account.getUserId())
                .subtract(ownAmount);
        BigDecimal balance = balanceCalculator.currentBalance(account);
        BigDecimal totalAfter = othersReserved.add(requestedAmount);

        if (totalAfter.compareTo(balance) > 0) {
            throw new BusinessRuleException(ErrorCode.RESERVATION_EXCEEDS_BALANCE,
                    "That's more than this account actually holds once other reservations are counted.",
                    "amount");
        }
    }
}
