package com.finance.insight.rules;

import com.finance.goal.GoalWithdrawal;
import com.finance.insight.FinancialContext;
import com.finance.insight.Insight;
import com.finance.insight.Insight.Severity;
import com.finance.insight.Insight.Surface;
import com.finance.insight.InsightAction;
import com.finance.insight.InsightRule;
import com.finance.insight.InsightType;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

import static com.finance.insight.Wording.date;
import static com.finance.insight.Wording.money;

/**
 * <strong>Money came back out of a goal, and nothing recorded that as a change of plan.</strong>
 *
 * <p>Found in use on 2026-10-09. The cycle's plan put ₹15,000 into the emergency fund; eleven
 * days later ₹11,000 came back out; Real Balance rose by ₹11,000 and Today went green. Every
 * figure was correct - that money really is spendable again - and the user's objection was the
 * right one: *"what is planned and what is owed today should demonstrate exactly according to
 * plan"*. Nothing anywhere said the plan and reality had parted company.
 *
 * <p>{@code GoalBehindRule} could not catch it: that goal is 23.5% funded against 7.12% of its
 * time elapsed, so by pace it is comfortably ahead and stays quiet. Being ahead of schedule and
 * having just undone three quarters of this month's contribution are both true at once.
 *
 * <p><strong>This rule changes no figure.</strong> ADR-0015 is the reason it exists at all: a
 * plan change records what changed, when and why, and "a silent plan rewrite is a defect". The
 * money is still counted as spendable, because it is spendable. The deviation just gets said
 * out loud.
 *
 * <h2>Tone</h2>
 * <p>ATTENTION, never CRITICAL, and no verdict (rule 8). Taking your own money back out of your
 * own fund is a legitimate thing to do and is often the right call - that is what an emergency
 * fund is <em>for</em>. The sentence states what happened and offers the two honest next steps:
 * put it back, or change the plan so next month's figures follow. It must not read as being
 * told off, or it will be dismissed on sight and take the useful warnings with it.
 */
@Component
public class GoalRaidedRule implements InsightRule {

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        List<Insight> out = new ArrayList<>();
        for (GoalWithdrawal w : ctx.goalWithdrawals()) {
            // Keyed per goal per cycle, not per transaction: five small withdrawals are one
            // situation, and five rows for it is the kind of pile people learn to scroll past.
            // The key carries the cycle so a new month starts clean, and `insight_state`
            // announces it once (ADR-0017) rather than every time the page is opened.
            String key = "goal:" + w.goalId() + ":withdrawn:" + ctx.cycle().getId();
            String occasions = w.count() == 1
                    ? "on " + date(w.lastOn(), ctx.today())
                    : "across " + w.count() + " withdrawals, the last on " + date(w.lastOn(), ctx.today());
            out.add(new Insight(key, InsightType.GOAL_RAIDED, Severity.ATTENTION,
                    money(w.netOut()) + " came back out of " + w.goalName(),
                    "Taken from " + w.accountName() + " " + occasions
                            + ". It still counts as money you can spend, because it is - but the plan "
                            + "that put it aside hasn't changed. Move it back, or change the plan so next "
                            + "month follows.",
                    w.netOut(), w.lastOn(),
                    // The destination is the goal's own account and the amount is what left, so
                    // "Move it back" is one tap and needs no arithmetic from the reader. The
                    // source is left null: the money has been mixed into spending by now, and
                    // naming an account it might not all be in would be a guess.
                    InsightAction.transfer("Move it back", null, w.accountId(), w.netOut()),
                    EnumSet.of(Surface.TODAY, Surface.MONTH)));
        }
        return out;
    }
}
