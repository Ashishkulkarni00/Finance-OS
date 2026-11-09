package com.finance.insight.rules;

import com.finance.commitment.PlanAmountDrift;
import com.finance.insight.FinancialContext;
import com.finance.insight.Insight;
import com.finance.insight.Insight.Severity;
import com.finance.insight.Insight.Surface;
import com.finance.insight.InsightAction;
import com.finance.insight.InsightRule;
import com.finance.insight.InsightType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

import static com.finance.insight.Wording.money;

/**
 * A fixed bill whose plan amount is out of date - ROADMAP 3.1 "subscription drift". See
 * {@link com.finance.commitment.PlanAmountDriftCalculator} for when it fires.
 *
 * <p><strong>Costing more is ATTENTION; costing less is INFO.</strong> A plan that's too low
 * makes every forward figure - Free until salary, Ahead, each goal's verdict - optimistic,
 * which is the dangerous direction. A plan that's too high is merely cautious; worth knowing,
 * not worth ranking above anything real.
 *
 * <p>No judgement about the price ("you're overpaying"): the product doesn't know whether the
 * new price is fair, only that the plan no longer describes it. The action opens the rule -
 * changing the amount is a plan revision (ADR-0015), and belongs to the user.
 */
@Component
public class PlanAmountDriftRule implements InsightRule {

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        List<Insight> out = new ArrayList<>();
        for (PlanAmountDrift d : ctx.planAmountDrifts()) {
            BigDecimal diff = d.latest().subtract(d.planned()).abs();
            boolean more = d.costsMore();
            out.add(new Insight(
                    "commitment:" + d.commitmentId() + ":amount-drift",
                    InsightType.PLAN_AMOUNT_DRIFT,
                    more ? Severity.ATTENTION : Severity.INFO,
                    d.name() + " has cost " + money(diff) + (more ? " more" : " less") + " than planned, twice",
                    "The plan says " + money(d.planned()) + "; the last two payments were " + money(d.latest())
                            + " and " + money(d.previous()) + ". Until the plan matches, every figure looking ahead is "
                            + (more ? "about " + money(diff) + " a month more hopeful than it should be."
                                    : "about " + money(diff) + " a month more cautious than it needs to be."),
                    more ? diff : null,
                    null,
                    InsightAction.open("Open the plan", "/commitment-rules/" + d.commitmentId()),
                    more ? EnumSet.of(Surface.TODAY, Surface.MONTH) : EnumSet.of(Surface.MONTH)));
        }
        return out;
    }
}
