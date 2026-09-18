package com.finance.projection;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.commitment.CommitmentInstanceService;
import com.finance.commitment.CommitmentService;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Today's Needs You says, for each bill, how much will be left in its account once it
 * leaves. That figure is only honest if it counts the bills due before it and none due
 * after, so order and running balance are what's tested here.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProjectionIntegrationTest {

    @Autowired
    private AccountService accountService;
    @Autowired
    private CommitmentService commitmentService;
    @Autowired
    private CommitmentInstanceService instanceService;
    @Autowired
    private CycleService cycleService;
    @Autowired
    private ProjectionService projectionService;

    private Cycle cycle;
    private int firstDay;
    private int laterDay;

    @BeforeEach
    void setUp() {
        cycle = cycleService.resolveCurrent();
        firstDay = cycle.getStartDate().getDayOfMonth();
        assumeTrue(firstDay <= 28, "cycle starts after the 28th");
        // The day after, wrapping into the next month - still inside the same cycle.
        laterDay = firstDay == 28 ? 1 : firstDay + 1;
    }

    private Account account(AccountType type, String balance) {
        return accountService.create(new CreateAccountRequest(
                "Projection Test " + type, type, null, null, null,
                new BigDecimal(balance), cycle.getStartDate().minusMonths(1),
                null, null, null, null, null, null, null));
    }

    private void addBill(String name, String amount, int dueDay, Account from) {
        commitmentService.create(new CreateCommitmentRequest(
                name, CommitmentAmountType.FIXED, new BigDecimal(amount),
                CommitmentFrequency.MONTHLY, dueDay, from.getId(), null,
                true, false, cycle.getStartDate(), null, null, null));
    }

    @Test
    @DisplayName("each bill shows the balance left after it and every earlier bill, in due-date order")
    void runningBalanceInDueDateOrder() {
        Account bank = account(AccountType.BANK, "50000.00");
        // Added later-first, so the order can only come from the due dates.
        addBill("Later bill", "30000.00", laterDay, bank);
        addBill("First bill", "25000.00", firstDay, bank);
        instanceService.listForCycle(cycle.getId()); // generates this cycle's occurrences

        ProjectionResult result = projectionService.projectAccount(bank.getId());

        assertThat(result.deductions()).extracting(ProjectionResult.Deduction::name)
                .containsExactly("First bill", "Later bill");
        ProjectionResult.Deduction first = result.deductions().get(0);
        ProjectionResult.Deduction later = result.deductions().get(1);
        assertThat(first.balanceAfter()).isEqualByComparingTo("25000.00");
        assertThat(first.covered()).isTrue();
        assertThat(later.balanceAfter()).isEqualByComparingTo("-5000.00");
        assertThat(later.covered()).isFalse();
        assertThat(result.projectedBalance()).isEqualByComparingTo("-5000.00");
        assertThat(result.shortfall()).isTrue();
    }

    @Test
    @DisplayName("a bill charged to a credit card has no 'covered' verdict - a negative card balance is normal")
    void cardBillsHaveNoCoverVerdict() {
        Account card = account(AccountType.CREDIT_CARD, "-1000.00");
        addBill("Card EMI", "2648.00", firstDay, card);
        instanceService.listForCycle(cycle.getId());

        ProjectionResult result = projectionService.projectAccount(card.getId());

        assertThat(result.deductions()).hasSize(1);
        assertThat(result.deductions().get(0).balanceAfter()).isEqualByComparingTo("-3648.00");
        assertThat(result.deductions().get(0).covered()).isNull();
        assertThat(result.shortfall()).isFalse();
    }
}
