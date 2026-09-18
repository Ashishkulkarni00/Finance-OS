package com.finance.user;

import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.user.CurrentUserProvider;
import com.finance.user.domain.User;
import com.finance.user.dto.UpdateUserSettingsRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Onboarding step 1 ("When are you paid?") and settings live here.
 * {@code cycleStartDay} is the field described on {@link User} as the most
 * consequential in the application - every cycle boundary derives from it.
 */
@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository repository;
    private final CurrentUserProvider currentUser;

    public UserServiceImpl(UserRepository repository, CurrentUserProvider currentUser) {
        this.repository = repository;
        this.currentUser = currentUser;
    }

    @Override
    @Transactional(readOnly = true)
    public User getCurrent() {
        return requireCurrent();
    }

    @Override
    @Transactional
    public User updateSettings(UpdateUserSettingsRequest request) {
        User user = requireCurrent();
        if (request.cycleStartDay() != null) {
            user.setCycleStartDay(request.cycleStartDay());
        }
        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setDisplayName(request.displayName().trim());
        }
        User saved = repository.save(user);
        log.info("User settings updated id={} cycleStartDay={}", saved.getId(), saved.getCycleStartDay());
        return saved;
    }

    private User requireCurrent() {
        return repository.findByIdAndDeletedAtIsNull(currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "We couldn't find your account."));
    }
}
