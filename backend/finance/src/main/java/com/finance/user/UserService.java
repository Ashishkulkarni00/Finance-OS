package com.finance.user;

import com.finance.user.domain.User;
import com.finance.user.dto.UpdateUserSettingsRequest;

public interface UserService {

    User getCurrent();

    User updateSettings(UpdateUserSettingsRequest request);
}
