package com.finance.transaction;

import com.finance.account.AccountMapper;
import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.category.CategoryMapper;
import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.category.domain.CategoryGroup;
import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.FinanceException;
import com.finance.common.exception.IdempotencyConflictException;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.idempotency.IdempotencyService;
import com.finance.common.user.CurrentUserProvider;
import com.finance.transaction.domain.Posting;
import com.finance.transaction.domain.Transaction;
import com.finance.transaction.domain.TransactionType;
import com.finance.transaction.dto.CreateTransactionRequest;
import com.finance.transaction.dto.UpdateTransactionRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Business rules for transactions - the money-integrity core of milestone 2.
 *
 * <p>These protect the must-have cases from {@code TECHNICAL_ARCHITECTURE.md} §5: a
 * card purchase counts once, a cash withdrawal counts once at the spend, a transfer is
 * neither income nor expense, and postings always sum to zero. The heavier claim -
 * that the account balance itself ends up correct - is proved separately by
 * {@code TransactionMoneyIntegrationTest} against real MySQL, since this class mocks
 * the posting sum entirely.
 */
class TransactionServiceImplTest {

    private static final Long USER_ID = CurrentUserProvider.DEVELOPMENT_USER_ID;
    private static final LocalDate TODAY = LocalDate.of(2026, 9, 9);

    private TransactionRepository repository;
    private PostingRepository postingRepository;
    private AccountService accountService;
    private CategoryService categoryService;
    private IdempotencyService idempotencyService;
    private TransactionServiceImpl service;

    @BeforeEach
    void setUp() {
        repository = mock(TransactionRepository.class);
        postingRepository = mock(PostingRepository.class);
        accountService = mock(AccountService.class);
        categoryService = mock(CategoryService.class);
        idempotencyService = mock(IdempotencyService.class);
        CurrentUserProvider currentUser = mock(CurrentUserProvider.class);
        when(currentUser.currentUserId()).thenReturn(USER_ID);

        Clock fixedClock = Clock.fixed(
                TODAY.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant(),
                ZoneId.of("Asia/Kolkata"));
        AccountMapper accountMapper = new AccountMapper(
                new AccountBalanceCalculator(mock(PostingRepository.class), fixedClock),
                new com.finance.account.AccountAvailableCalculator(
                        mock(com.finance.reservation.ReservationRepository.class)));
        TransactionMapper mapper = new TransactionMapper(accountMapper, new CategoryMapper());

        // No replay/conflict by default - individual tests override this.
        when(idempotencyService.findExistingTransaction(anyLong(), any(), any())).thenReturn(Optional.empty());

        service = new TransactionServiceImpl(repository, postingRepository, new PostingFactory(), mapper,
                accountService, categoryService, idempotencyService,
                mock(com.finance.commitment.CommitmentAutoMatcher.class), currentUser,
                mock(com.finance.cycle.CycleService.class));
    }

    private Account account(Long id, AccountType type, boolean archived) {
        Account account = Account.builder()
                .id(id).userId(USER_ID).name("Account " + id).type(type)
                .openingBalance(new BigDecimal("1000.00")).openingAsOf(LocalDate.of(2026, 9, 1))
                .currency("INR").includeInSpendable(true).includeInNetWorth(true)
                .build();
        if (archived) {
            account.archive();
        }
        return account;
    }

    private Category category(Long id, boolean archived) {
        Category category = Category.builder()
                .id(id).userId(USER_ID).name("Category " + id).group(CategoryGroup.FLEXIBLE)
                .systemDefined(false).build();
        if (archived) {
            category.archive();
        }
        return category;
    }

    private CreateTransactionRequest request(TransactionType type, Long accountId, Long toAccountId, Long categoryId) {
        return new CreateTransactionRequest(TODAY, "Test transaction", type, new BigDecimal("100.00"),
                accountId, toAccountId, categoryId, null, null);
    }

