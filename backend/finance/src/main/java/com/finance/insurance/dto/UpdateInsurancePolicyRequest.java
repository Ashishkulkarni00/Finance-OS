package com.finance.insurance.dto;

import com.finance.insurance.domain.InsuranceType;
import com.finance.insurance.domain.PremiumFrequency;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Partial update. {@code null} means "leave unchanged"; the {@code clear*} flags remove a value. */
public record UpdateInsurancePolicyRequest(

        InsuranceType type,

        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        @Size(max = 100)
        String insurer,

        @Size(min = 4, max = 4, message = "Just the last four digits")
        String policyLastFour,

        @Positive(message = "Cover must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal coverAmount,

        @Positive(message = "Premium must be more than zero")
        @Digits(integer = 13, fraction = 2, message = "Use at most 2 decimal places")
        BigDecimal premium,

        PremiumFrequency premiumFrequency,

        LocalDate renewsOn,
        LocalDate startedOn,

        @Size(max = 255, message = "Keep this short")
        String covers,

        @Size(max = 255, message = "Keep this to one sentence")
        String note,

        Long loanId,

        /** Remove the renewal date - a flag, because null already means "unchanged". */
        Boolean clearRenewsOn,
        /** Unlink the loan that financed the premium. The loan itself is untouched. */
        Boolean clearLoan
) {
}
