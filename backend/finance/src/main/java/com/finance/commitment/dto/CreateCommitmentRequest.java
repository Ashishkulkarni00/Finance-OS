package com.finance.commitment.dto;

import com.finance.commitment.domain.CommitmentAmountType;
import com.finance.commitment.domain.CommitmentFrequency;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.transaction.domain.TransactionType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateCommitmentRequest(

        @NotBlank(message = "Give this commitment a name you'll recognise")
        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        @NotNull(message = "Is the amount fixed, or does it vary each cycle?")
        CommitmentAmountType amountType,

        @Positive(message = "Amount must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal fixedAmount,

        @NotNull(message = "How often does this fall due?")
        CommitmentFrequency frequency,

        @NotNull(message = "Which day of the month is this due?")
        @Min(value = 1, message = "Due day must be between 1 and 28")
        @Max(value = 28, message = "Due day must be between 1 and 28")
        Integer dueDay,

        @NotNull(message = "Which account does this get paid from?")
        Long accountId,

        Long categoryId,

        Boolean mandatory,

        Boolean requiresVerification,

        @NotNull(message = "When does this commitment start?")
        LocalDate activeFrom,

        LocalDate activeTo,

        @Size(max = 255, message = "Keep this to one sentence")
        String why,

        @Size(max = 255, message = "Keep this to one sentence")
        String ifSkipped,

        /** What pays it: EXPENSE (default), TRANSFER to your own account, INVESTMENT, or INCOME. */
        TransactionType settleAs,

        /** Where the money goes for a TRANSFER or INVESTMENT bill. */
        Long toAccountId,

        /** What the bill follows - MANUAL (default), LOAN, INVESTMENT or GOAL - and which one. */
        CommitmentSource sourceType,
        Long sourceId,

        /** Why this is being added, in the user's own words. Optional - see ADR-0015. */
        @Size(max = 255, message = "Keep this to one sentence")
        String reason
) {

    /** Without a stated reason. */
    public CreateCommitmentRequest(String name, CommitmentAmountType amountType, BigDecimal fixedAmount,
                                   CommitmentFrequency frequency, Integer dueDay, Long accountId, Long categoryId,
                                   Boolean mandatory, Boolean requiresVerification, LocalDate activeFrom,
                                   LocalDate activeTo, String why, String ifSkipped, TransactionType settleAs,
                                   Long toAccountId, CommitmentSource sourceType, Long sourceId) {
        this(name, amountType, fixedAmount, frequency, dueDay, accountId, categoryId, mandatory, requiresVerification,
                activeFrom, activeTo, why, ifSkipped, settleAs, toAccountId, sourceType, sourceId, null);
    }

    /** A plain bill: paid as an expense, following nothing. */
    public CreateCommitmentRequest(String name, CommitmentAmountType amountType, BigDecimal fixedAmount,
                                   CommitmentFrequency frequency, Integer dueDay, Long accountId, Long categoryId,
                                   Boolean mandatory, Boolean requiresVerification, LocalDate activeFrom,
                                   LocalDate activeTo, String why, String ifSkipped) {
        this(name, amountType, fixedAmount, frequency, dueDay, accountId, categoryId, mandatory, requiresVerification,
                activeFrom, activeTo, why, ifSkipped, null, null, null, null, null);
    }
}
