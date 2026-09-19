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
                .map(g -> List.of(describe(g)))
                .orElse(List.of());
    }

    private static String percent(BigDecimal value) {
        return value == null ? "—" : value.setScale(0, RoundingMode.HALF_UP).toPlainString() + "%";
    }

    private Insight describe(GoalView g) {
        String name = g.goal().getName();
        boolean overdue = g.pace() == GoalPace.OVERDUE;
        String explanation = overdue
                ? money(g.currentAmount()) + " of " + money(g.goal().getTargetAmount()) + " saved, and the target date ("
                        + date(g.goal().getTargetDate()) + ") has passed. Set a new date, or plan a top-up."
                : percent(g.progressPercent()) + " saved with " + percent(g.timeElapsedPercent()) + " of the time gone"
                        + (g.requiredPerMonth() != null
                                ? "; " + money(g.requiredPerMonth()) + " a month from now reaches "
                                        + money(g.goal().getTargetAmount()) + " by " + date(g.goal().getTargetDate()) + "."
                                : ".");
        return new Insight("goal:" + g.goal().getId() + ":pace", InsightType.GOAL_BEHIND, Severity.OPPORTUNITY,
                name + (overdue ? " is past its date" : " is behind its pace"),
                explanation, g.requiredPerMonth(), g.goal().getTargetDate(),
                InsightAction.open("Open goal", "/goals/" + g.goal().getId()),
                EnumSet.of(Surface.TODAY, Surface.MONTH));
    }
}