    private void stubSave() {
        when(repository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction tx = invocation.getArgument(0);
            if (tx.getId() == null) {
                tx.setId(500L);
            }
            return tx;
        });
    }

    @Nested
    @DisplayName("money integrity - the must-have cases")
    class MoneyIntegrity {

        @Test
        @DisplayName("a card purchase counts as spending, posted against the card account")
        void cardPurchaseCountsAsSpending() {
            when(accountService.getById(2L)).thenReturn(account(2L, AccountType.CREDIT_CARD, false));
            when(categoryService.getById(9L)).thenReturn(category(9L, false));
            stubSave();

            TransactionView view = service.create(request(TransactionType.EXPENSE, 2L, null, 9L), null);

            assertThat(view.transaction().getType().countsAsSpending()).isTrue();

            ArgumentCaptor<List<Posting>> captor = ArgumentCaptor.forClass(List.class);
            verify(postingRepository).saveAll(captor.capture());
            assertThat(captor.getValue()).hasSize(1);
            assertThat(captor.getValue().get(0).getAccountId()).isEqualTo(2L);
            assertThat(captor.getValue().get(0).getAmount()).isEqualByComparingTo("-100.00");
        }

        @Test
        @DisplayName("paying the card bill is a transfer, not a second expense")
        void cardBillPaymentIsATransferNotAnExpense() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));
            when(accountService.getById(2L)).thenReturn(account(2L, AccountType.CREDIT_CARD, false));
            stubSave();

            TransactionView view = service.create(request(TransactionType.TRANSFER, 1L, 2L, null), null);

            assertThat(view.transaction().getType().countsAsSpending()).isFalse();
            assertThat(view.category()).isNull();

            ArgumentCaptor<List<Posting>> captor = ArgumentCaptor.forClass(List.class);
            verify(postingRepository).saveAll(captor.capture());
            assertThat(captor.getValue()).hasSize(2);
            assertThat(captor.getValue()).anySatisfy(p -> {
                assertThat(p.getAccountId()).isEqualTo(1L);
                assertThat(p.getAmount()).isEqualByComparingTo("-100.00");
            });
            assertThat(captor.getValue()).anySatisfy(p -> {
                assertThat(p.getAccountId()).isEqualTo(2L);
                assertThat(p.getAmount()).isEqualByComparingTo("100.00");
            });
        }

        @Test
        @DisplayName("a cash withdrawal is a transfer - not spending until the cash is actually spent")
        void cashWithdrawalIsNotSpending() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));
            when(accountService.getById(3L)).thenReturn(account(3L, AccountType.CASH, false));
            stubSave();

            TransactionView view = service.create(request(TransactionType.TRANSFER, 1L, 3L, null), null);

            assertThat(view.transaction().getType().countsAsSpending()).isFalse();
        }

        @Test
        @DisplayName("an investment is neither income nor expense")
        void investmentIsNotSpending() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));
            when(accountService.getById(4L)).thenReturn(account(4L, AccountType.INVESTMENT, false));
            stubSave();

            TransactionView view = service.create(request(TransactionType.INVESTMENT, 1L, 4L, null), null);

            assertThat(view.transaction().getType().countsAsSpending()).isFalse();
        }

        @Test
        @DisplayName("every generated posting list sums to zero, for whichever type was created")
        void postingsAlwaysSumToZero() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));
            when(accountService.getById(4L)).thenReturn(account(4L, AccountType.INVESTMENT, false));
            stubSave();

            service.create(request(TransactionType.INVESTMENT, 1L, 4L, null), null);

            ArgumentCaptor<List<Posting>> captor = ArgumentCaptor.forClass(List.class);
            verify(postingRepository).saveAll(captor.capture());
            BigDecimal sum = captor.getValue().stream().map(Posting::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            assertThat(sum).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("validation")
    class Validation {

        @Test
        @DisplayName("a transfer without a destination is rejected")
        void destinationRequired() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));

            assertThatThrownBy(() -> service.create(request(TransactionType.TRANSFER, 1L, null, null), null))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.DESTINATION_REQUIRED);
        }

        @Test
        @DisplayName("an expense with a destination is rejected")
        void destinationNotAllowed() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));

            assertThatThrownBy(() -> service.create(request(TransactionType.EXPENSE, 1L, 2L, 9L), null))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.DESTINATION_NOT_ALLOWED);
        }

        @Test
        @DisplayName("an expense without a category is rejected")
        void categoryRequired() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));

            assertThatThrownBy(() -> service.create(request(TransactionType.EXPENSE, 1L, null, null), null))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.CATEGORY_REQUIRED);
        }

        @Test
        @DisplayName("a transfer with a category is rejected - it would silently inflate a category total")
        void categoryNotAllowed() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));
            when(accountService.getById(2L)).thenReturn(account(2L, AccountType.CREDIT_CARD, false));

            assertThatThrownBy(() -> service.create(request(TransactionType.TRANSFER, 1L, 2L, 9L), null))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.CATEGORY_NOT_ALLOWED);
        }

        @Test
        @DisplayName("money can't move from an account to itself")
        void rejectsSameAccountTransfer() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));

            assertThatThrownBy(() -> service.create(request(TransactionType.TRANSFER, 1L, 1L, null), null))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.TRANSFER_SAME_ACCOUNT);
        }

        @Test
        @DisplayName("an archived account cannot receive a new transaction")
        void rejectsArchivedAccount() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, true));

            assertThatThrownBy(() -> service.create(request(TransactionType.EXPENSE, 1L, null, 9L), null))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.ACCOUNT_ARCHIVED);
        }

        @Test
        @DisplayName("an archived category cannot be assigned")
        void rejectsArchivedCategory() {
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));
            when(categoryService.getById(9L)).thenReturn(category(9L, true));

            assertThatThrownBy(() -> service.create(request(TransactionType.EXPENSE, 1L, null, 9L), null))
                    .isInstanceOf(BusinessRuleException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.CATEGORY_ARCHIVED);
        }

        @Test
        @DisplayName("another user's transaction is not found")
        void enforcesOwnership() {
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(99L, USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .extracting(e -> ((FinanceException) e).getCode())
                    .isEqualTo(ErrorCode.TRANSACTION_NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("idempotency")
    class Idempotency {

        @Test
        @DisplayName("a repeated key with the same body replays the original transaction")
        void replaysOnRepeatedKey() {
            Transaction original = Transaction.builder()
                    .id(42L).userId(USER_ID).date(TODAY).type(TransactionType.EXPENSE)
                    .description("Original").amount(new BigDecimal("99.00")).accountId(1L).categoryId(9L)
                    .build();
            when(idempotencyService.findExistingTransaction(eq(USER_ID), eq("demo-key"), any()))
                    .thenReturn(Optional.of(42L));
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(42L, USER_ID)).thenReturn(Optional.of(original));
            when(accountService.getByIdIncludingDeleted(1L)).thenReturn(account(1L, AccountType.BANK, false));
            when(categoryService.getByIdIncludingDeleted(9L)).thenReturn(category(9L, false));

            TransactionView view = service.create(request(TransactionType.EXPENSE, 1L, null, 9L), "demo-key");

            assertThat(view.transaction().getId()).isEqualTo(42L);
            verify(repository, never()).save(any());
            verify(postingRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("a repeated key with a different body is a conflict, not a replay")
        void conflictsOnDifferentBody() {
            when(idempotencyService.findExistingTransaction(eq(USER_ID), eq("demo-key"), any()))
                    .thenThrow(new IdempotencyConflictException("reused with a different body"));

            assertThatThrownBy(() -> service.create(request(TransactionType.EXPENSE, 1L, null, 9L), "demo-key"))
                    .isInstanceOf(IdempotencyConflictException.class);

            verify(repository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("update")
    class Update {

        @Test
        @DisplayName("changing type from TRANSFER to EXPENSE drops the now-invalid destination")
        void typeChangeDropsInapplicableFields() {
            Transaction existing = Transaction.builder()
                    .id(7L).userId(USER_ID).date(TODAY).type(TransactionType.TRANSFER)
                    .description("Withdrawal").amount(new BigDecimal("100.00")).accountId(1L).toAccountId(3L)
                    .build();
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(7L, USER_ID)).thenReturn(Optional.of(existing));
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));
            when(categoryService.getById(9L)).thenReturn(category(9L, false));
            stubSave();

            UpdateTransactionRequest request = new UpdateTransactionRequest(
                    null, null, TransactionType.EXPENSE, null, null, null, 9L, null, null);

            TransactionView view = service.update(7L, request);

            assertThat(view.transaction().getToAccountId()).isNull();
            assertThat(view.transaction().getType()).isEqualTo(TransactionType.EXPENSE);
        }

        @Test
        @DisplayName("postings are regenerated: old ones deleted, new ones created")
        void regeneratesPostings() {
            Transaction existing = Transaction.builder()
                    .id(7L).userId(USER_ID).date(TODAY).type(TransactionType.EXPENSE)
                    .description("Groceries").amount(new BigDecimal("100.00")).accountId(1L).categoryId(9L)
                    .build();
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(7L, USER_ID)).thenReturn(Optional.of(existing));
            when(accountService.getById(1L)).thenReturn(account(1L, AccountType.BANK, false));
            when(categoryService.getById(9L)).thenReturn(category(9L, false));
            stubSave();

            UpdateTransactionRequest request = new UpdateTransactionRequest(
                    null, null, null, new BigDecimal("150.00"), null, null, null, null, null);

            service.update(7L, request);

            verify(postingRepository).deleteByTransactionId(7L);
            verify(postingRepository).saveAll(any());
        }
    }

    @Nested
    @DisplayName("delete")
    class Delete {

        @Test
        @DisplayName("delete is soft - financial records are never destroyed")
        void deleteIsSoft() {
            Transaction existing = Transaction.builder()
                    .id(7L).userId(USER_ID).date(TODAY).type(TransactionType.EXPENSE)
                    .description("Groceries").amount(new BigDecimal("100.00")).accountId(1L).categoryId(9L)
                    .build();
            when(repository.findByIdAndUserIdAndDeletedAtIsNull(7L, USER_ID)).thenReturn(Optional.of(existing));
            when(repository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            service.delete(7L);

            assertThat(existing.isDeleted()).isTrue();
            verify(repository, never()).delete(any());
            verify(repository, never()).deleteById(anyLong());
        }
    }
}
