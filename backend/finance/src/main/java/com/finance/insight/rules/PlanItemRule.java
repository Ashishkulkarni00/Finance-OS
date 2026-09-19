package com.finance.insight.rules;

import com.finance.commitment.CommitmentInstanceView;
import com.finance.commitment.domain.AttentionTier;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.insight.FinancialContext;
import com.finance.insight.Insight;
import com.finance.insight.Insight.Severity;
import com.finance.insight.Insight.Surface;
import com.finance.insight.InsightAction;
import com.finance.insight.InsightRule;
import com.finance.insight.InsightType;
import com.finance.transaction.domain.TransactionType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

import static com.finance.insight.Wording.date;
import static com.finance.insight.Wording.money;
import static com.finance.insight.Wording.relative;

/**
 * This month's plan items that need the user now - the same classification as the plan's
 * own rows (AttentionTier, Tier 1), so the list and the rows can't disagree. Worded for
 * what each item is: a bill to pay, income to record, or a planned move that didn't happen.
 */
@Component
public class PlanItemRule implements InsightRule {

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        List<Insight> out = new ArrayList<>();
        for (CommitmentInstanceView view : ctx.instances()) {
            if (AttentionTier.of(view.instance(), view.commitment(), ctx.today()) == AttentionTier.NEEDS_YOU) {
                out.add(describe(view, ctx));
            }
        }
        return out;
    }

    private Insight describe(CommitmentInstanceView view, FinancialContext ctx) {
        CommitmentInstance i = view.instance();
        Commitment rule = view.commitment();
        String name = rule.getName();
        String from = view.account().getName();
        BigDecimal left = i.outstanding();
        String key = "instance:" + i.getId();
        EnumSet<Surface> both = EnumSet.of(Surface.TODAY, Surface.MONTH);

        if (i.getStatus() == CommitmentInstanceStatus.NEEDS_REVIEW) {
            return new Insight(key + ":review", InsightType.NEEDS_REVIEW, Severity.ATTENTION,
                    name + " needs a look",
                    "The payment linked to it doesn't match the plan - a different amount or account.",
                    left, i.getDueDate(), InsightAction.open("Open", "/commitments/" + i.getId()), both);
        }
        if (i.getStatus() == CommitmentInstanceStatus.UNVERIFIED) {
            return new Insight(key + ":unverified", InsightType.UNVERIFIED, Severity.ATTENTION,
                    name + " is waiting to be confirmed",
                    "Recorded as paid; check it against your bank, then confirm.",
                    i.getConfirmedAmount(), i.getDueDate(),
                    InsightAction.instance(InsightAction.Kind.CONFIRM, "Confirm", i.getId()), both);
        }
        if (i.getExpectedAmount() == null) {
            return new Insight(key + ":amount", InsightType.NEEDS_AMOUNT, Severity.ATTENTION,
                    name + " needs an amount",
                    "Due " + date(i.getDueDate()) + " from " + from
                            + ". Until it has an estimate, what's free this month is only an upper limit.",
                    null, i.getDueDate(), InsightAction.instance(InsightAction.Kind.ESTIMATE, "Estimate", i.getId()), both);
        }

        TransactionType kind = rule.getSettleAs();
        boolean overdue = i.getStatus() == CommitmentInstanceStatus.OVERDUE;
        if (kind == TransactionType.INCOME) {
            // Income only reaches Tier 1 once it's late (AttentionTier).
            return new Insight(key + ":income", InsightType.INCOME_LATE, Severity.ATTENTION,
                    name + " expected " + date(i.getDueDate()) + " - not recorded yet",
                    money(left) + " into " + from + ". Arrived? Record it, so this month counts what actually came in.",
                    left, i.getDueDate(), InsightAction.instance(InsightAction.Kind.SETTLE, "Received", i.getId()), both);
        }
        if (kind == TransactionType.TRANSFER || kind == TransactionType.INVESTMENT) {
            String verb = kind == TransactionType.INVESTMENT ? "invested" : "moved";
            if (overdue) {
                return new Insight(key + ":missed", InsightType.PLANNED_ITEM_MISSED, Severity.ATTENTION,
                        name + " was planned for " + date(i.getDueDate()),
                        money(left) + " to be " + verb + " from " + from + " - not recorded yet. Done? Record it; "
                                + "until then it still counts against what's free.",
                        left, i.getDueDate(), InsightAction.instance(InsightAction.Kind.SETTLE, "Record it", i.getId()), both);
            }
            return new Insight(key + ":soon", InsightType.DUE_SOON, Severity.ATTENTION,
                    name + " " + relative(i.getDueDate(), ctx.today()),
                    money(left) + " to be " + verb + " from " + from + ".",
                    left, i.getDueDate(), InsightAction.instance(InsightAction.Kind.SETTLE, "Record it", i.getId()), both);
        }
        if (overdue) {
            return new Insight(key + ":overdue", InsightType.OVERDUE,
                    rule.isMandatory() ? Severity.CRITICAL : Severity.ATTENTION,
                    name + " was due " + date(i.getDueDate()),
                    money(left) + " from " + from + ". Paid already? Record it or link the Ledger entry"
                            + (rule.getIfSkipped() != null ? ". If skipped: " + rule.getIfSkipped() : "."),
                    left, i.getDueDate(), InsightAction.instance(InsightAction.Kind.SETTLE, "Settle", i.getId()), both);
        }
        return new Insight(key + ":soon", InsightType.DUE_SOON, Severity.ATTENTION,
                name + " is due " + relative(i.getDueDate(), ctx.today()),
                money(left) + " from " + from + ".",
                left, i.getDueDate(), InsightAction.instance(InsightAction.Kind.SETTLE, "Settle", i.getId()), both);
    }
}
