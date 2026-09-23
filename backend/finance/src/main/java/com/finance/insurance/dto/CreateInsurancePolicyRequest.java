package com.finance.insurance.dto;

import com.finance.insurance.domain.InsuranceType;
import com.finance.insurance.domain.PremiumFrequency;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Only the name and what it covers are required. Everything else is optional on purpose:
 * "I'm covered but I can't remember for how much" is a true state, and refusing the record
 * until every box is filled loses the fact that cover exists at all (ADR-0006).
 */
public record CreateInsurancePolicyRequest(

        @NotNull(message = "What does this cover?")
        InsuranceType type,

        @NotBlank(message = "Give this policy a name you'll recognise")
        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        @Size(max = 100)
        String insurer,

        /** Last four of the policy number. Never send the whole number (ADR-0010). */
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

        /** The loan that financed this premium, when it was put on a card in instalments. */
        Long loanId
) {
}
