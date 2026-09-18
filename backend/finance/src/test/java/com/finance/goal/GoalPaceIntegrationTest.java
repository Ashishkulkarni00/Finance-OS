package com.finance.goal;

import com.finance.account.AccountBalanceCalculator;
import com.finance.account.AccountService;
import com.finance.account.domain.Account;
import com.finance.account.domain.AccountType;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.common.user.CurrentUserProvider;
import com.finance.goal.dto.CreateGoalRequest;
import com.finance.reservation.ReservationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Today highlights a goal that's falling behind. "Behind" is saving trailing time, so the
 * same goal is read at different dates through a service on a fixed clock.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GoalPaceIntegrationTest {

    @Autowired
    private GoalService goalService;
    @Autowired
    private GoalRepository goalRepository;
    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private AccountService accountService;
    @Autowired
    private AccountBalanceCalculator balanceCalculator;
    @Autowired
    private CurrentUserProvider currentUser;
    @Autowired
    private Clock clock;

    private GoalService serviceOn(LocalDate day) {
        Clock fixed = Clock.fixed(day.atStartOfDay(clock.getZone()).toInstant(), clock.getZone());
        return new GoalServiceImpl(goalRepository, reservationRepository, accountService, balanceCalculator,
                currentUser, fixed);
    }

    private Long goalHolding(String held, String target, LocalDate targetDate) {
        Account account = accountService.create(new CreateAccountRequest(
                "Goal Pace Test Fund " + held, AccountType.BANK, null, null, null,
                new BigDecimal(held), LocalDate.now(clock).minusDays(1),
                null, null, null, null, null, null, null));
        return goalService.create(new CreateGoalRequest(
                "Emergency fund", new BigDecimal(target), targetDate, null, null, account.getId())).goal().getId();
    }

    @Test
    @DisplayName("10% saved with half the time gone is behind; the same goal on day one is on track")
    void behindWhenSavingTrailsTime() {
        LocalDate today = LocalDate.now(clock);
        LocalDate target = today.plusDays(200);
        Long id = goalHolding("10000.00", "100000.00", target);

        GoalView dayOne = serviceOn(today).getById(id);
        assertThat(dayOne.pace()).isEqualTo(GoalPace.ON_TRACK);
        assertThat(dayOne.timeElapsedPercent()).isEqualByComparingTo("0");

        GoalView halfway = serviceOn(today.plusDays(100)).getById(id);
        assertThat(halfway.timeElapsedPercent()).isEqualByComparingTo("50.00");
        assertThat(halfway.pace()).isEqualTo(GoalPace.BEHIND);

        // Within the tolerance: 10% saved against 14.5% of the time gone.
        assertThat(serviceOn(today.plusDays(29)).getById(id).pace()).isEqualTo(GoalPace.ON_TRACK);
    }

    @Test
    @DisplayName("past its date unreached is overdue; reached is reached, whatever the date")
    void overdueAndReached() {
        LocalDate today = LocalDate.now(clock);
        LocalDate target = today.plusDays(30);
        Long unreached = goalHolding("10000.00", "100000.00", target);
        Long done = goalHolding("100000.00", "100000.00", target);

        assertThat(serviceOn(target.plusDays(1)).getById(unreached).pace()).isEqualTo(GoalPace.OVERDUE);
        assertThat(serviceOn(target.plusDays(1)).getById(done).pace()).isEqualTo(GoalPace.REACHED);
        assertThat(serviceOn(today).getById(done).pace()).isEqualTo(GoalPace.REACHED);
    }
}
