package com.finance.commitment;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.category.CategoryService;
import com.finance.category.domain.CategoryGroup;
import com.finance.category.dto.CreateCategoryRequest;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.commitment.dto.SettleCommitmentInstanceRequest;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import com.finance.position.PositionService;
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
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Salary as an expected-income rule (FIX_BACKLOG 2.4, audit step 5): the month can be
 * planned against it before it lands, and once it lands what arrived replaces what was
 * expected - never both.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ExpectedIncomeIntegrationTest {

    @Autowired
    private AccountService accountService;
    @Autowired
    private CommitmentService commitmentService;
    @Autowired
    private CommitmentInstanceService instanceService;
    @Autowired
    private CycleService cycleService;
    @Autowired
    private PositionService positionService;
    @Autowired
    private TransactionService transactionService;
    @Autowired
    private CategoryService categoryService;

    private Cycle cycle;
    private int payDay;
    private Account salaryAccount;
    private Long salaryCategory;

    @BeforeEach
    void setUp() {
        cycle = cycleService.resolveCurrent();
        payDay = cycle.getStartDate().getDayOfMonth();
        assumeTrue(payDay <= 28, "cycle starts after the 28th");
        salaryAccount = accountService.create(new CreateAccountRequest(
                "Income Test Salary", AccountType.BANK, null, null, null, new BigDecimal("1000.00"),
                cycle.getStartDate().minusMonths(2), null, null, null, true, null, null, null));
        salaryCategory = categoryService.create(
                new CreateCategoryRequest("Income Test Salary", CategoryGroup.INCOME, null, null)).getId();
        instanceService.listForCycle(cycle.getId());
    }

    private Commitment salaryBill(String amount) {
        return commitmentService.create(new CreateCommitmentRequest(
                "Salary", CommitmentAmountType.FIXED, new BigDecimal(amount), CommitmentFrequency.MONTHLY, payDay,
                salaryAccount.getId(), salaryCategory, true, false, cycle.getStartDate(), null,
                null, null, TransactionType.INCOME, null, null, null)).commitment();
    }

    private Long receive(LocalDate date, String amount) {
        return transactionService.create(new CreateTransactionRequest(
                date, "Salary credit", TransactionType.INCOME, new BigDecimal(amount), salaryAccount.getId(), null,
                salaryCategory, null, null), null).transaction().getId();
    }

    private CommitmentInstance occurrenceOf(Long commitmentId) {
        return instanceService.listForCycle(cycle.getId()).stream()
                .map(CommitmentInstanceView::instance)
                .filter(i -> i.getCommitmentId().equals(commitmentId))
                .findFirst().orElseThrow();
    }

    @Test
    @DisplayName("expected salary counts in the month's standing until it lands, then the amount that landed replaces it")
    void expectedThenActualNeverBoth() {
        CycleStanding before = instanceService.standing(cycle.getId());
        CommitmentPlanProgress progressBefore = instanceService.planProgress(cycle.getId());

        Commitment bill = salaryBill("57700.00");

        CycleStanding planned = instanceService.standing(cycle.getId());
        assertThat(planned.incomeTotal().subtract(before.incomeTotal())).isEqualByComparingTo("57700.00");
        assertThat(planned.incomeExpectedTotal().subtract(before.incomeExpectedTotal())).isEqualByComparingTo("57700.00");
        // Not a bill: nothing more is committed, and it isn't counted among the bills.
        assertThat(planned.committedTotal()).isEqualByComparingTo(before.committedTotal());
        CommitmentPlanProgress progress = instanceService.planProgress(cycle.getId());
        assertThat(progress.totalCount()).isEqualTo(progressBefore.totalCount());
        assertThat(progress.incomeCount()).isEqualTo(progressBefore.incomeCount() + 1);

        // A little less than expected is still the salary - and it's received, not part-received.
        receive(cycle.getStartDate(), "56900.00");

        CommitmentInstance received = occurrenceOf(bill.getId());
        assertThat(received.getStatus()).isEqualTo(CommitmentInstanceStatus.PAID);
        assertThat(received.getConfirmedAmount()).isEqualByComparingTo("56900.00");
        CycleStanding actual = instanceService.standing(cycle.getId());
        assertThat(actual.incomeTotal().subtract(before.incomeTotal())).isEqualByComparingTo("56900.00");
        assertThat(actual.incomeExpectedTotal()).isEqualByComparingTo(before.incomeExpectedTotal());
    }

    @Test
    @DisplayName("expected salary is not spendable: Real Balance doesn't count it before it lands")
    void expectedIncomeIsNotSpendable() {
        assumeTrue(positionService.currentPosition().complete(), "another bill in the test database has no amount");
        BigDecimal before = positionService.currentPosition().held();
        BigDecimal committedBefore = positionService.currentPosition().committed();
        salaryBill("57700.00");
        assertThat(positionService.currentPosition().held()).isEqualByComparingTo(before);
        assertThat(positionService.currentPosition().committed()).isEqualByComparingTo(committedBefore);
    }

    @Test
    @DisplayName("a salary that lands two days early still belongs to the cycle it starts, and is counted there once")
    void earlySalaryMatchesTheCycleItStarts() {
        Cycle previous = cycleService.resolveForDate(cycle.getStartDate().minusDays(2));
        CycleStanding previousBefore = instanceService.standing(previous.getId());
        CycleStanding before = instanceService.standing(cycle.getId());
        Commitment bill = salaryBill("57700.00");

        receive(cycle.getStartDate().minusDays(2), "57700.00");

        assertThat(occurrenceOf(bill.getId()).getStatus()).isEqualTo(CommitmentInstanceStatus.PAID);
        CycleStanding after = instanceService.standing(cycle.getId());
        assertThat(after.incomeTotal().subtract(before.incomeTotal())).isEqualByComparingTo("57700.00");
        assertThat(after.incomeExpectedTotal()).isEqualByComparingTo(before.incomeExpectedTotal());
        // ...and not in the cycle it happened to be dated in.
        assertThat(instanceService.standing(previous.getId()).incomeTotal())
                .isEqualByComparingTo(previousBefore.incomeTotal());
    }

    @Test
    @DisplayName("income far from the expected salary isn't matched on its own - and income no rule expects still counts")
    void farOffIncomeIsLeftAlone() {
        CycleStanding before = instanceService.standing(cycle.getId());
        Commitment bill = salaryBill("57700.00");

        Long bonus = receive(cycle.getStartDate(), "20000.00");

        CommitmentInstance open = occurrenceOf(bill.getId());
        assertThat(open.getStatus()).isNotEqualTo(CommitmentInstanceStatus.PAID);
        CycleStanding after = instanceService.standing(cycle.getId());
        // The expected salary plus the unlinked credit.
        assertThat(after.incomeTotal().subtract(before.incomeTotal())).isEqualByComparingTo("77700.00");

        // Linked by hand, it's the salary: received in full, no longer extra.
        CommitmentInstance linked = instanceService.settle(open.getId(),
                new SettleCommitmentInstanceRequest(bonus, new BigDecimal("20000.00"))).instance();
        assertThat(linked.getStatus()).isEqualTo(CommitmentInstanceStatus.PAID);
        assertThat(instanceService.standing(cycle.getId()).incomeTotal().subtract(before.incomeTotal()))
                .isEqualByComparingTo("20000.00");
    }
}
