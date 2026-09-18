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
 * A spending account that won't cover what leaves it before salary - the warning that
 * prevents a real cost (a bounce, a late fee). Reads the account's own projection: the first
 * payment that takes it below its floor (minimum balance, else zero) names the date, and the
 * amount to move covers everything through the end of the month, not just that payment.
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
            out.add(new Insight("shortfall:account:" + account.getId(), InsightType.SHORTFALL, Severity.CRITICAL,
                    account.getName() + " won't cover " + first.name() + " on " + date(first.dueDate()),
                    money(leaving) + " is planned to leave it before salary; it holds " + money(p.currentBalance())
                            + (floor.signum() > 0 ? " (minimum " + money(floor) + ")" : "")
                            + ". Move " + money(shortBy) + " in before " + date(first.dueDate()) + ".",
                    shortBy, first.dueDate(),
                    InsightAction.transfer("Move money", null, account.getId(), shortBy),
                    EnumSet.of(Surface.TODAY, Surface.MONTH)));
        }
        return out;
    }
}
