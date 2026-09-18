package com.finance.commitment;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.category.CategoryService;
import com.finance.category.domain.Category;
import com.finance.category.domain.CategoryGroup;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.commitment.dto.UpdateCommitmentRequest;
import com.finance.common.exception.BusinessRuleException;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import com.finance.transaction.TransactionService;
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
 * Editing a bill: the change reaches the months that haven't been paid, and never the ones
 * that have. Against a real database, because occurrences copy the rule's figures when
 * generated and the behaviour is the reconciliation in {@code listForCycle}.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CommitmentEditIntegrationTest {

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
    private Category category;

    @BeforeEach
    void setUp() {
        cycle = cycleService.resolveCurrent();
        dueDay = cycle.getStartDate().getDayOfMonth();
        // Due days are capped at 28 - a cycle starting on the 29th-31st can't put a bill on its first day.
        assumeTrue(dueDay <= 28, "cycle starts after the 28th");

        account = accountService.create(new CreateAccountRequest(
                "Edit Bill Test Bank", AccountType.BANK, null, null, null,
                new BigDecimal("50000.00"), cycle.getStartDate().minusMonths(1),
                null, null, null, null, null, null, null));
        category = categoryService.create(new CreateCategoryRequest("Edit Bill Test Rent", CategoryGroup.FIXED, null, null));
    }

    private Long addBill(String amount) {
        return commitmentService.create(new CreateCommitmentRequest(
                "Rent", CommitmentAmountType.FIXED, new BigDecimal(amount),
                CommitmentFrequency.MONTHLY, dueDay, account.getId(), category.getId(),
                true, false, cycle.getStartDate(), null, null, null)).commitment().getId();
    }

    private static UpdateCommitmentRequest edit(CommitmentAmountType type, String amount, Integer dueDay,
                                                LocalDate activeTo, Boolean clearActiveTo, Boolean clearCategory) {
        return new UpdateCommitmentRequest(null, type, amount == null ? null : new BigDecimal(amount), null, dueDay,
                null, null, null, null, null, activeTo, null, null, clearActiveTo, clearCategory, null, null, null);
    }

    private CommitmentInstance occurrenceOf(Long commitmentId) {
        return instanceService.listForCycle(cycle.getId()).stream()
                .map(CommitmentInstanceView::instance)
                .filter(i -> i.getCommitmentId().equals(commitmentId))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no occurrence for commitment " + commitmentId));
    }

    @Test
    @DisplayName("a new amount and due day reach this month's unpaid bill")
    void editReachesUnpaidOccurrence() {
        Long billId = addBill("15000.00");
        assertThat(occurrenceOf(billId).getExpectedAmount()).isEqualByComparingTo("15000.00");

        int newDay = dueDay == 10 ? 11 : 10;
        commitmentService.update(billId, edit(null, "16000.00", newDay, null, null, null));

        CommitmentInstance occurrence = occurrenceOf(billId);
        assertThat(occurrence.getExpectedAmount()).isEqualByComparingTo("16000.00");
        // The cycle's own pivot: a day before the cycle's start day falls in the following month.
        LocalDate expectedDue = newDay >= dueDay
                ? cycle.getStartDate().withDayOfMonth(newDay)
                : cycle.getStartDate().plusMonths(1).withDayOfMonth(newDay);
        assertThat(occurrence.getDueDate()).isEqualTo(expectedDue);
    }

    @Test
    @DisplayName("a month already paid keeps what was recorded when the bill is edited")
    void editLeavesPaidOccurrenceAlone() {
        transactionService.create(new CreateTransactionRequest(
                cycle.getStartDate(), "Rent paid", TransactionType.EXPENSE,
                new BigDecimal("15000.00"), account.getId(), null, category.getId(), null, null), null);
        Long billId = addBill("15000.00");
        assertThat(occurrenceOf(billId).getStatus()).isEqualTo(CommitmentInstanceStatus.PAID);

        commitmentService.update(billId, edit(null, "16000.00", null, null, null, null));

        CommitmentInstance paid = occurrenceOf(billId);
        assertThat(paid.getExpectedAmount()).isEqualByComparingTo("15000.00");
        assertThat(paid.getStatus()).isEqualTo(CommitmentInstanceStatus.PAID);
    }

    @Test
    @DisplayName("a bill can switch to 'varies', lose its end date and its category")
    void switchesAndClears() {
        Long billId = addBill("15000.00");
        commitmentService.update(billId, edit(null, null, null, cycle.getStartDate().plusYears(2), null, null));

        Commitment rule = commitmentService.update(billId, edit(CommitmentAmountType.VARIABLE, null, null, null, true, true)).commitment();

        assertThat(rule.getAmountType()).isEqualTo(CommitmentAmountType.VARIABLE);
        assertThat(rule.getFixedAmount()).isNull();
        assertThat(rule.getActiveTo()).isNull();
        assertThat(rule.getCategoryId()).isNull();
    }

    @Test
    @DisplayName("the last payment can't be set before the bill starts")
    void endBeforeStartIsRejected() {
        Long billId = addBill("15000.00");

        assertThatThrownBy(() -> commitmentService.update(billId,
                edit(null, null, null, cycle.getStartDate().minusDays(1), null, null)))
                .isInstanceOf(BusinessRuleException.class);
    }
}
