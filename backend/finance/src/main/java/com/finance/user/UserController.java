package com.finance.user;

import com.finance.user.domain.User;
import com.finance.user.dto.UpdateUserSettingsRequest;
import com.finance.user.dto.UserSettingsResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Deliberately thin - see the identical note on AccountController. */
@RestController
@RequestMapping("/api/v1/me")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public UserSettingsResponse get() {
        return toResponse(service.getCurrent());
    }

    @PatchMapping
    public UserSettingsResponse update(@Valid @RequestBody UpdateUserSettingsRequest request) {
        return toResponse(service.updateSettings(request));
    }

    private UserSettingsResponse toResponse(User user) {
        return new UserSettingsResponse(
                user.getId(), user.getEmail(), user.getDisplayName(),
                user.getCycleStartDay(), user.getCurrency(), user.getTimezone());
    }
}
