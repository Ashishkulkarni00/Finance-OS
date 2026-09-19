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

/** A card bill due within 5 days, or past its due date, with money still owed (FIX_BACKLOG 3.2). */
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
