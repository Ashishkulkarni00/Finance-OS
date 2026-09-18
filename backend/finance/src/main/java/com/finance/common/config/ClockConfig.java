package com.finance.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/**
 * A {@link Clock} bean so that "today" is injectable.
 *
 * <p>Financial rules depend heavily on dates - salary cycles, due dates, whether an
 * opening balance is in the future. Services that call {@code LocalDate.now()}
 * directly cannot be tested around a boundary. Every date-dependent rule takes the
 * clock instead.
 *
 * <p>Fixed to Asia/Kolkata for now; becomes a per-user setting when the product
 * supports users outside India. See ADR-0012.
 */
@Configuration
public class ClockConfig {

    public static final ZoneId APP_ZONE = ZoneId.of("Asia/Kolkata");

    @Bean
    public Clock clock() {
        return Clock.system(APP_ZONE);
    }
}
