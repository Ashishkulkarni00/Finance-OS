package com.finance.commitment;

import com.finance.account.domain.Account;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.domain.CommitmentInstanceStatus;
import com.finance.transaction.TransactionDateProjection;
import com.finance.transaction.TransactionService;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Finds bills whose plan names one account while the payments keep coming from another.
 *
 * <p><strong>Why.</strong> On this user's real data, *Clothes shopping* (₹12,000, Myntra)
 * and *Credit card remaining* were both set to pay from HDFC Salary and both were actually
 * put on the HDFC Money back card. Every month the projection held ₹12,000 aside out of the
 * salary account for a payment that never left it, *Before payday* named the wrong account,
 * and settling booked card spending against the bank. The same charges were mis-booked in
 * October and then again in November — the product watched it happen twice and said nothing
 * (FIX_BACKLOG 2.16).
 *
 * <p><strong>Two in a row, not one.</strong> Paying a bill from somewhere else once is
 * ordinary and nobody's business: the Settle sheet allows any account on purpose, because
 * <em>"Paid from is the plan, not a record"</em>. A warning on a one-off is noise, and noise
 * is how a reader learns to skip the warning that matters. A run of two from the same other
 * account is a habit, and a plan that disagrees with a habit is simply out of date.
 *
 * <p><strong>Consecutive, newest first, and it stops at the first disagreement.</strong>
 * Paying from the planned account breaks the run, so correcting course makes the finding
 * disappear rather than leaving a permanent accusation on screen — the same principle
 * {@code GoalWithdrawalCalculator} applies by netting deposits against withdrawals.
 *
 * <p><strong>One extra query per bill, one batch for the payments.</strong> The per-bill
 * query is the existing {@code findTop6…} finder and is bounded by the cycle's own
 * commitments; every linked transaction across all of them is then resolved in a single
 * {@code settlementFactsByIds} call rather than one lookup per payment.
 */
@Component
public class PlanAccountDriftCalculator {

    /** A run this long is a habit. See the class note on why one is not. */
    private static final int MIN_CONSECUTIVE = 2;

    private final CommitmentInstanceRepository instances;
    private final TransactionService transactions;

    public PlanAccountDriftCalculator(CommitmentInstanceRepository instances, TransactionService transactions) {
        this.instances = instances;
        this.transactions = transactions;
    }

    /**
     * One entry per bill that is drifting. Bills paid where the plan says, bills settled
     * only once from elsewhere, and bills never settled at all are absent.
     *
     * @param commitments the rules to examine — the caller's existing list, so this adds no
     *                    query of its own for them
     * @param accounts    already loaded, for naming both accounts in the sentence
     */
    public List<PlanAccountDrift> forCommitments(List<Commitment> commitments, List<Account> accounts, Long userId) {
        if (commitments.isEmpty()) {
            return List.of();
        }
        Map<Long, String> accountNames = new HashMap<>();
        for (Account account : accounts) {
            accountNames.put(account.getId(), account.getName());
        }

        // Every candidate's recent history first, then one lookup for all their payments.
        // Resolving each payment as it is met would be a query per settled instance.
        Map<Long, List<CommitmentInstance>> history = new LinkedHashMap<>();
        Set<Long> transactionIds = new HashSet<>();
        for (Commitment commitment : commitments) {
            if (commitment.getAccountId() == null) {
                continue;
            }
            List<CommitmentInstance> recent =
                    instances.findTop6ByCommitmentIdAndUserIdOrderByDueDateDesc(commitment.getId(), userId);
            if (recent.isEmpty()) {
                continue;
            }
            history.put(commitment.getId(), recent);
            for (CommitmentInstance instance : recent) {
                if (instance.getLinkedTransactionId() != null) {
                    transactionIds.add(instance.getLinkedTransactionId());
                }
            }
        }
        if (transactionIds.isEmpty()) {
            return List.of();
        }
        Map<Long, TransactionDateProjection> facts = transactions.settlementFactsByIds(transactionIds);

        List<PlanAccountDrift> out = new ArrayList<>();
        for (Commitment commitment : commitments) {
            List<CommitmentInstance> recent = history.get(commitment.getId());
            if (recent == null) {
                continue;
            }
            PlanAccountDrift drift = driftFor(commitment, recent, facts, accountNames);
            if (drift != null) {
                out.add(drift);
            }
        }
        return out;
    }

    /**
     * The run of most-recent settlements that all came from one account other than the
     * planned one, or null when there is no such run of at least {@link #MIN_CONSECUTIVE}.
     *
     * <p>Unsettled occurrences are skipped rather than treated as breaking the run: a bill
     * that has not been paid yet says nothing about where it will be paid from, and a
     * pending December instance must not hide what October and November both did.
     */
    private PlanAccountDrift driftFor(Commitment commitment,
                                      List<CommitmentInstance> recentFirst,
                                      Map<Long, TransactionDateProjection> facts,
                                      Map<Long, String> accountNames) {
        Long planned = commitment.getAccountId();
        Long actual = null;
        int consecutive = 0;
        java.time.LocalDate lastOn = null;

        for (CommitmentInstance instance : recentFirst) {
            if (instance.getStatus() != CommitmentInstanceStatus.PAID
                    && instance.getStatus() != CommitmentInstanceStatus.SETTLED_EARLIER) {
                continue;
            }
            Long linked = instance.getLinkedTransactionId();
            TransactionDateProjection fact = linked == null ? null : facts.get(linked);
            if (fact == null || fact.getAccountId() == null) {
                // Settled with no payment behind it to read. Unknown, not agreement - and
                // null never means "the same" here any more than it means zero elsewhere.
                break;
            }
            Long from = fact.getAccountId();
            if (from.equals(planned)) {
                break;
            }
            if (actual == null) {
                actual = from;
                lastOn = fact.getDate();
            } else if (!actual.equals(from)) {
                // Two different other accounts is not a habit, it is a bill paid from
                // whatever had money in it. There is no plan to suggest.
                break;
            }
            consecutive++;
        }

        if (actual == null || consecutive < MIN_CONSECUTIVE) {
            return null;
        }
        return new PlanAccountDrift(
                commitment.getId(), commitment.getName(),
                planned, accountNames.getOrDefault(planned, "its planned account"),
                actual, accountNames.getOrDefault(actual, "another account"),
                consecutive, lastOn);
    }
}
