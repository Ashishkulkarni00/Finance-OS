package com.finance.reservation;

import com.finance.account.AccountMapper;
import com.finance.account.domain.Account;
import com.finance.reservation.domain.Reservation;
import com.finance.reservation.dto.CreateReservationRequest;
import com.finance.reservation.dto.ReservationResponse;
import org.springframework.stereotype.Component;

@Component
public class ReservationMapper {

    private final AccountMapper accountMapper;

    public ReservationMapper(AccountMapper accountMapper) {
        this.accountMapper = accountMapper;
    }

    public Reservation toEntity(CreateReservationRequest request, Long userId) {
        return Reservation.builder()
                .userId(userId)
                .accountId(request.accountId())
                .amount(request.amount())
                .purpose(request.purpose().trim())
                .goalId(request.goalId())
                .build();
    }

    public ReservationResponse toResponse(Reservation reservation, Account account) {
        return new ReservationResponse(
                reservation.getId(),
                accountMapper.toSummary(account),
                reservation.getAmount(),
                reservation.getPurpose(),
                reservation.getGoalId(),
                reservation.getCreatedAt(),
                reservation.getUpdatedAt(),
                // Reads report no effect; a write attaches its own (ADR-0017).
                null
        );
    }
}
