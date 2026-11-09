package com.finance.insight.rules;

import com.finance.commitment.PlanAccountDrift;
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

/**
 * A bill whose plan names one account while the money keeps leaving another.
 *
 * <p><strong>The first rule here that learns rather than compares.</strong> Every other
 * rule in the engine fires on a threshold somebody chose — five days before a bill, a rate
 * above a holding's return, a balance below a floor. This one reads what the user actually
 * did, twice running, and offers to make the plan agree with it. The plan stops being
 * something you maintain and becomes something that keeps itself honest.
 *
 * <p><strong>What it would have prevented.</strong> *Clothes shopping* is planned from HDFC
 * Salary and goes on the HDFC Money back card. In October that mis-booked ₹12,000 of card
 * spending against the bank; in November it happened again, and was only found because the
 * card ended up ₹12,411 in credit. Two months, the same mistake, and the data to spot it
 * (`CommitmentInstanceView.settledFromAccount`) was already computed and displayed on screen
 * the whole time — just never reasoned about (FIX_BACKLOG 2.16).
 *
 * <p><strong>Why this is only ever ATTENTION, and never dated.</strong> Nothing is at risk
 * on a particular day and no money is lost if it is ignored; what is wrong is that the
 * projection, *Before payday* and the shortfall warnings are all reasoning about the wrong
 * account. That is worth saying once and worth being able to dismiss, not worth a red flag.
 *
 * <p><strong>The action opens the rule rather than rewriting it.</strong> Changing where a
 * bill is paid from is a plan revision (ADR-0015) and belongs to the user, made deliberately
 * on the page that records it — not to a button in a warning. The engine suggests; the user
 * acts.
 */
@Component
public class PlanAccountDriftRule implements InsightRule {

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        List<Insight> out = new ArrayList<>();
        for (PlanAccountDrift drift : ctx.planAccountDrifts()) {
            String times = drift.consecutive() == 2 ? "Both of the last 2 payments"
                    : "All " + drift.consecutive() + " of the last payments";
            out.add(new Insight(
                    "commitment:" + drift.commitmentId() + ":account-drift",
                    InsightType.PLAN_ACCOUNT_DRIFT,
                    Severity.ATTENTION,
                    drift.commitmentName() + " keeps being paid from " + drift.actualAccountName(),
                    times + " came from " + drift.actualAccountName() + ", most recently on "
                            + date(drift.lastOn(), ctx.today()) + ", but the plan plans it from "
                            + drift.plannedAccountName() + ". Until the plan is updated, "
                            + drift.plannedAccountName() + " is expected to cover it — so what's free to "
                            + "spend from there, and any warning about it running short, are both working "
                            + "from the wrong account.",
                    // No rupee impact: the figure that matters is which account, not how
                    // much. Ranking falls through to severity alone, which is right - this
                    // never outranks a bill about to bounce.
                    null,
                    null,
                    InsightAction.open("Open the plan", "/commitment-rules/" + drift.commitmentId()),
                    EnumSet.of(Surface.TODAY, Surface.MONTH)));
        }
        return out;
    }
}
