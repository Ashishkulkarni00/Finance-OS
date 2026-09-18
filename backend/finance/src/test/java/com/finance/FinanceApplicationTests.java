package com.finance;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Boots the whole application against a real MySQL schema.
 *
 * <p>This is the test that would have caught the {@code MySQL8Dialect} failure: it
 * proves the context starts, Flyway migrates, and Hibernate validates its mappings
 * against the migrated schema.
 *
 * <p>Runs against {@code finance_planner_test}, never the development database.
 */
@SpringBootTest
@ActiveProfiles("test")
class FinanceApplicationTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("application context starts and the datasource is reachable")
    void contextLoads() {
        assertThat(jdbcTemplate.queryForObject("SELECT 1", Integer.class)).isEqualTo(1);
    }

    @Test
    @DisplayName("Flyway created the baseline schema")
    void flywayMigrationsApplied() {
        Integer migrations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 1", Integer.class);
        assertThat(migrations).isGreaterThanOrEqualTo(1);

        assertThat(tableExists("users")).isTrue();
        assertThat(tableExists("accounts")).isTrue();
    }

    @Test
    @DisplayName("the development user is seeded with a salary-day cycle")
    void developmentUserSeeded() {
        Integer cycleStartDay = jdbcTemplate.queryForObject(
                "SELECT cycle_start_day FROM users WHERE id = 1", Integer.class);
        assertThat(cycleStartDay).isNotNull().isBetween(1, 28);
    }

    @Test
    @DisplayName("money columns are DECIMAL, never floating point")
    void moneyColumnsAreDecimal() {
        String dataType = jdbcTemplate.queryForObject("""
                SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'opening_balance'
                """, String.class);
        assertThat(dataType).isEqualTo("decimal");
    }

    private boolean tableExists(String name) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                """, Integer.class, name);
        return count != null && count > 0;
    }
}
