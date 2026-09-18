package com.finance.position;

import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.commitment.CommitmentInstanceService;
import com.finance.commitment.CommitmentInstanceView;
import com.finance.commitment.CommitmentService;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.commitment.dto.CreateCommitmentRequest;
import com.finance.common.exception.BusinessRuleException;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * A planned bill is spoken-for money whether or not it's a must-pay, so it reduces Real
 * Balance until it's paid - or, for an optional bill, until it's skipped for the cycle.
 * Compared as differences, so whatever else the test database holds doesn't matter.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OptionalBillsIntegrationTest {

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

    private Cycle cycle;
    private int dueDay;
    private Account bank;

    @BeforeEach
    void setUp() {
        cycle = cycleService.resolveCurrent();
        dueDay = cycle.getStartDate().getDayOfMonth();
        assumeTrue(dueDay <= 28, "cycle starts after the 28th");
        bank = accountService.create(new CreateAccountRequest(
                "Optional Bills Test Bank", AccountType.BANK, null, null, null,
                new BigDecimal("50000.00"), cycle.getStartDate().minusMonths(1),
                null, null, null, null, null, null, null));
        // Settle what the cycle already has, so position is computable before our bills.
        instanceService.listForCycle(cycle.getId());
    }

    private Long addBill(String name, String amount, boolean mandatory) {
        Long id = commitmentService.create(new CreateCommitmentRequest(
                name, amount == null ? CommitmentAmountType.VARIABLE : CommitmentAmountType.FIXED,
                amount == null ? null : new BigDecimal(amount),
                CommitmentFrequency.MONTHLY, dueDay, bank.getId(), null,
                mandatory, false, cycle.getStartDate(), null, null, null)).commitment().getId();
        return instanceService.listForCycle(cycle.getId()).stream()
                .map(CommitmentInstanceView::instance)
                .filter(i -> i.getCommitmentId().equals(id))
                .map(CommitmentInstance::getId)
                .findFirst().orElseThrow();
    }

    private PositionResult position() {
        PositionResult result = positionService.currentPosition();
        assumeTrue(result.complete(), "another bill in the test database has no amount");
        return result;
    }

    @Test
    @DisplayName("an optional bill reduces what's free until it's skipped, and again once the skip is undone")
    void optionalBillCountsUntilSkipped() {
        BigDecimal committedBefore = position().committed();
        BigDecimal optionalBefore = position().optionalCommitted();

        addBill("Must-pay rent", "10000.00", true);
        Long subscription = addBill("Optional subscription", "2000.00", false);

        PositionResult withBoth = position();
        assertThat(withBoth.committed().subtract(committedBefore)).isEqualByComparingTo("12000.00");
        assertThat(withBoth.optionalCommitted().subtract(optionalBefore)).isEqualByComparingTo("2000.00");

        CommitmentInstanceView skipped = instanceService.skip(subscription);
        assertThat(skipped.instance().getStatus()).isEqualTo(CommitmentInstanceStatus.SKIPPED);
        PositionResult afterSkip = position();
        assertThat(afterSkip.committed().subtract(committedBefore)).isEqualByComparingTo("10000.00");
        assertThat(afterSkip.realBalance().subtract(withBoth.realBalance())).isEqualByComparingTo("2000.00");

        instanceService.unskip(subscription);
        assertThat(position().committed().subtract(committedBefore)).isEqualByComparingTo("12000.00");
    }

    @Test
    @DisplayName("a must-pay bill can't be skipped")
    void mandatoryCannotBeSkipped() {
        Long rent = addBill("Must-pay rent", "10000.00", true);
        assertThatThrownBy(() -> instanceService.skip(rent)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("an optional bill with no amount doesn't withhold Real Balance; a must-pay one does")
    void unknownOptionalAmountDoesNotBlock() {
        position();
        addBill("Optional, amount varies", null, false);
        assertThat(positionService.currentPosition().complete()).isTrue();

        addBill("Must-pay, amount varies", null, true);
        assertThat(positionService.currentPosition().complete()).isFalse();
    }
}
