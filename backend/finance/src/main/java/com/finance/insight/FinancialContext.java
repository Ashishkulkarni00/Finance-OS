package com.finance.insight;

import com.finance.account.domain.Account;
import com.finance.card.CreditCardView;
import com.finance.commitment.CommitmentInstanceView;
import com.finance.cycle.domain.Cycle;
import com.finance.goal.GoalView;
import com.finance.commitment.PlanAccountDrift;
import com.finance.goal.GoalWithdrawal;
import com.finance.reservation.StrandedReservation;
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
 * @param goalWithdrawals money taken back out of a goal this cycle that no bill asked for -
 *                    computed here rather than in the rule, because rules never query
 * @param strandedReservations money still set aside for a goal that has been archived or
 *                    deleted - needs archived goals, which {@code goals} deliberately
 *                    excludes, so like the others it is computed once here
 * @param planAccountDrifts bills whose recent payments keep coming from an account other
 *                    than the planned one. Needs several cycles of history and a batch
 *                    lookup of the payments behind them, so like {@code goalWithdrawals} it
 *                    is computed once here rather than by the rule that reads it
 */
public record FinancialContext(
        LocalDate today,
        Cycle cycle,
        List<CommitmentInstanceView> instances,
        List<AccountProjection> projections,
        List<CreditCardView> cards,
        List<GoalView> goals,
        List<LoanView> loans,
        List<Account> accounts,
        List<GoalWithdrawal> goalWithdrawals,
        List<PlanAccountDrift> planAccountDrifts,
        List<StrandedReservation> strandedReservations
) {
    public record AccountProjection(Account account, ProjectionResult projection) {
    }
}
