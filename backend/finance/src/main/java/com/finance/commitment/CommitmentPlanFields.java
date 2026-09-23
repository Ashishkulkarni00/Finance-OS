package com.finance.commitment;

import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.plan.PlanChangeDraft;
import com.finance.transaction.domain.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.function.Function;

/**
 * A commitment's plan-relevant fields, captured before a change so they can be compared
 * after it.
 *
 * <p>Only the fields that are part of the <em>plan</em>: what it costs, when it falls due,
 * where it is paid from, whether it can be skipped and how long it runs. {@code why} and
 * {@code ifSkipped} are notes about the plan rather than the plan itself, and logging them
 * would bury a ₹150 increase under a typo fix.
 *
 * <p>Accounts and categories are captured by <strong>name</strong>, not id. "Paid from:
 * 4 → 7" tells a person nothing; "Paid from: HDFC Savings → Kotak" is the change they
 * actually made. Names are resolved at capture time and frozen, so the log still reads
 * correctly after an account is renamed - what it says is what was true then.
 *
 * <p>The labels live here, with the domain that knows them, not in the plan package - see
 * ADR-0015.
 */
record CommitmentPlanFields(
        String name,
        CommitmentAmountType amountType,
        BigDecimal fixedAmount,
        CommitmentFrequency frequency,
        Integer dueDay,
        String accountName,
        String toAccountName,
        String categoryName,
        Boolean mandatory,
        Boolean requiresVerification,
        TransactionType settleAs,
        String source,
        LocalDate activeFrom,
        LocalDate activeTo,
        BigDecimal monthlyCost
) {

    /**
     * @param accountName  resolves an account id to its name; must tolerate a deleted
     *                     account, since a bill can outlive the account it was paid from
     * @param categoryName the same for categories
     */
    static CommitmentPlanFields of(Commitment commitment,
                                   Function<Long, String> accountName,
                                   Function<Long, String> categoryName) {
        return new CommitmentPlanFields(
                commitment.getName(),
                commitment.getAmountType(),
                commitment.getFixedAmount(),
                commitment.getFrequency(),
                commitment.getDueDay(),
                lookup(commitment.getAccountId(), accountName),
                lookup(commitment.getToAccountId(), accountName),
                lookup(commitment.getCategoryId(), categoryName),
                commitment.isMandatory(),
                commitment.isRequiresVerification(),
                commitment.getSettleAs(),
                source(commitment.getSourceType(), commitment.getSourceId()),
                commitment.getActiveFrom(),
                commitment.getActiveTo(),
                CommitmentMonthlyCost.of(commitment));
    }

    /**
     * The same fields, as if the line had always started on this date.
     *
     * <p>Used on the "before" side of a supersession: splitting a rule moves the start date
     * by mechanism, not by decision, and logging "Starts: 1 Apr → 28 Oct" alongside the
     * amount change the user actually made would describe the plumbing rather than the
     * change.
     */
    CommitmentPlanFields startingOn(LocalDate date) {
        return new CommitmentPlanFields(name, amountType, fixedAmount, frequency, dueDay,
                accountName, toAccountName, categoryName, mandatory, requiresVerification,
                settleAs, source, date, activeTo, monthlyCost);
    }

    /**
     * Adds a line to the draft for every field that actually moved. The draft skips the
     * ones that did not, so offering all of them is safe.
     */
    void diffInto(PlanChangeDraft draft, CommitmentPlanFields after) {
        draft.text("name", "Name", name, after.name())
                .text("amountType", "Amount type", amountType, after.amountType())
                .money("fixedAmount", "Amount", fixedAmount, after.fixedAmount())
                .text("frequency", "How often", frequency, after.frequency())
                .number("dueDay", "Due day", dueDay, after.dueDay())
                .text("account", "Paid from", accountName, after.accountName())
                .text("toAccount", "Goes to", toAccountName, after.toAccountName())
                .text("category", "Category", categoryName, after.categoryName())
                .flag("mandatory", "Must be paid", mandatory, after.mandatory())
                .flag("requiresVerification", "Needs checking", requiresVerification, after.requiresVerification())
                .text("settleAs", "Paid as", settleAs, after.settleAs())
                .text("source", "Follows", source, after.source())
                .date("activeFrom", "Starts", activeFrom, after.activeFrom())
                .date("activeTo", "Last payment", activeTo, after.activeTo());
    }

    private static String lookup(Long id, Function<Long, String> resolver) {
        if (id == null) {
            return null;
        }
        try {
            return resolver.apply(id);
        } catch (RuntimeException e) {
            // The name is a courtesy for the log, never the reason a plan edit fails.
            return null;
        }
    }

    /** "Nothing", or "LOAN #12" - one line rather than two, since the pair only means anything together. */
    private static String source(CommitmentSource type, Long id) {
        if (type == null || type == CommitmentSource.MANUAL) {
            return null;
        }
        return id == null ? type.name() : type.name() + " #" + id;
    }
}
