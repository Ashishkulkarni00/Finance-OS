package com.finance.insight;

import com.finance.common.user.CurrentUserProvider;
import com.finance.forecast.ForecastMonth;
import com.finance.forecast.ForecastService;
import com.finance.forecast.ForecastUnlock;
import com.finance.insight.domain.InsightState;
import com.finance.insight.domain.InsightStateRepository;
import com.finance.state.SpendBaseline;
import com.finance.state.SpendBaselineCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static com.finance.insight.Wording.date;
import static com.finance.insight.Wording.money;

/**
 * What to say when nothing is wrong (ROADMAP 3.3).
 *
 * <p>The engine only ever spoke to warn. On a good week it said "nothing needs you" and
 * stopped, which is accurate and gives a person no reason to come back — and the category's
 * failure mode is not being wrong, it is being abandoned (~70% within 100 days).
 *
 * <p>So: when nothing is urgent, say what <strong>moved</strong>. Not encouragement, not a
 * score, not a streak — facts the user did not have to go and look for. A recovery, a number
 * that beat its own baseline, money that is about to come back.
 *
 * <p><strong>Three rules this follows, and they are the whole design:</strong>
 *
 * <ul>
 *   <li><strong>Never invent something to say.</strong> If nothing moved, this returns
 *       nothing and the screen stays quiet. A product that manufactures a remark every day
 *       has taught the user to ignore it by the end of the week.</li>
 *   <li><strong>Only facts already computed elsewhere.</strong> Every line here is read from
 *       an engine that owns it — cleared warnings from {@code insight_state}, unlocks from
 *       the forecast, the baseline from its own calculator. Nothing is worked out here, so
 *       nothing here can disagree with the screen that shows the same figure.</li>
 *   <li><strong>Never a verdict</strong> (rule 8). "You stayed under your usual" is a
 *       measurement. "Well done" is a judgement, and the next month it becomes a rebuke.</li>
 * </ul>
 */
@Component
public class CalmVoice {

    private static final Logger log = LoggerFactory.getLogger(CalmVoice.class);

    /** A recovery stops being news after a week. */
    private static final int RECOVERY_DAYS = 7;

    /** Two lines is a glance. Three is a paragraph nobody reads on a good day. */
    private static final int MAX_LINES = 2;

    private final InsightStateRepository stateRepository;
    private final ForecastService forecastService;
    private final SpendBaselineCalculator baselineCalculator;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public CalmVoice(InsightStateRepository stateRepository, ForecastService forecastService,
                     SpendBaselineCalculator baselineCalculator, CurrentUserProvider currentUser, Clock clock) {
        this.stateRepository = stateRepository;
        this.forecastService = forecastService;
        this.baselineCalculator = baselineCalculator;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    /**
     * What moved, best first. Empty when nothing did — which is a valid and common answer.
     *
     * <p>Never throws: this is the quiet half of the screen, and a screen that cannot say
     * something reassuring must still show everything else.
     */
    public List<String> whatMoved() {
        List<String> lines = new ArrayList<>();
        try {
            recovery().ifPresent(lines::add);
            if (lines.size() < MAX_LINES) {
                usualSpend().ifPresent(lines::add);
            }
            if (lines.size() < MAX_LINES) {
                nextUnlock().ifPresent(lines::add);
            }
        } catch (RuntimeException e) {
            log.warn("Calm voice unavailable: {}", e.getClass().getSimpleName());
            return List.of();
        }
        return List.copyOf(lines);
    }

    /**
     * A warning that stopped being true in the last week.
     *
     * <p>This is the half of ADR-0017 that has never had a home on a screen. The toast says
     * it once, at the moment of the write, and whoever was not looking never learns that the
     * thing they were worried about resolved itself.
     */
    private Optional<String> recovery() {
        Instant since = Instant.now(clock).minus(RECOVERY_DAYS, ChronoUnit.DAYS);
        return stateRepository.findByUserIdAndClearedAtIsNotNullOrderByClearedAtDesc(currentUser.currentUserId())
                .stream()
                .filter(s -> s.getClearedAt() != null && s.getClearedAt().isAfter(since))
                .findFirst()
                .map(InsightState::getTitle)
                // The title keeps its capital - it is a name ("Bangalore trip"), not a clause.
                .map(title -> "No longer: " + title + ".");
    }

    /** Only once there is enough history to have a "usual" at all - see {@link SpendBaseline}. */
    private Optional<String> usualSpend() {
        SpendBaseline baseline = baselineCalculator.calculate();
        if (!baseline.isKnown()) {
            return Optional.empty();
        }
        return Optional.of(
                "You usually spend " + money(baseline.perCycle()) + " a month day to day, measured over "
                        + baseline.cyclesObserved() + " months.");
    }

    /**
     * The next EMI or bill to end, and what comes back when it does.
     *
     * <p>The one thing this product can say that a spreadsheet cannot: a commitment carried
     * forward far enough to see it stop.
     */
    private Optional<String> nextUnlock() {
        LocalDate today = LocalDate.now(clock);
        return forecastService.forecast(12).months().stream()
                .filter(m -> !m.unlocks().isEmpty())
                .min(Comparator.comparing(ForecastMonth::cycleStart))
                .flatMap(month -> month.unlocks().stream()
                        .max(Comparator.comparing(ForecastUnlock::amount))
                        .map(unlock -> phraseUnlock(unlock, month.cycleStart(), today)));
    }

    /**
     * "₹2,648 a month frees up from 28 Feb 2027, when HDFC - Credit card EMI ends."
     *
     * <p>The date is the <strong>cycle the money is free from</strong>, not the bill's last
     * payment — an unlock is detected by the bill's absence from that month, so its final
     * payment fell in the one before. "Comes back <em>on</em> 28 Feb" would be a day out and
     * would read as a date to expect something to happen.
     */
    private String phraseUnlock(ForecastUnlock unlock, LocalDate start, LocalDate today) {
        BigDecimal amount = unlock.amount();
        return money(amount) + " a month frees up from " + date(start, today)
                + ", when " + unlock.name() + " ends.";
    }
}
