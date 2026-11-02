package com.finance.insight.rules;

import com.finance.card.CreditCardView;
import com.finance.card.domain.StatementStatus;
import com.finance.insight.FinancialContext;
import com.finance.insight.Insight;
import com.finance.insight.Insight.Severity;
import com.finance.insight.Insight.Surface;
import com.finance.insight.InsightAction;
import com.finance.insight.InsightRule;
import com.finance.insight.InsightType;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

import static com.finance.insight.Wording.date;
import static com.finance.insight.Wording.money;
import static com.finance.insight.Wording.relative;

/**
 * A card bill due within 5 days, or past its due date, with money still owed (FIX_BACKLOG 3.2).
 *
 * <p>"Still owed" is checked twice, against two different sources, and both must agree: the
 * statement must not be settled, <strong>and</strong> the card's own ledger balance must show a
 * debt. See the comment on the second check for why.
 */
@Component
public class CardBillRule implements InsightRule {

    private static final long DUE_WITHIN_DAYS = 5;

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        List<Insight> out = new ArrayList<>();
        for (CreditCardView card : ctx.cards()) {
            CreditCardView.LatestStatement latest = card.latestStatement();
            if (latest == null || latest.status() == StatementStatus.PAID) {
                continue;
            }
            // **A statement is a claim; the ledger is the record. Never raise an alarm the
            // ledger does not support.**
            //
            // `outstanding` is `-balance(card)` - what the card owes according to its own
            // postings. A statement can only reach PAID when money arrives *in the card
            // account*, so a user who pays the card's items individually from their bank -
            // which is a legitimate way to work, and this user's (CONTINUE_HERE, 2026-10-04) -
            // never satisfies it. Their four card bills were all settled, to the rupee of the
            // ₹10,567 statement, and this rule still warned every day and would have escalated
            // to CARD_BILL_OVERDUE/CRITICAL on the due date, about a debt the ledger put at ₹0.
            //
            // **The trade-off, taken deliberately:** someone who records statements but never
            // records the charges behind them now gets no warning at all. That was the open
            // question in CONTINUE_HERE ("an unbacked card statement"), and this answers it the
            // same way ADR-0018 and ADR-0020 answer theirs - a figure is true because an entry
            // says so, not because something was typed in a form. An unbacked statement is not
            // evidence of a debt, and warning on one trains the reader to dismiss the warning
            // that matters.
            if (card.outstanding() == null || card.outstanding().signum() <= 0) {
                continue;
            }
            LocalDate due = latest.statement().getDueDate();
            boolean overdue = latest.status() == StatementStatus.OVERDUE;
            if (!overdue && ChronoUnit.DAYS.between(ctx.today(), due) > DUE_WITHIN_DAYS) {
                continue;
            }
            Long from = card.payFromAccount() == null ? null : card.payFromAccount().getId();
            String cardName = card.account().getName();
            out.add(new Insight("card:" + card.account().getId() + ":statement:" + latest.statement().getId(),
                    overdue ? InsightType.CARD_BILL_OVERDUE : InsightType.CARD_BILL_DUE,
                    overdue ? Severity.CRITICAL : Severity.ATTENTION,
                    overdue ? cardName + " bill was due " + date(due) : cardName + " bill is due " + relative(due, ctx.today()),
                    money(latest.remaining()) + " left to pay of the " + money(latest.statement().getTotalAmount())
                            + " statement" + (overdue ? " - paying it now limits interest and the late fee." : "."),
                    latest.remaining(), due,
                    InsightAction.transfer("Pay bill", from, card.account().getId(), latest.remaining()),
                    EnumSet.of(Surface.TODAY, Surface.MONTH)));
        }
        return out;
    }
}
