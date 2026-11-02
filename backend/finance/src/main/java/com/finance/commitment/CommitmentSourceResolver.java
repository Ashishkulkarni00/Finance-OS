package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentInstance;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * <strong>Where a bill's money actually comes from.</strong> The one implementation, so the
 * figures that depend on it cannot drift apart.
 *
 * <p>A commitment's "Paid from" is a <em>plan</em>. Since USAGE_ISSUES U3 (2026-10-02) a bill
 * may be settled from any account, so that field stopped being a constraint the data has to
 * obey and became a forecast of where the money will come from. Three derived figures went on
 * reading it as fact, and each was wrong in its own way:
 *
 * <ul>
 *   <li>{@code committed} in {@code PositionServiceImpl} - ₹1,000 left spending money having
 *       never been counted as promised (FIX_BACKLOG 1.8, ADR-0020).</li>
 *   <li>The per-account projection behind the shortfall warning - it warns about the account
 *       the plan names, which may not be the one being drawn on (FIX_BACKLOG 1.9).</li>
 *   <li>{@code CommitmentBucketClassifier} - still unfixed, and deliberately so; its decision
 *       has a dependency the others do not (FIX_BACKLOG 1.11).</li>
 * </ul>
 *
 * <p><strong>The rule: evidence first, plan second.</strong> The source is the account of the
 * instance's most recent recorded payment; a bill with no payments has no evidence, so its
 * plan is the best answer available - and for most bills it is also the right one.
 *
 * <p><strong>Only the source.</strong> A commitment's <em>destination</em> is not a guess:
 * {@code settle} enforces it, because money that arrived somewhere else did not pay this bill.
 * Callers keep reading {@code getToAccountId()} straight from the plan, and should say so.
 */
@Component
public class CommitmentSourceResolver {

    private final CommitmentInstancePaymentRepository payments;

    public CommitmentSourceResolver(CommitmentInstancePaymentRepository payments) {
        this.payments = payments;
    }

    /**
     * The account each of these instances has actually been paid from, for those that have
     * been paid at least once. Instances with no payments are absent rather than null-mapped,
     * so {@link #effectiveSource} can tell "no evidence" from "evidence says null".
     *
     * <p>One query for the whole set. Rows arrive oldest first, so putting each into the map
     * leaves the most recent payment per instance.
     */
    public Map<Long, Long> actualSourceByInstance(Collection<Long> instanceIds, Long userId) {
        Map<Long, Long> actual = new HashMap<>();
        if (instanceIds.isEmpty()) {
            return actual;
        }
        for (CommitmentInstancePaymentSourceProjection row : payments.findActualSourceAccounts(instanceIds, userId)) {
            actual.put(row.getCommitmentInstanceId(), row.getAccountId());
        }
        return actual;
    }

    /**
     * Where this instance's money comes from: what it has been paid from if anything, else
     * what it plans to be paid from.
     *
     * @param actual the map from {@link #actualSourceByInstance} for the batch this instance
     *               belongs to - passed in rather than queried per instance, so a caller
     *               looping over a cycle's bills makes one query, not N.
     */
    public Long effectiveSource(CommitmentInstance instance, Commitment commitment, Map<Long, Long> actual) {
        Long evidence = actual.get(instance.getId());
        if (evidence != null) {
            return evidence;
        }
        return commitment == null ? null : commitment.getAccountId();
    }
}
