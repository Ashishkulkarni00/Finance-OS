package com.finance.common.user;

import org.springframework.stereotype.Component;

/**
 * The seam where authentication will plug in.
 *
 * <p>Authentication is deliberately deferred, but the domain is <em>not</em> built on
 * the assumption of a single user. Every financial row already carries a
 * {@code user_id}, every repository query already filters by it, and every service
 * already asks this provider who is acting.
 *
 * <p>When authentication arrives, only this class changes: it reads the principal
 * from the security context instead of returning the development user. No schema
 * migration, no query rewrite. See ADR-0005.
 */
@Component
public class CurrentUserProvider {

    /**
     * Seeded by Flyway migration {@code V1__baseline.sql}.
     * Referenced in tests, so it is a constant rather than a magic number.
     */
    public static final long DEVELOPMENT_USER_ID = 1L;

    public Long currentUserId() {
        return DEVELOPMENT_USER_ID;
    }
}
