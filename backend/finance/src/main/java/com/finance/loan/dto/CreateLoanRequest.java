package com.finance.loan.dto;

import com.finance.loan.domain.LoanConfidence;
import com.finance.loan.domain.LoanPaidVia;
import com.finance.loan.domain.LoanStatus;
import com.finance.loan.domain.RateType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A loan, described by where it stands (V13). The original loan - principal, tenure,
 * start date - is optional background; everything shown is derived from the outstanding
 * balance, its date, the EMIs left and the EMI.
 */
public record CreateLoanRequest(

        @NotNull(message = "Which account tracks this loan?")
        Long accountId,

        @NotBlank(message = "Who's the lender?")
        @Size(max = 100)
        String lender,

        // --- where it stands ----------------------------------------------------------------

        @NotNull(message = "How much is still owed?")
        @PositiveOrZero(message = "What's owed can't be negative")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal outstandingBalance,

        @NotNull(message = "Which date is that amount true for?")
        LocalDate balanceAsOf,

        @NotNull(message = "How many EMIs are left?")
        @Min(value = 0, message = "EMIs left can't be negative")
        Integer emisRemaining,

        /** The first EMI after {@code balanceAsOf}. Optional - without it, the first EMI
         *  day after that date. */
        LocalDate firstEmiDate,

        @NotNull(message = "What's the EMI?")
        @Positive(message = "EMI must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal emi,

        @Min(1)
        @Max(31)
        Integer emiDay,

        /** Optional: a rate nobody has supplied is TBD, not zero. */
        @Digits(integer = 3, fraction = 3, message = "Use at most 3 decimal places")
        BigDecimal annualRate,

        // --- the original loan, optional ----------------------------------------------------

        @Positive(message = "Principal must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal principal,

        @Min(value = 1, message = "A loan runs for at least one month")
        Integer tenureMonths,

        /** When the money was disbursed. */
        LocalDate startDate,

        /** The first EMI of the original loan. */
        LocalDate originalFirstEmiDate,

        // --- how it's paid ------------------------------------------------------------------

        @NotNull(message = "Is this paid from a bank account or billed to a card?")
        LoanPaidVia paidVia,

        /** Defaults to ESTIMATED, or TBD when no rate was supplied - see the service. */
        LoanConfidence confidence,

        LoanStatus status,

        /** The account the EMI debits - not the loan's own liability account. */
        Long payFromAccountId,

        RateType rateType,

        @Size(max = 500)
        String note
) {
}
