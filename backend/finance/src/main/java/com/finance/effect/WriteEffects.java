package com.finance.effect;

import com.finance.insight.Insight;
import com.finance.insight.InsightService;
import com.finance.insight.InsightStateTracker;
import com.finance.insight.domain.InsightState;
import com.finance.position.PositionResult;
import com.finance.position.PositionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.function.Supplier;

/**
 * Runs a write and reports what it did (ROADMAP 0.4, ADR-0017).
 *
 * <p>Used by wrapping the write itself:
 *
 * <pre>{@code
 * var reported = effects.around(() -> service.create(request, idempotencyKey));
 * reported.value();   // what the endpoint already returned
 * reported.effect();  // what it cost - null when nothing moved
 * }</pre>
 *
 * <p>Wrapping rather than injecting into each service is what keeps the promise in ADR-0017
 * that <strong>the effect can never fail the write</strong>. The write runs inside its own
 * transaction and has committed by the time anything here is computed, so a broken
 * projection cannot roll back a recorded expense. Everything outside the supplied write is
 * caught: a user who recorded an expense has recorded an expense, and the worst this layer
 * may do is fall silent.
 *
 * <p>It also avoids a bean cycle that injection would have created - {@code InsightService}
 * reaches {@code CommitmentInstanceService}, which writes transactions - and keeps write
 * services unaware that anything reports on them.
 */
@Component
public class WriteEffects {

    private static final Logger log = LoggerFactory.getLogger(WriteEffects.class);

    /** How many crossings are spelled out before the rest become "and N more". Two, because
     *  this appears beside the thing the user just did and must not bury it. */
    private static final int SHOWN = 2;

    private final PositionService positionService;
    private final InsightService insightService;
    private final InsightStateTracker tracker;

    public WriteEffects(PositionService positionService,
                        @Lazy InsightService insightService,
                        InsightStateTracker tracker) {
        this.positionService = positionService;
        this.insightService = insightService;
        this.tracker = tracker;
    }

    /** A write's own result, and what it did. */
    public record Reported<T>(T value, WriteEffect effect) {
    }

    public <T> Reported<T> around(Supplier<T> write) {
        PositionResult before = safePosition();
        T value = write.get();
        return new Reported<>(value, safeEffect(before));
    }

    /**
     * The effect of a write that has already happened, given the position before it.
     * Prefer {@link #around(Supplier)}; this exists for callers that cannot wrap.
     */
    public WriteEffect since(PositionResult before) {
        return safeEffect(before);
    }

    /** The position now, for a caller that will report on its own write later. */
    public PositionResult capture() {
        return safePosition();
    }

    private WriteEffect safeEffect(PositionResult before) {
        try {
            return compose(before);
        } catch (RuntimeException e) {
            // Never rethrown. The write is already committed and is the thing that matters.
            log.warn("Write effect not reported: {}", e.getClass().getSimpleName());
            return null;
        }
    }

    private PositionResult safePosition() {
        try {
            return positionService.currentPosition();
        } catch (RuntimeException e) {
            log.warn("Write effect: position unavailable: {}", e.getClass().getSimpleName());
            return null;
        }
    }

    private WriteEffect compose(PositionResult before) {
        PositionResult after = positionService.currentPosition();
        List<Insight> current = insightService.evaluateAll();
        InsightStateTracker.Crossings crossings = tracker.record(current);

        BigDecimal leftBefore = leftToday(before);
        BigDecimal leftAfter = leftToday(after);
        BigDecimal balanceBefore = balance(before);
        BigDecimal balanceAfter = balance(after);

        // Silence is a valid effect (ADR-0017). Renaming a category moves no money and
        // crosses no line, and a product that speaks after every action is the same nag
        // problem in a different shape.
        boolean moved = !Objects.equals(leftBefore, leftAfter) || !Objects.equals(balanceBefore, balanceAfter);
        if (!moved && crossings.isEmpty()) {
            return null;
        }

        List<Insight> started = crossings.started();
        List<InsightState> cleared = crossings.cleared();
        return new WriteEffect(
                leftBefore, leftAfter, balanceBefore, balanceAfter,
                started.subList(0, Math.min(SHOWN, started.size())),
                cleared.subList(0, Math.min(SHOWN, cleared.size())),
                Math.max(0, started.size() - SHOWN),
                Math.max(0, cleared.size() - SHOWN),
                prominence(started));
    }

    /** Held only for what genuinely needs acting on. Everything else states itself once. */
    private WriteEffect.Prominence prominence(List<Insight> started) {
        boolean needsAttention = started.stream().anyMatch(i ->
                i.severity() == Insight.Severity.CRITICAL || i.severity() == Insight.Severity.ATTENTION);
        return needsAttention ? WriteEffect.Prominence.HELD : WriteEffect.Prominence.QUIET;
    }

    /**
     * What is left to spend today. Null when position refuses to compute - unknown, not
     * zero (ADR-0006).
     *
     * <p>Deliberately {@code roomLeft} and not {@code roomToday}: the day's allowance adds
     * today's spending back before dividing, so it does not move when you spend. Reporting
     * it here produced an effect that always said "unchanged" - and, with nothing else to
     * show, an empty box on screen.
     */
    private BigDecimal leftToday(PositionResult position) {
        return position == null || !position.complete() ? null : position.roomLeft();
    }

    private BigDecimal balance(PositionResult position) {
        return position == null || !position.complete() ? null : position.realBalance();
    }
}
