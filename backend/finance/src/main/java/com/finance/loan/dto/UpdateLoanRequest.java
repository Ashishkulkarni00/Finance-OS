package com.finance.loan.dto;

import com.finance.loan.domain.LoanConfidence;
import com.finance.loan.domain.LoanPaidVia;
import com.finance.loan.domain.LoanStatus;
import com.finance.loan.domain.RateType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Partial update. {@code null} means "leave unchanged".
 *
 * <p>Updating where the loan stands - outstanding balance, its date, EMIs left - is how a
 * missed or early EMI is corrected, since nothing records loan payments: re-state the
 * position and everything re-derives from it.
 */
public record UpdateLoanRequest(

        @Size(max = 100)
        String lender,

        // --- where it stands ----------------------------------------------------------------

        @PositiveOrZero(message = "What's owed can't be negative")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal outstandingBalance,

        LocalDate balanceAsOf,

        @Min(value = 0, message = "EMIs left can't be negative")
        Integer emisRemaining,

        LocalDate firstEmiDate,

        // --- the original loan, background --------------------------------------------------

        @Positive(message = "Principal must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal principal,

        @Min(value = 1, message = "A loan runs for at least one month")
        Integer tenureMonths,

        LocalDate startDate,

        LocalDate originalFirstEmiDate,

        // --- terms --------------------------------------------------------------------------

        @Digits(integer = 3, fraction = 3, message = "Use at most 3 decimal places")
        BigDecimal annualRate,

        /** Remove a rate that was entered by mistake. A separate flag because
         *  {@code annualRate: null} already means "leave unchanged". */
        Boolean clearAnnualRate,

        @Positive(message = "EMI must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal emi,

        LoanPaidVia paidVia,

        /** Supplying real terms is what moves a loan from ESTIMATED/TBD to CONFIRMED. */
        LoanConfidence confidence,

        LoanStatus status,

        @Min(1)
        @Max(31)
        Integer emiDay,

        Long payFromAccountId,

        /** Forget which account the EMI leaves from. */
        Boolean clearPayFromAccount,

        RateType rateType,

        @Size(max = 500)
        String note
) {
}
