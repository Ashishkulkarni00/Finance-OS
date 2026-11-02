package com.finance.commitment;

/**
 * Where a bill's money has actually been coming from - the source account of one recorded
 * payment, paired with the instance it paid.
 *
 * <p>"Paid from" on a commitment is a <em>plan</em>: since USAGE_ISSUES U3 a bill may be
 * settled from any account, so the planned account is a forecast of where the money will
 * come from, not a record of where it did. Real Balance needs the record - see ADR-0020 and
 * {@code PositionServiceImpl.leavesHeldMoney}.
 *
 * <p>Rows come back oldest first; the caller keeps the last one per instance, which is the
 * most recent payment. Deliberately not an aggregate: "the latest row per group" is clumsy
 * in JPQL and the volume here is one cycle's open bills.
 */
public interface CommitmentInstancePaymentSourceProjection {

    Long getCommitmentInstanceId();

    /** The account the money actually left - not necessarily the bill's "Paid from". */
    Long getAccountId();
}
