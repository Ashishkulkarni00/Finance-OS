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
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;

import static com.finance.insight.Wording.date;
import static com.finance.insight.Wording.money;

/**
 * A goal that cannot be judged, because what goes into it each month varies.
 *
 * <p><strong>This exists to close a silence, not to add noise.</strong> When goal pace moved
 * from the calendar to funding (Phase 5.1, early), a goal funded by a variable bill stopped
 * being able to claim {@code ON_TRACK} - correctly, since the amount is the user's monthly
 * decision and no honest claim can be read off the plan (ADR-0006). But
 * {@link GoalBehindRule} only fires on {@code BEHIND} and {@code OVERDUE}, so those goals
 * went from a confident wrong answer to no answer at all.
 *
 * <p>The user's emergency fund is exactly this case: it needs a real figure every month and
 * nothing in the product ever mentions it. Saying "we can't tell, and here is what it would
 * take" is both honest and the one thing that leads somewhere - give the bill an amount, and
 * the goal can be judged from then on.
 *
 * <p><strong>One goal, not all of them.</strong> Same rule as {@code GoalBehindRule}: the
 * highest-priority one, then the nearest date. A list that reports every unjudgeable goal is
 * a list nobody finishes reading.
 *
 * <p>Severity is {@code OPPORTUNITY}, deliberately. Nothing is going wrong and nothing is
 * lost by leaving it - the product simply cannot answer a question the user might be
 * assuming it has answered. Dressing that as a warning would be the product raising its
 * voice about its own blind spot.
 */
@Component
public class GoalFundingUnclearRule implements InsightRule {

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        return ctx.goals().stream()
                .filter(GoalFundingUnclearRule::unjudgeable)
                .min(Comparator.comparingInt((GoalView g) -> g.goal().getPriority())
                        .thenComparing(g -> g.goal().getTargetDate()))
                .map(g -> List.of(describe(g, ctx.today())))
                .orElse(List.of());
    }

    private static boolean unjudgeable(GoalView g) {
        return g.pace() == GoalPace.UNKNOWN
                && g.fundingVaries() > 0
                && g.requiredPerMonth() != null
                && g.requiredPerMonth().signum() > 0;
    }

    private Insight describe(GoalView g, LocalDate today) {
        String name = g.goal().getName();
        BigDecimal needed = g.requiredPerMonth();

        String bills = g.fundingVaries() == 1
                ? "A bill that pays into it has no set amount"
                : g.fundingVaries() + " bills that pay into it have no set amount";

        String explanation = bills + ", so what goes in each month is your call and we can't say"
                + " whether it's enough. " + money(needed) + " a month reaches "
                + money(g.goal().getTargetAmount()) + " by " + date(g.goal().getTargetDate(), today) + ".";

        return new Insight("goal:" + g.goal().getId() + ":funding-unclear",
                InsightType.GOAL_FUNDING_UNCLEAR, Severity.OPPORTUNITY,
                "We can't tell if " + name + " is on track",
                explanation, needed, g.goal().getTargetDate(),
                InsightAction.open("Open goal", "/goals/" + g.goal().getId()),
                EnumSet.of(Surface.TODAY, Surface.MONTH));
    }
}
