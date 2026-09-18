package com.finance.commitment;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.category.domain.CategoryGroup;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.commitment.dto.SettleCommitmentInstanceRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import com.finance.transaction.TransactionService;
import com.finance.transaction.domain.Transaction;
import com.finance.transaction.domain.TransactionType;
import com.finance.transaction.dto.CreateTransactionRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * A bill recorded after the fact - "I forgot to add rent, and I've already paid it" -
 * against a real database, because the behaviour lives in a JPQL "not already linked"
 * subquery and a cross-service generate-then-match sequence that mocks would only restate.
 *
 * <p>Every test uses the current cycle and puts the bill's due date on the cycle's first
 * day: always in the past (or today), so this is genuinely the late-added case whatever
 * day the suite runs on. Each test rolls back.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CommitmentLateBillIntegrationTest {

    @Autowired
    private AccountService accountService;
    @Autowired
    private CategoryService categoryService;
    @Autowired
    private TransactionService transactionService;
    @Autowired
    private CommitmentService commitmentService;
    @Autowired
    private CommitmentInstanceService instanceService;
    @Autowired
    private CycleService cycleService;

    private Cycle cycle;
    private int dueDay;
    private Account account;
    private Category rentCategory;

    @BeforeEach
    void setUp() {
        cycle = cycleService.resolveCurrent();
        dueDay = cycle.getStartDate().getDayOfMonth();
        // Commitment due days are capped at 28 (CreateCommitmentRequest). A cycle starting on
        // the 29th-31st can't put a due date on its own first day, so the premise doesn't hold.
        assumeTrue(dueDay <= 28, "cycle starts after the 28th - no due day lands on its first day");

        account = accountService.create(new CreateAccountRequest(
                "Late Bill Test Bank", AccountType.BANK, null, null, null,
                new BigDecimal("50000.00"), cycle.getStartDate().minusMonths(1),
                null, null, null, null, null, null, null));
        rentCategory = categoryService.create(
                new CreateCategoryRequest("Late Bill Test Rent", CategoryGroup.FIXED, null, null));
    }

    private Transaction pay(String amount, Long categoryId) {
        return transactionService.create(new CreateTransactionRequest(
                cycle.getStartDate(), "Paid before the bill was added", TransactionType.EXPENSE,
                new BigDecimal(amount), account.getId(), null, categoryId, null, null), null).transaction();
    }

    private Long addBill(String name, CommitmentAmountType type, String fixedAmount, Long categoryId) {
        return commitmentService.create(new CreateCommitmentRequest(
                name, type, fixedAmount == null ? null : new BigDecimal(fixedAmount),
                CommitmentFrequency.MONTHLY, dueDay, account.getId(), categoryId,
                true, false, cycle.getStartDate(), null, null, null)).commitment().getId();
    }

    private CommitmentInstance occurrenceOf(Long commitmentId) {
        return instanceService.listForCycle(cycle.getId()).stream()
                .map(CommitmentInstanceView::instance)
                .filter(i -> i.getCommitmentId().equals(commitmentId))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no occurrence generated for commitment " + commitmentId));
    }

    @Test
    @DisplayName("a bill added after it was paid is linked to the payment already in the Ledger - counted once")
    void lateBillLinksToExistingPayment() {
        Transaction rent = pay("15000.00", rentCategory.getId());

        Long billId = addBill("Rent", CommitmentAmountType.FIXED, "15000.00", rentCategory.getId());
        CommitmentInstance occurrence = occurrenceOf(billId);

        // The bill for this cycle exists even though its due date had passed when it was added...
        assertThat(occurrence.getDueDate()).isEqualTo(cycle.getStartDate());
        // ...and it is settled by the payment that was already recorded, not left owing
        // (which would invite recording the same ₹15,000 a second time).
        assertThat(occurrence.getLinkedTransactionId()).isEqualTo(rent.getId());
        assertThat(occurrence.getStatus()).isEqualTo(CommitmentInstanceStatus.PAID);
    }

    @Test
    @DisplayName("a variable bill with no category is never linked to whatever else was spent around its date")
    void variableBillWithoutCategoryIsNotGuessed() {
        // Any categorised expense near the due date - the bill itself has no category.
        pay("400.00", rentCategory.getId());

        Long billId = addBill("Electricity", CommitmentAmountType.VARIABLE, null, null);
        CommitmentInstance occurrence = occurrenceOf(billId);

        // No amount to compare and no category to agree on: the one nearby expense is not
        // evidence this bill was paid. Left for the user to settle or link.
        assertThat(occurrence.getLinkedTransactionId()).isNull();
        assertThat(occurrence.getStatus()).isIn(CommitmentInstanceStatus.PENDING, CommitmentInstanceStatus.OVERDUE);
    }

    @Test
    @DisplayName("one payment cannot settle two bills")
    void paymentAlreadyLinkedCannotSettleAnotherBill() {
        Transaction rent = pay("15000.00", rentCategory.getId());
        addBill("Rent", CommitmentAmountType.FIXED, "15000.00", rentCategory.getId());

        // A different amount, so the second bill doesn't auto-match anything itself.
        Long otherBillId = addBill("Maintenance", CommitmentAmountType.FIXED, "2000.00", rentCategory.getId());
        CommitmentInstance other = occurrenceOf(otherBillId);
        assertThat(other.getLinkedTransactionId()).isNull();

        assertThatThrownBy(() -> instanceService.settle(other.getId(),
                new SettleCommitmentInstanceRequest(rent.getId(), new BigDecimal("15000.00"))))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already pays another bill");
    }
}
