package com.finance.insight.rules;

import com.finance.account.domain.Account;
import com.finance.goal.GoalView;
import com.finance.insight.FinancialContext;
import com.finance.insight.Insight;
import com.finance.insight.Insight.Severity;
import com.finance.insight.Insight.Surface;
import com.finance.insight.InsightAction;
import com.finance.insight.InsightRule;
import com.finance.insight.InsightType;
import com.finance.loan.LoanView;
import com.finance.loan.domain.LoanStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

import static com.finance.insight.Wording.money;

/**
 * Money set aside while debt that costs more than it can earn is still running
 * (FINANCIAL_STATE.md §7, "allocation is costing money"; ROADMAP 3.1).
 *
 * <p>Nothing in the product ever mentioned this. A goal and a loan are shown on different
 * screens, each correct on its own, and the one fact that connects them - that the fund is
 * being paid for in interest - is visible from neither. On this user's data it is the single
 * most expensive thing in the position and the product was silent about it.
 *
 * <p><strong>No savings rate is assumed, and that is deliberate.</strong> The roadmap phrases
 * this as "saving at 6% while paying 22%", but nothing in the model records what an account
 * earns, and inventing a figure to complete the sentence is exactly the confident-wrong
 * failure rule 3 forbids. It is not needed: the cost of <em>not</em> repaying is arithmetic
 * over figures we hold. The comparison is capped at the loan's own balance, because interest
 * can only be saved on debt that actually exists.
 *
 * <p><strong>It must not read as "empty your emergency fund".</strong> That is where a naive
 * rate comparison goes wrong and why the closing sentence is part of the rule rather than
 * decoration. A fund spent on debt means the next emergency is borrowed again, plausibly on
 * the same card at the same rate - so the honest output is the price of the trade, not a
 * recommendation (D8: AI is an interface, never the engine). Rule 8 applies with force here:
 * a person holding a fund against five loans is not making a mistake, they are making a
 * choice, and the product's job is to put a number on it.
 *
 * <p><strong>It fires narrowly.</strong> Below {@link #MIN_RATE} the trade is genuinely
 * arguable - a 9.35% education loan against a liquidity buffer is not something this product
 * should have an opinion about - and below {@link #MIN_YEARLY_COST} the sum at stake is too
 * small to be worth a line. One insight, for the dearest loan only: repayment would go there
 * first, and a list of five rate comparisons is a spreadsheet, not an insight.
 *
 * <p>The largest single goal is named rather than every goal summed. Two goals tracking one
 * account would otherwise count the same rupees twice, and understating the trade is the
 * safe direction to be wrong in. "Largest" means largest <em>reachable</em>, not largest
 * balance - see {@link #reachable}.
 *
 * <p>Severity is {@code OPPORTUNITY}: nothing is going wrong, nothing is lost by leaving it
 * exactly as it is. Keyed on the loan, so when the dearest one clears the warning clears with
 * it and a new one opens for the next - which is news, not a repeat (ADR-0017).
 */
@Component
public class RateMismatchRule implements InsightRule {

    /** Below this the fund-versus-debt trade is a legitimate matter of taste. */
    private static final BigDecimal MIN_RATE = new BigDecimal("12.00");

