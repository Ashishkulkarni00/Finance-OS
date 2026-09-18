package com.finance.account;

import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.domain.BalanceConfidence;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.account.dto.UpdateAccountRequest;
import com.finance.common.exception.DuplicateResourceException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.FinanceException;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Business rules for accounts.
 *
 * <p>These protect behaviour, not coverage: name collisions, future-dated balances,
 * ownership isolation, immutable type, and soft deletion.
 */
class AccountServiceImplTest {

    private static final Long USER_ID = CurrentUserProvider.DEVELOPMENT_USER_ID;
    private static final LocalDate TODAY = LocalDate.of(2026, 9, 9);

    private AccountRepository repository;
    private AccountServiceImpl service;

    @BeforeEach
    void setUp() {
        repository = mock(AccountRepository.class);
        CurrentUserProvider currentUser = mock(CurrentUserProvider.class);
        when(currentUser.currentUserId()).thenReturn(USER_ID);

        Clock fixedClock = Clock.fixed(
                TODAY.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant(),
                ZoneId.of("Asia/Kolkata"));

        service = new AccountServiceImpl(
                repository,
                new AccountMapper(
                        new AccountBalanceCalculator(mock(com.finance.transaction.PostingRepository.class), fixedClock),
                        new AccountAvailableCalculator(mock(com.finance.reservation.ReservationRepository.class))),
                currentUser,
                fixedClock);
    }

    private CreateAccountRequest validRequest() {
        return new CreateAccountRequest(
                "HDFC Salary", AccountType.BANK, "HDFC", "1234", "INR",
                new BigDecimal("32000.00"), LocalDate.of(2026, 9, 6),
                BalanceConfidence.CONFIRMED, new BigDecimal("10000.00"), false,
                null, null, "Salary credit", 0);
    }

    private Account existing() {
        Account account = Account.builder()
                .id(1L).userId(USER_ID).name("HDFC Salary").type(AccountType.BANK)
                .openingBalance(new BigDecimal("32000.00"))
                .openingAsOf(LocalDate.of(2026, 9, 6))
                .openingConfidence(BalanceConfidence.CONFIRMED)
                .currency("INR").includeInSpendable(true).includeInNetWorth(true)
                .build();
        account.setCreatedAt(Instant.now());
        account.setUpdatedAt(Instant.now());
        return account;
    }

    @Nested
    @DisplayName("create")
    class Create {

