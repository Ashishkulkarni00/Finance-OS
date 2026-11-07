package com.finance.insight.rules;

import com.finance.card.CreditCardView;
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
 * A credit card whose balance has gone the wrong way - the card is in credit rather than
 * owing.
 *
 * <p><strong>Why this rule exists.</strong> On 2026-11-04 the user paid a ₹21,430 card bill
 * as a transfer, but only ₹9,019 of the charges behind it had been entered. The card's
 * balance turned positive and sat at a credit of ₹12,411 for hours. Money, Cards and the
 * Pulse all showed it without comment, and net worth counted it as an asset. It was the
 * clearest possible evidence that something was wrong, and the product's response was
 * silence. See {@code FIX_BACKLOG} 1.18.
 *
 * <p><strong>A different kind of check from the rest of the engine.</strong> Every other
 * rule fires on a threshold somebody chose - five days before a bill, a rate above a
 * holding's return. This one fires on a figure that is nearly always *wrong* rather than
 * merely concerning, which is a class of check the product did not have. The same shape
 * applies to a bank account below zero that is not an overdraft, a bill settled for many
 * times its plan, or a goal holding more than its target; this is the first of them.
 *
 * <p><strong>"Nearly always", not "impossible", and the wording keeps that honest.</strong>
 * A card really can sit in credit: overpay the bill, or get a refund after paying it, and
 * there it is. So the insight names both causes and leads with the likelier one rather than
 * asserting a mistake. A warning that tells someone their refund is an error is a warning
 * they learn to dismiss - and the dismissal would carry over to the case that matters
 * (ROADMAP 3.2 handles the dismissal itself).
 *
 * <p><strong>No new data.</strong> {@code CreditCardView.outstanding()} is already
 * {@code -balance(card)}, so a credit balance is exactly {@code outstanding().signum() < 0}.
 * Nothing is queried, nothing is stored.
 */
@Component
public class CardCreditBalanceRule implements InsightRule {

    /**
     * Below a rupee is rounding, not a credit balance. Deliberately this low rather than a
     * tidy ₹100: the amount does not tell you which cause it is - a ₹2,000 refund and a
     * ₹2,000 missing charge look identical here - so a larger floor would only hide small
     * real errors while still letting large legitimate refunds through. Rarity is what keeps
     * this quiet, not the threshold.
     */
    private static final BigDecimal FLOOR = BigDecimal.ONE;

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        List<Insight> out = new ArrayList<>();
        for (CreditCardView card : ctx.cards()) {
            BigDecimal outstanding = card.outstanding();
            if (outstanding == null || outstanding.signum() >= 0) {
                continue;
            }
            BigDecimal inCredit = outstanding.negate();
            if (inCredit.compareTo(FLOOR) < 0) {
                continue;
            }

            String name = card.account().getName();
            out.add(new Insight(
                    "card:" + card.account().getId() + ":in-credit",
                    InsightType.CARD_IN_CREDIT,
                    Severity.ATTENTION,
                    name + " is " + money(inCredit) + " in credit",
                    "The card has been paid " + money(inCredit) + " more than the charges recorded on it. "
                            + "Usually that means a purchase hasn't been entered yet - a bill often covers things "
                            + "bought before you started recording them. It can also be a refund, or a payment "
                            + "larger than the bill. Until it is one or the other, this " + money(inCredit)
                            + " is counted as money you have.",
                    inCredit,
                    // Undated on purpose: nothing happens on a particular day, so a date here
                    // would be invented. Ranking falls through to `impact`, which is the right
                    // ordering anyway - the bigger the credit, the more wrong everything is.
                    null,
                    InsightAction.open("Open card", "/cards/" + card.account().getId()),
                    EnumSet.of(Surface.TODAY, Surface.MONTH)));
        }
        return out;
    }
}
