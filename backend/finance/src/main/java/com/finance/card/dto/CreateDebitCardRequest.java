package com.finance.card.dto;

import com.finance.card.domain.CardNetwork;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateDebitCardRequest(

        @NotNull(message = "Which bank account does this card spend from?")
        Long accountId,

        @NotBlank(message = "What do you call this card?")
        @Size(max = 100, message = "Name can be at most 100 characters")
        String name,

        CardNetwork network,

        @Pattern(regexp = "^[0-9]{4}$", message = "Use the last 4 digits only")
        String lastFour
) {
}