        @Test
        @DisplayName("stamps the current user as owner")
        void assignsOwner() {
            when(repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(anyLong(), anyString()))
                    .thenReturn(false);
            when(repository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            Account created = service.create(validRequest());

            assertThat(created.getUserId()).isEqualTo(USER_ID);
            assertThat(created.getName()).isEqualTo("HDFC Salary");
        }

        @Test
        @DisplayName("normalises the opening balance to two decimal places")
        void normalisesMoney() {
            when(repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(anyLong(), anyString()))
                    .thenReturn(false);
            when(repository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            CreateAccountRequest request = new CreateAccountRequest(
                    "Cash", AccountType.CASH, null, null, null,
                    new BigDecimal("17000"), LocalDate.of(2026, 9, 6),
                    null, null, null, null, null, null, null);

            assertThat(service.create(request).getOpeningBalance())
                    .isEqualByComparingTo("17000.00")
                    .hasToString("17000.00");
        }

        @Test
        @DisplayName("rejects a duplicate name for the same user")
        void rejectsDuplicateName() {
            when(repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(USER_ID, "HDFC Salary"))
                    .thenReturn(true);

            assertThatThrownBy(() -> service.create(validRequest()))
                    .isInstanceOf(DuplicateResourceException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.ACCOUNT_NAME_TAKEN);

            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("rejects an opening date in the future")
        void rejectsFutureOpeningDate() {
            CreateAccountRequest request = new CreateAccountRequest(
                    "Future", AccountType.BANK, null, null, null,
                    new BigDecimal("100.00"), TODAY.plusDays(1),
                    null, null, null, null, null, null, null);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(FinanceException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.OPENING_DATE_IN_FUTURE);
        }

        @Test
        @DisplayName("accepts today as an opening date")
        void acceptsToday() {
            when(repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(anyLong(), anyString()))
                    .thenReturn(false);
            when(repository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            CreateAccountRequest request = new CreateAccountRequest(
                    "Today", AccountType.BANK, null, null, null,
                    new BigDecimal("100.00"), TODAY,
                    null, null, null, null, null, null, null);

            assertThat(service.create(request).getOpeningAsOf()).isEqualTo(TODAY);
        }

        @Test
        @DisplayName("a credit card may open with money owed")
        void allowsNegativeOpeningForLiabilities() {
            when(repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(anyLong(), anyString()))
                    .thenReturn(false);
            when(repository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            CreateAccountRequest request = new CreateAccountRequest(
                    "HDFC MoneyBack", AccountType.CREDIT_CARD, "HDFC", null, null,
                    new BigDecimal("-6375.00"), LocalDate.of(2026, 9, 6),
                    null, null, null, null, null, null, null);

            Account card = service.create(request);
            assertThat(card.getOpeningBalance()).isEqualByComparingTo("-6375.00");
            assertThat(card.getType().isLiability()).isTrue();
            assertThat(card.countsAsSpendable()).isFalse();
        }

        @Test
        @DisplayName("spendability defaults from the account type")
        void spendabilityDefaultsFromType() {
            when(repository.existsByUserIdAndNameIgnoreCaseAndDeletedAtIsNull(anyLong(), anyString()))
                    .thenReturn(false);
            when(repository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            CreateAccountRequest investment = new CreateAccountRequest(
                    "Zerodha", AccountType.INVESTMENT, null, null, null,
                    new BigDecimal("2500.00"), LocalDate.of(2026, 9, 6),
                    null, null, null, null, null, null, null);

            assertThat(service.create(investment).isIncludeInSpendable()).isFalse();
        }
    }

    @Nested
    @DisplayName("read and update")
    class ReadUpdate {

        @Test
        @DisplayName("another user's account is not found")
        void enforcesOwnership() {
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(99L, USER_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.ACCOUNT_NOT_FOUND);
        }

        @Test
        @DisplayName("null fields leave existing values untouched")
        void partialUpdateLeavesOtherFields() {
            Account account = existing();
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(1L, USER_ID))
                    .thenReturn(Optional.of(account));
            when(repository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            UpdateAccountRequest request = new UpdateAccountRequest(
                    null, null, null, new BigDecimal("25625.00"), null,
                    null, null, null, null, null, null, null);

            Account updated = service.update(1L, request);

            assertThat(updated.getOpeningBalance()).isEqualByComparingTo("25625.00");
            assertThat(updated.getName()).isEqualTo("HDFC Salary");
            assertThat(updated.getType()).isEqualTo(AccountType.BANK);
        }

        @Test
        @DisplayName("renaming onto another account's name is rejected")
        void rejectsRenameCollision() {
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(1L, USER_ID))
                    .thenReturn(Optional.of(existing()));
            when(repository.existsByNameForOtherAccount(USER_ID, "IDBI", 1L)).thenReturn(true);

            UpdateAccountRequest request = new UpdateAccountRequest(
                    "IDBI", null, null, null, null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> service.update(1L, request))
                    .isInstanceOf(DuplicateResourceException.class);
        }
    }

    @Nested
    @DisplayName("lifecycle")
    class Lifecycle {

        @Test
        @DisplayName("archiving keeps the row and stops it counting as spendable")
        void archiveIsReversibleAndExcludes() {
            Account account = existing();
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(1L, USER_ID))
                    .thenReturn(Optional.of(account));
            when(repository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            assertThat(service.archive(1L).isArchived()).isTrue();
            assertThat(account.countsAsSpendable()).isFalse();
            assertThat(service.unarchive(1L).isArchived()).isFalse();
            assertThat(account.countsAsSpendable()).isTrue();
        }

        @Test
        @DisplayName("delete is soft - financial history is never destroyed")
        void deleteIsSoft() {
            Account account = existing();
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(1L, USER_ID))
                    .thenReturn(Optional.of(account));
            when(repository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            service.delete(1L);

            assertThat(account.isDeleted()).isTrue();
            assertThat(account.getDeletedAt()).isNotNull();
            verify(repository, never()).delete(any());
            verify(repository, never()).deleteById(anyLong());
        }
    }
}
