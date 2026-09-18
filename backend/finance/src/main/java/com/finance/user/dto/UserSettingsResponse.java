package com.finance.user.dto;

public record UserSettingsResponse(
        Long id,
        String email,
        String displayName,
        Integer cycleStartDay,
        String currency,
        String timezone
) {
}
