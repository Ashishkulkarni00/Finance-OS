package com.finance.state;

import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.cycle.CycleRepository;
import com.finance.cycle.CycleService;
import com.finance.cycle.domain.Cycle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * The user's own usual day-to-day spending, measured over complete salary cycles.
 *
 * <p>Three decisions worth keeping:
 *
 * <ol>
 *   <li><strong>The median, not the mean.</strong> One Diwali, one hospital visit or one
 *       laptop would drag an average up and keep it there for months, so the product would
 *       quietly raise its idea of "usual" every time the user had a bad month. The median
 *       ignores the outlier instead of absorbing it.</li>
 *   <li><strong>Complete cycles only — and complete means <em>ended</em>, not closed.</strong>
 *       A cycle whose end date has passed has all the spending it will ever have. Requiring
 *       the user to have run Month Close would make the baseline depend on a housekeeping
 *       step, and a user who never closes a month would never get one.</li>
 *   <li><strong>Flexible spending only.</strong> Rent, EMIs and utilities have a home on the
 *       commitment worklist; including them would make the baseline mostly a restatement of
 *       the plan, which the user already knows, and would swamp the part that actually
 *       varies.</li>
 * </ol>
 */
@Component
public class SpendBaselineCalculator {

    private static final Logger log = LoggerFactory.getLogger(SpendBaselineCalculator.class);

    /** Below this, there is no "usual" - only a couple of numbers. Two cycles is the least
     *  that can show a range at all; one is an anecdote. */
    public static final int MINIMUM_CYCLES = 2;

    /** How far back to look. Beyond about half a year the user's life has changed enough
     *  that "usual" stops meaning today's usual. */
    private static final int MAX_CYCLES = 6;

    private final CycleRepository cycleRepository;
    private final CycleService cycleService;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public SpendBaselineCalculator(CycleRepository cycleRepository, CycleService cycleService,
                                   CurrentUserProvider currentUser, Clock clock) {
        this.cycleRepository = cycleRepository;
        this.cycleService = cycleService;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    public SpendBaseline calculate() {
        LocalDate today = LocalDate.now(clock);
        Long userId = currentUser.currentUserId();

        List<Cycle> ended = cycleRepository
                .findByUserIdOrderByStartDateDesc(userId, PageRequest.of(0, MAX_CYCLES * 2))
                .getContent().stream()
                .filter(c -> c.getEndDate().isBefore(today))
                .limit(MAX_CYCLES)
                .toList();

        List<BigDecimal> totals = new ArrayList<>();
        for (Cycle cycle : ended) {
            try {
                totals.add(MoneyScale.normalise(cycleService.flexibleSpending(cycle.getId()).total()));
            } catch (RuntimeException e) {
                // One unreadable cycle must not cost the user their whole baseline; it is
                // simply one fewer observation, and cyclesObserved says so.
                log.warn("Baseline: cycle skipped id={} reason={}", cycle.getId(), e.getClass().getSimpleName());
            }
        }

        if (totals.size() < MINIMUM_CYCLES) {
            return SpendBaseline.unknown(totals.size());
        }

        List<BigDecimal> sorted = totals.stream().sorted().toList();
        Cycle earliest = ended.getLast();
        Cycle latest = ended.getFirst();
        return new SpendBaseline(median(sorted), sorted.size(),
                earliest.getStartDate(), latest.getEndDate(),
                sorted.getFirst(), sorted.getLast());
    }

    /** Even counts take the mean of the middle two - in BigDecimal, like all money here. */
    private BigDecimal median(List<BigDecimal> sorted) {
        int n = sorted.size();
        int mid = n / 2;
        if (n % 2 == 1) {
            return MoneyScale.normalise(sorted.get(mid));
        }
        return MoneyScale.normalise(
                sorted.get(mid - 1).add(sorted.get(mid)).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP));
    }
}
