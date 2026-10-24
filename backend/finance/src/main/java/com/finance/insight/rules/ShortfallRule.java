package com.finance.insight.rules;

import com.finance.account.domain.Account;
import com.finance.insight.FinancialContext;
import com.finance.insight.Insight;
import com.finance.insight.Insight.Severity;
import com.finance.insight.Insight.Surface;
import com.finance.insight.InsightAction;
import com.finance.insight.InsightRule;
import com.finance.insight.InsightType;
import com.finance.projection.ProjectionResult;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

import static com.finance.insight.Wording.date;
import static com.finance.insight.Wording.money;

/**
 * A spending account that won't cover the bills due from it before the next salary - the
 * warning that prevents a real cost (a bounce, a late fee). Reads the account's own
 * projection: the first payment that takes it below its floor (minimum balance, else zero)
 * names the date, and the amount to move covers everything through the end of the cycle, not
 * just that payment.
 *
 * <p><strong>Every date is named, and "before salary" is not.</strong> The user read
 * "₹17,429 is planned to leave it before salary" and asked which salary - a fair question,
 * since the phrase is shorthand for "before the cycle ends", which is a concept only this
 * product has. The projection's horizon is the cycle's last day, so the salary is the day
 * after it, and saying so costs six words.
 *
 * <p>"Move X in <strong>by</strong> the 1st", not "before the 1st": the bill is due on that
 * date, so money arriving on it is in time, and "before" quietly asks for a day earlier than
 * necessary.
 */
@Component
public class ShortfallRule implements InsightRule {

    @Override
    public List<Insight> evaluate(FinancialContext ctx) {
        List<Insight> out = new ArrayList<>();
        for (FinancialContext.AccountProjection ap : ctx.projections()) {
            ProjectionResult p = ap.projection();
            ProjectionResult.Deduction first = p.deductions().stream()
                    .filter(d -> Boolean.FALSE.equals(d.covered()))
                    .findFirst().orElse(null);
            if (first == null) {
                continue;
            }
            Account account = ap.account();
            BigDecimal floor = account.getMinimumBalance() == null ? BigDecimal.ZERO : account.getMinimumBalance();
            BigDecimal lowest = p.deductions().stream().map(ProjectionResult.Deduction::balanceAfter)
                    .min(BigDecimal::compareTo).orElse(first.balanceAfter());
            BigDecimal shortBy = floor.subtract(lowest);
            BigDecimal leaving = p.currentBalance().subtract(lowest);
            // The projection runs to the end of the cycle, so the next salary is the day
            // after it. Naming that date is what turns "before salary" - which salary? -
            // into something readable once.
            String nextSalary = date(p.projectionDate().plusDays(1), ctx.today());
            out.add(new Insight("shortfall:account:" + account.getId(), InsightType.SHORTFALL, Severity.CRITICAL,
                    account.getName() + " won't cover " + first.name() + " on " + date(first.dueDate()),
                    money(leaving) + " of bills leave it before your next salary on " + nextSalary
                            + "; it holds " + money(p.currentBalance())
                            + (floor.signum() > 0 ? ", and must keep " + money(floor) : "")
                            + ". Move " + money(shortBy) + " in by " + date(first.dueDate()) + ".",
                    shortBy, first.dueDate(),
                    InsightAction.transfer("Move money", null, account.getId(), shortBy),
                    EnumSet.of(Surface.TODAY, Surface.MONTH)));
        }
        return out;
    }
}
