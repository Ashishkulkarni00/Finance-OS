package com.finance.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/** Enables {@code @CreatedDate} / {@code @LastModifiedDate} on {@code AuditableEntity}. */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
