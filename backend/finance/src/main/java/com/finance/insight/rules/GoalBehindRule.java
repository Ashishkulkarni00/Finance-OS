package com.finance.insight.rules;

import com.finance.goal.GoalPace;
import com.finance.goal.GoalView;
import com.finance.insight.FinancialContext;
import com.finance.insight.Insight;
import com.finance.insight.Insight.Severity;
import com.finance.insight.Insight.Surface;
import com.finance.insight.InsightAction;
import com.finance.insight.InsightRule;
import com.finance.insight.InsightType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;

import static com.finance.insight.Wording.date;
import static com.finance.insight.Wording.money;

/**
 * The top-priority goal that's behind its pace or past its date - one, not every goal
 * (what Today's goal card used to show). A fact about progress, never a verdict.
 */
@Component
public class GoalBehindRule implements InsightRule {

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        return ctx.goals().stream()
                .filter(g -> g.pace() == GoalPace.BEHIND || g.pace() == GoalPace.OVERDUE)
                .min(Comparator.comparingInt((GoalView g) -> g.goal().getPriority())
                        .thenComparing(g -> g.goal().getTargetDate()))
                .map(g -> List.of(describe(g, ctx.today())))
                .orElse(List.of());
    }

    /**
     * Why it is behind, in terms the user can act on.
     *
     * <p>It used to say "0% saved with 10% of the time gone", which is a fact about the
     * calendar and no help: nothing in it says what to change. The pace now comes from
     * funding against requirement ({@link GoalPace}), so the explanation can name the gap —
     * and a gap has a fix.
     */
    private String shortfall(GoalView g, LocalDate today) {
        String by = date(g.goal().getTargetDate(), today);
        // What is actually in it, against what it is for - the two figures the user needs to
        // tell "saved" from "target" apart (they are otherwise easy to read as the same
        // thing, especially when a near date makes the monthly requirement equal the target).
        String saved = money(g.currentAmount()) + " of " + money(g.goal().getTargetAmount()) + " saved";
        if (g.requiredPerMonth() == null) {
            return saved + ", towards " + by + ".";
        }
        String needed = money(g.requiredPerMonth()) + " a month";
        BigDecimal funded = g.fundedPerMonth();
        if (funded == null) {
            return saved + ". " + needed + " reaches the target by " + by + ".";
        }
        if (funded.signum() == 0) {
            return saved + ", and nothing is going in. " + needed + " reaches the target by " + by + ".";
        }
        // Going in vs needed, named as different things - "₹2,000 a month is going in, and
        // ₹8,774 a month reaches it" read as one continuing sentence about the same figure.
        return saved + ". " + money(funded) + " a month is going in; it needs " + needed
                + " to reach the target by " + by + ".";
    }

    private Insight describe(GoalView g, LocalDate today) {
        String name = g.goal().getName();
        boolean overdue = g.pace() == GoalPace.OVERDUE;
        String explanation = overdue
                ? money(g.currentAmount()) + " of " + money(g.goal().getTargetAmount()) + " saved, and the target date ("
                        + date(g.goal().getTargetDate(), today) + ") has passed. Set a new date, or plan a top-up."
                : shortfall(g, today);
        return new Insight("goal:" + g.goal().getId() + ":pace", InsightType.GOAL_BEHIND, Severity.OPPORTUNITY,
                name + (overdue ? " is past its date" : " is behind its pace"),
                explanation, g.requiredPerMonth(), g.goal().getTargetDate(),
                InsightAction.open("Open goal", "/goals/" + g.goal().getId()),
                EnumSet.of(Surface.TODAY, Surface.MONTH));
    }
}
