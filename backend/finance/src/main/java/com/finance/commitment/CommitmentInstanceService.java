package com.finance.commitment;

import com.finance.commitment.domain.CommitmentInstance;
import com.finance.commitment.dto.SettleCommitmentInstanceRequest;

import java.util.List;

public interface CommitmentInstanceService {

    /**
     * Every instance for this cycle, generating any that are missing from active
     * commitments first (idempotent - safe to call repeatedly). Also lazily promotes
     * any PENDING instance whose due date has passed to OVERDUE.
     */
    List<CommitmentInstanceView> listForCycle(Long cycleId);

    /** Recent occurrences of one rule, across cycles, most recent first - the rule
     *  detail route's history. */
    List<CommitmentInstance> recentForCommitment(Long commitmentId);

    /** "₹23,700 of ₹28,500 settled · 7 of 8" - the Plan zone's progress line. */
    CommitmentPlanProgress planProgress(Long cycleId);

    /** Income vs committed for the cycle - the Plan tab's Standing mirror line. */
    CycleStanding standing(Long cycleId);

    /** The month in one line: expected in − committed − planned savings = flexible, and spent so far. */
    CycleShape shape(Long cycleId);

    /** A month against its plan - income, payments, set aside, flexible, what didn't happen. */
    CycleReview review(Long cycleId);

    CommitmentInstanceView getById(Long id);

    /** Everything the detail route shows: the rule, its consequence text, linked transaction, history. */
    CommitmentInstanceDetailView getDetail(Long id);

    /** Manually links a transaction as this instance's payment - the auto-match fallback. */
    CommitmentInstanceView settle(Long id, SettleCommitmentInstanceRequest request);

    /** Moves an UNVERIFIED instance to PAID. Cycle-scoped by construction - see ADR note on rule 11. */
    CommitmentInstanceView confirm(Long id);

    /** Don't pay this optional bill this cycle - it stops counting against what's free. */
    CommitmentInstanceView skip(Long id);

    /** Undo a skip - the bill is owed again. */
    CommitmentInstanceView unskip(Long id);

    /** Gives an unpaid occurrence an expected amount (an estimate is fine), so a variable
     *  mandatory bill stops holding Real Balance at INCOMPLETE until it's paid. */
    CommitmentInstanceView setExpectedAmount(Long id, java.math.BigDecimal expectedAmount);
}
