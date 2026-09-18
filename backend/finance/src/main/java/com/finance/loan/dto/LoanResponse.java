package com.finance.loan.dto;

import com.finance.account.dto.AccountSummary;
import com.finance.loan.domain.LoanConfidence;
import com.finance.loan.domain.LoanPaidVia;
import com.finance.loan.domain.LoanStatus;
import com.finance.loan.domain.RateType;
import tools.jackson.databind.annotation.JsonSerialize;
import com.finance.common.money.MoneySerializer;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LoanResponse(
        Long id,

        /** The LOAN account - the liability itself, not where the EMI comes from. */
        AccountSummary account,

        /** The account the EMI debits. Null when never recorded - never inferred. */
        AccountSummary payFromAccount,

        String lender,

        // --- where the loan stands (V13) - everything below is derived from these -------

        /** What was owed on {@code balanceAsOf}, as stated. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal outstandingBalance,

        LocalDate balanceAsOf,

        /** EMIs still to pay as of {@code balanceAsOf}. */
        int emisRemaining,

        /** The first EMI after {@code balanceAsOf}. */
        LocalDate firstEmiDate,

        // --- the original loan - background only, all optional ----------------------------

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal principal,

        /** Null when the rate was never supplied - the workbook's "TBD". */
        BigDecimal annualRate,
        RateType rateType,

        Integer tenureMonths,
        LocalDate startDate,
        LocalDate originalFirstEmiDate,
        Integer emiDay,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal emi,

        LoanPaidVia paidVia,
        LoanConfidence confidence,
        LoanStatus status,
        String note,

        // --- derived ------------------------------------------------------------------------

        /** Owed today. The stated balance until an EMI falls due after it; then needs a rate. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal outstandingPrincipal,

        /** Repaid since {@code balanceAsOf}: outstandingBalance − outstandingPrincipal. Null
         *  whenever outstandingPrincipal is. */
        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal amountRepaid,

        /** The last remaining EMI's due date. Known without a rate. */
        LocalDate payoffDate,

        int emisLeft,

        @JsonSerialize(using = MoneySerializer.class)
        BigDecimal remainingPayments,

        /** EMIs it actually takes to clear the outstanding balance at this rate; -1 if the
         *  EMI never clears it; null without a rate. */
        Integer impliedEmisRemaining,

        /** Whether the outstanding balance, rate, EMI and EMIs left agree. Null without a rate. */
        Boolean termsConsistent,

        /** The plan bill that pays this EMI (it follows the loan), or null if the EMI
         *  isn't in the plan yet. */
        Long planCommitmentId
) {
}