    /**
     * The bar is what the trade <strong>costs a year</strong>, not how much is saved.
     *
     * <p>A balance threshold was the first attempt and it was the wrong variable: ₹10,000
     * against a 22% loan is ₹2,208 a year and worth a line, while the same ₹10,000 against a
     * 12% loan is ₹1,200 and arguably is not. Only the product of the two is the thing the
     * user would act on, so that is what has to clear the bar.
     */
    private static final BigDecimal MIN_YEARLY_COST = new BigDecimal("1500");

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        Optional<LoanView> dearestOpt = dearestLoan(ctx);
        if (dearestOpt.isEmpty()) {
            return List.of();
        }
        LoanView dearest = dearestOpt.get();
        return ctx.goals().stream()
                .map(g -> new Reachable(g, reachable(g, ctx)))
                .filter(r -> r.amount().signum() > 0)
                .max(Comparator.comparing(Reachable::amount))
                .map(r -> describe(r, dearest))
                .filter(i -> i.impact().compareTo(MIN_YEARLY_COST) >= 0)
                .map(List::of)
                .orElse(List.of());
    }

    /** A goal and the part of it that could actually be moved to a debt. */
    private record Reachable(GoalView goal, BigDecimal amount) {
    }

    /**
     * What of a goal's balance could genuinely be used to repay something.
     *
     * <p><strong>A mandatory minimum balance is not savings you can spend.</strong> This
     * user's emergency fund holds {@code ₹33,000} in an account that must keep {@code ₹25,000}
     * or the terms break, so only {@code ₹8,000} is reachable. Comparing the full balance
     * against a loan overstated the trade more than fourfold and would have invited a move
     * that is not even possible - the exact shape of confidently wrong that rule 3 forbids.
     *
     * <p>A goal with no linked account, or one with no mandatory minimum, is reachable in
     * full. A goal backed by a reservation is a claim on money held elsewhere, and the
     * account holding it is not identified here, so it is taken at face value.
     */
    private static BigDecimal reachable(GoalView g, FinancialContext ctx) {
        BigDecimal saved = g.currentAmount();
        if (saved == null || saved.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        Long accountId = g.goal().getLinkedAccountId();
        if (accountId == null) {
            return saved;
        }
        return ctx.accounts().stream()
                .filter(a -> accountId.equals(a.getId()))
                .findFirst()
                .filter(Account::isMinimumBalanceMandatory)
                .map(Account::getMinimumBalance)
                .map(min -> saved.subtract(min).max(BigDecimal.ZERO))
                .orElse(saved);
    }

    private static Optional<LoanView> dearestLoan(FinancialContext ctx) {
        return ctx.loans().stream()
                .filter(RateMismatchRule::costing)
                .max(Comparator.comparing(l -> l.loan().getAnnualRate()));
    }

    private static boolean costing(LoanView l) {
        return l.loan().getStatus() == LoanStatus.ACTIVE
                && l.loan().getAnnualRate() != null
                && l.loan().getAnnualRate().compareTo(MIN_RATE) >= 0
                && l.outstandingPrincipal() != null
                && l.outstandingPrincipal().signum() > 0;
    }

    private Insight describe(Reachable saved, LoanView loan) {
        BigDecimal owed = loan.outstandingPrincipal();
        BigDecimal rate = loan.loan().getAnnualRate();
        String loanName = loan.account().getName();
        String goalName = saved.goal().goal().getName();

        // Only what would actually be repaid earns the saving.
        BigDecimal applicable = saved.amount().min(owed);
        BigDecimal yearlyCost = applicable.multiply(rate)
                .divide(HUNDRED, 2, RoundingMode.HALF_UP);

        String title = money(applicable) + " you could move, while "
                + money(owed) + " costs " + rate.stripTrailingZeros().toPlainString() + "% a year";

        // Say so when most of the fund is untouchable, or the figure looks arbitrarily small
        // next to the balance the user sees on the goal itself.
        BigDecimal heldBack = saved.goal().currentAmount().subtract(saved.amount());
        String locked = heldBack.signum() > 0
                ? " " + goalName + " holds " + money(saved.goal().currentAmount()) + ", but "
                        + money(heldBack) + " has to stay put as a minimum balance."
                : "";

        String explanation = "Money in " + goalName + " doesn't reduce what " + loanName
                + " charges." + locked + " Holding " + money(applicable) + " rather than repaying costs"
                + " about " + money(yearlyCost) + " a year. Money you can reach in a hurry is still"
                + " worth having — this is the price of its size, not a reason to empty it.";

        return new Insight("loan:" + loan.loan().getId() + ":rate-mismatch",
                InsightType.RATE_MISMATCH, Severity.OPPORTUNITY,
                title, explanation, yearlyCost, null,
                InsightAction.open("Open loan", "/loans/" + loan.loan().getId()),
                EnumSet.of(Surface.TODAY, Surface.MONTH));
    }
}
