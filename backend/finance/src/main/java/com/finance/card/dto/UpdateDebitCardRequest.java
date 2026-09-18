package com.finance.card.dto;

import com.finance.card.domain.CardNetwork;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Partial update - null leaves a field unchanged; the flags clear. */
public record UpdateDebitCardRequest(

        Long accountId,

        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        CardNetwork network,

        @Pattern(regexp = "^[0-9]{4}$", message = "Use the last 4 digits only")
        String lastFour,

        Boolean clearNetwork,

        Boolean clearLastFour
) {
}
