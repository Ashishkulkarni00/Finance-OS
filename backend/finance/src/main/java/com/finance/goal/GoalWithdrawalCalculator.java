package com.finance.goal;

import com.finance.account.domain.Account;
import com.finance.common.money.MoneyScale;
import com.finance.cycle.domain.Cycle;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.domain.Transaction;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * <strong>Money taken back out of a goal, that no plan asked for.</strong>
 *
 * <p>Kosh recorded both halves of this faithfully and said nothing about the contradiction:
 * the cycle's plan moved ₹15,000 into the emergency fund, ₹11,000 came back out eleven days
 * later, and Real Balance rose by ₹11,000 and went green. The arithmetic was right - that
 * money genuinely is spendable again - but <strong>ADR-0015 says a plan change records what
 * changed, when and why, and that "a silent plan rewrite is a defect"</strong>. Taking back
 * money a goal was funded with is a plan change that nothing recorded.
 *
 * <p>This does not alter a single figure. Real Balance still counts the money, because the
 * money is there. It exists so the deviation can be <em>said</em>.
 *
 * <h2>What counts, and what deliberately does not</h2>
 * <ul>
 *   <li><strong>Transfers only.</strong> An expense paid straight out of a goal's account is
 *       arguably the same act, but it is also how a goal is legitimately spent when its time
 *       comes - a trip booked from the trip's own account. Treating that as a raid would fire
 *       on the goal working exactly as intended. Left out on purpose.</li>
 *   <li><strong>Nothing a commitment paid for.</strong> A bill planned to be settled from a
 *       goal's account is the plan running, not a deviation. V23's payments table is what
 *       makes that distinction possible at all - before it there was no reliable way to ask
 *       "did a bill pay for this entry".</li>
 *   <li><strong>Net, and in date order.</strong> Money moved back in cancels money moved out,
 *       so putting it back makes the finding disappear rather than leaving a permanent
 *       accusation on screen. But only a deposit that lands <em>after</em> a withdrawal can
 *       undo it: the running total is walked chronologically and never falls below zero, so
 *       saving done earlier in the month cannot absorb a raid made later in it.</li>
 * </ul>
 */
@Component
public class GoalWithdrawalCalculator {

    private final TransactionRepository transactions;

    public GoalWithdrawalCalculator(TransactionRepository transactions) {
        this.transactions = transactions;
    }

    /**
     * One entry per goal whose account is net down this cycle through movements nothing
     * planned. Goals with no linked account, and goals that are square, are absent.
     *
     * @param goals    already loaded by the caller - this must not re-query them, so that the
     *                 insight context stays one pass over the data (see {@code FinancialContext})
     * @param accounts already loaded, for naming the account in the sentence
     */
    public List<GoalWithdrawal> forCycle(List<GoalView> goals, List<Account> accounts, Cycle cycle, Long userId) {
        Map<Long, Long> goalByAccount = new HashMap<>();
        for (GoalView view : goals) {
            Long accountId = view.goal().getLinkedAccountId();
            // A goal tracked in a reservation rather than an account has no balance to raid.
            // `putIfAbsent`: if two goals share an account there is no way to attribute the
            // movement to one of them, and guessing would name the wrong goal on screen.
            if (accountId != null) {
                goalByAccount.putIfAbsent(accountId, view.goal().getId());
            }
        }
        if (goalByAccount.isEmpty()) {
            return List.of();
        }

        Set<Long> accountIds = goalByAccount.keySet();
        List<Transaction> moves = transactions.findUnplannedTransfersTouching(
                userId, accountIds, cycle.getStartDate(), cycle.getEndDate());

        // **Chronological, and a deposit can only cancel a withdrawal that came before it.**
        //
        // The first version simply netted the cycle's ins against its outs, and on real data
        // it reported ₹1,000 where ₹11,000 had left. Two earlier deposits - ₹9,500 on 30 Sept
        // and ₹500 on 2 Oct, both of them *contributions* - had cancelled most of a withdrawal
        // made on the 9th. Money paid in nine days before a raid plainly did not put that raid
        // back, so the running total is walked in date order and never goes below zero: a
        // deposit reduces only what is outstanding at the moment it lands.
        //
        // The practical effect is the one that matters: move the money back and the finding
        // disappears, but last month's saving cannot silently absorb this month's withdrawal.
        //
        // (It also happens to sidestep a data scar - those two deposits are the orphaned
        // entries from the pre-V23 overwrite, so they look unplanned when they were not. The
        // chronology is the real argument; this is just a welcome side effect.)
        Map<Long, BigDecimal> outstanding = new HashMap<>();
        Map<Long, LocalDate> lastOut = new HashMap<>();
        Map<Long, Integer> outCount = new HashMap<>();
        for (Transaction t : moves) {
            boolean leaving = accountIds.contains(t.getAccountId());
            boolean arriving = t.getToAccountId() != null && accountIds.contains(t.getToAccountId());
            // A transfer between two goal accounts nets to nothing overall and belongs to
            // neither as a withdrawal - the money never stopped being set aside.
            if (leaving && arriving) {
                continue;
            }
            if (leaving) {
                Long id = t.getAccountId();
                outstanding.merge(id, t.getAmount(), BigDecimal::add);
                outCount.merge(id, 1, Integer::sum);
                lastOut.merge(id, t.getDate(), (a, b) -> b.isAfter(a) ? b : a);
            } else if (arriving) {
                Long id = t.getToAccountId();
                BigDecimal left = outstanding.getOrDefault(id, BigDecimal.ZERO).subtract(t.getAmount());
                outstanding.put(id, left.max(BigDecimal.ZERO));
            }
        }

        Map<Long, String> accountNames = accounts.stream()
                .collect(Collectors.toMap(Account::getId, Account::getName, (a, b) -> a));
        Map<Long, GoalView> goalsById = goals.stream()
                .collect(Collectors.toMap(g -> g.goal().getId(), g -> g, (a, b) -> a));

        List<GoalWithdrawal> out = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : outstanding.entrySet()) {
            if (entry.getValue().signum() <= 0) {
                continue;
            }
            Long accountId = entry.getKey();
            GoalView goal = goalsById.get(goalByAccount.get(accountId));
            if (goal == null) {
                continue;
            }
            out.add(new GoalWithdrawal(
                    goal.goal().getId(),
                    goal.goal().getName(),
                    accountId,
                    accountNames.getOrDefault(accountId, "an account"),
                    MoneyScale.normalise(entry.getValue()),
                    lastOut.get(accountId),
                    outCount.getOrDefault(accountId, 0)));
        }
        return out;
    }
}
