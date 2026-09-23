package com.finance.commitment.dto;

import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.transaction.domain.TransactionType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Partial update. {@code null} means "leave unchanged". */
public record UpdateCommitmentRequest(

        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        CommitmentAmountType amountType,

        @Positive(message = "Amount must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal fixedAmount,

        CommitmentFrequency frequency,

        @Min(value = 1, message = "Due day must be between 1 and 28")
        @Max(value = 28, message = "Due day must be between 1 and 28")
        Integer dueDay,

        Long accountId,

        Long categoryId,

        Boolean mandatory,

        Boolean requiresVerification,

        LocalDate activeFrom,

        LocalDate activeTo,

        @Size(max = 255, message = "Keep this to one sentence")
        String why,

        @Size(max = 255, message = "Keep this to one sentence")
        String ifSkipped,

        /** Remove the end date - the bill runs on. A flag, because {@code activeTo: null}
         *  already means "leave unchanged". */
        Boolean clearActiveTo,

        /** Remove the category. */
        Boolean clearCategory,

        /** Link this bill to a loan (LOAN + sourceId). Its amount, day, account and last
         *  payment then follow the loan; the bill keeps its name, notes and history. */
        CommitmentSource sourceType,
        Long sourceId,

        /** Unlink: the bill keeps its current figures and becomes MANUAL again. */
        Boolean clearSource,

        /** What pays it - see CreateCommitmentRequest. */
        TransactionType settleAs,
        Long toAccountId,
        /**
         * "Apply from": the first day (a cycle start) the changes take effect. Earlier months
         * keep the bill as it was - the rule is ended the day before and a copy with the
         * changes starts here. Omit (or on/before the bill's start) to change it throughout.
         * Not for bills that follow a loan or holding: their figures come from the source.
         */
        LocalDate applyFrom,

        /**
         * Why the change is being made, in the user's own words. Optional and never
         * demanded - a forced "why?" produces "." as an answer. Recorded on the plan
         * revision; its absence is recorded honestly as absent. See ADR-0015.
         */
        @Size(max = 255, message = "Keep this to one sentence")
        String reason
) {

    /** Without a stated reason. */
    public UpdateCommitmentRequest(String name, CommitmentAmountType amountType, BigDecimal fixedAmount,
                                   CommitmentFrequency frequency, Integer dueDay, Long accountId, Long categoryId,
                                   Boolean mandatory, Boolean requiresVerification, LocalDate activeFrom,
                                   LocalDate activeTo, String why, String ifSkipped, Boolean clearActiveTo,
                                   Boolean clearCategory, CommitmentSource sourceType, Long sourceId,
                                   Boolean clearSource, TransactionType settleAs, Long toAccountId,
                                   LocalDate applyFrom) {
        this(name, amountType, fixedAmount, frequency, dueDay, accountId, categoryId, mandatory, requiresVerification,
                activeFrom, activeTo, why, ifSkipped, clearActiveTo, clearCategory, sourceType, sourceId, clearSource,
                settleAs, toAccountId, applyFrom, null);
    }

    /** Every field but how the bill is paid. */
    public UpdateCommitmentRequest(String name, CommitmentAmountType amountType, BigDecimal fixedAmount,
                                   CommitmentFrequency frequency, Integer dueDay, Long accountId, Long categoryId,
                                   Boolean mandatory, Boolean requiresVerification, LocalDate activeFrom,
                                   LocalDate activeTo, String why, String ifSkipped, Boolean clearActiveTo,
                                   Boolean clearCategory, CommitmentSource sourceType, Long sourceId,
                                   Boolean clearSource) {
        this(name, amountType, fixedAmount, frequency, dueDay, accountId, categoryId, mandatory, requiresVerification,
                activeFrom, activeTo, why, ifSkipped, clearActiveTo, clearCategory, sourceType, sourceId, clearSource,
                null, null, null, null);
    }

    public UpdateCommitmentRequest(String name, CommitmentAmountType amountType, BigDecimal fixedAmount,
                                   CommitmentFrequency frequency, Integer dueDay, Long accountId, Long categoryId,
                                   Boolean mandatory, Boolean requiresVerification, LocalDate activeFrom,
                                   LocalDate activeTo, String why, String ifSkipped, Boolean clearActiveTo,
                                   Boolean clearCategory, CommitmentSource sourceType, Long sourceId,
                                   Boolean clearSource, TransactionType settleAs, Long toAccountId) {
        this(name, amountType, fixedAmount, frequency, dueDay, accountId, categoryId, mandatory, requiresVerification,
                activeFrom, activeTo, why, ifSkipped, clearActiveTo, clearCategory, sourceType, sourceId, clearSource,
                settleAs, toAccountId, null, null);
    }
}
