package com.finance.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateUserSettingsRequest(

        @Min(value = 1, message = "Must be a day of the month, 1 to 31")
        @Max(value = 31, message = "Must be a day of the month, 1 to 31")
        Integer cycleStartDay,

        @Size(max = 100, message = "Name can be at most 100 characters")
        String displayName
) {
}
