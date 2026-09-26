package com.finance.insight;

import com.finance.account.domain.Account;
import com.finance.card.CreditCardView;
import com.finance.commitment.CommitmentInstanceView;
import com.finance.cycle.domain.Cycle;
import com.finance.goal.GoalView;
import com.finance.loan.LoanView;
import com.finance.projection.ProjectionResult;

import java.time.LocalDate;
import java.util.List;

/**
 * Everything the rules read, built once per request - rules never query on their own, so
 * they stay pure and cheap and can't disagree about the facts (PRODUCT_AUDIT.md §6).
 *
 * @param projections one per spending account: what leaves it before salary, in date order
 * @param accounts    every active account, spendable or not - {@code projections} covers only
 *                    the spending ones, so a rule reasoning about money that is deliberately
 *                    <em>not</em> spendable (a fund, a wallet) has nowhere else to read it
 */
public record FinancialContext(
        LocalDate today,
        Cycle cycle,
        List<CommitmentInstanceView> instances,
        List<AccountProjection> projections,
        List<CreditCardView> cards,
        List<GoalView> goals,
        List<LoanView> loans,
        List<Account> accounts
) {
    public record AccountProjection(Account account, ProjectionResult projection) {
    }
}
