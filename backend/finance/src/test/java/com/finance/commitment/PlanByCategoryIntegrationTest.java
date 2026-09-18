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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/** This Month groups its plan by category; the subtotals under each heading come from here. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PlanByCategoryIntegrationTest {

    @Autowired
    private AccountService accountService;
    @Autowired
    private CategoryService categoryService;
    @Autowired
    private CommitmentService commitmentService;
    @Autowired
    private CommitmentInstanceService instanceService;
    @Autowired
    private CycleService cycleService;

    private Cycle cycle;
    private int dueDay;
    private Account account;

    @BeforeEach
    void setUp() {
        cycle = cycleService.resolveCurrent();
        dueDay = cycle.getStartDate().getDayOfMonth();
        assumeTrue(dueDay <= 28, "cycle starts after the 28th");
        account = accountService.create(new CreateAccountRequest(
                "Plan Category Test Bank", AccountType.BANK, null, null, null,
                new BigDecimal("90000.00"), cycle.getStartDate().minusMonths(1),
                null, null, null, null, null, null, null));
    }

    private Long addBill(String name, String amount, Category category) {
        return commitmentService.create(new CreateCommitmentRequest(
                name, CommitmentAmountType.FIXED, new BigDecimal(amount),
                CommitmentFrequency.MONTHLY, dueDay, account.getId(), category == null ? null : category.getId(),
                true, false, cycle.getStartDate(), null, null, null)).commitment().getId();
    }

    @Test
    @DisplayName("bills are subtotalled per category, with uncategorised bills in their own group, last")
    void subtotalsPerCategory() {
        Category loans = categoryService.create(new CreateCategoryRequest("ZZ Plan Loans", CategoryGroup.FIXED, null, null));
        Category home = categoryService.create(new CreateCategoryRequest("ZZ Plan Home", CategoryGroup.FIXED, null, null));
        Long bikeEmi = addBill("Bike EMI", "6145.00", loans);
        addBill("Education EMI", "3417.00", loans);
        addBill("Home support", "10000.00", home);
        addBill("Haircut", "500.00", null);

        // Every bill the cycle holds is counted, so read the groups for this test's categories.
        CommitmentPlanProgress progress = instanceService.planProgress(cycle.getId());
        List<CommitmentPlanProgress.CategoryGroupTotal> groups = progress.byCategory();

        CommitmentPlanProgress.CategoryGroupTotal loanGroup = groupFor(groups, loans);
        assertThat(loanGroup.count()).isEqualTo(2);
        assertThat(loanGroup.plannedTotal()).isEqualByComparingTo("9562.00");
        assertThat(loanGroup.outstandingTotal()).isEqualByComparingTo("9562.00");
        assertThat(groupFor(groups, home).plannedTotal()).isEqualByComparingTo("10000.00");

        CommitmentPlanProgress.CategoryGroupTotal none = groups.get(groups.size() - 1);
        assertThat(none.category()).isNull();
        assertThat(none.count()).isGreaterThanOrEqualTo(1);

        // The rows carry the category too, so a row always sits under its own heading.
        CommitmentInstanceView bike = instanceService.listForCycle(cycle.getId()).stream()
                .filter(v -> v.commitment().getId().equals(bikeEmi))
                .findFirst().orElseThrow();
        assertThat(bike.category().getId()).isEqualTo(loans.getId());
    }

    private static CommitmentPlanProgress.CategoryGroupTotal groupFor(
            List<CommitmentPlanProgress.CategoryGroupTotal> groups, Category category) {
        return groups.stream()
                .filter(g -> g.category() != null && g.category().getId().equals(category.getId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no group for " + category.getName()));
    }
}
