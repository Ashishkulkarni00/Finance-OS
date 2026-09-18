package com.finance.health;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Liveness plus a real database round-trip.
 *
 * <p>A health check that only proves the JVM is running is close to useless for an
 * application whose entire value is stored state.
 */
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public HealthController(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("application", "finance");
        body.put("time", Instant.now(clock).toString());

        try {
            Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            body.put("database", Integer.valueOf(1).equals(one) ? "UP" : "DEGRADED");
        } catch (Exception ex) {
            body.put("status", "DEGRADED");
            body.put("database", "DOWN");
        }
        return body;
    }
}
