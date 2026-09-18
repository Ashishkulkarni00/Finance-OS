package com.finance.common.money;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Money must reach the browser as an exact string.
 *
 * <p>These tests guard the rule that a rounding error in money is a defect, not a
 * tolerance.
 */
class MoneySerializerTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    record Holder(@JsonSerialize(using = MoneySerializer.class) BigDecimal amount) {
    }

    @Test
    @DisplayName("serialises as a JSON string, not a number")
    void serialisesAsString() {
        String json = objectMapper.writeValueAsString(new Holder(new BigDecimal("6375.00")));
        assertThat(json).isEqualTo("{\"amount\":\"6375.00\"}");
    }

    @Test
    @DisplayName("always carries two decimal places")
    void normalisesScale() {
        assertThat(objectMapper.writeValueAsString(new Holder(new BigDecimal("100"))))
                .isEqualTo("{\"amount\":\"100.00\"}");
        assertThat(objectMapper.writeValueAsString(new Holder(new BigDecimal("100.5"))))
                .isEqualTo("{\"amount\":\"100.50\"}");
    }

    @Test
    @DisplayName("rounds HALF_UP, once, at the boundary")
    void roundsHalfUp() {
        assertThat(objectMapper.writeValueAsString(new Holder(new BigDecimal("10.005"))))
                .isEqualTo("{\"amount\":\"10.01\"}");
        assertThat(objectMapper.writeValueAsString(new Holder(new BigDecimal("10.004"))))
                .isEqualTo("{\"amount\":\"10.00\"}");
    }

    @Test
    @DisplayName("never uses scientific notation, however large")
    void neverScientificNotation() {
        String json = objectMapper.writeValueAsString(new Holder(new BigDecimal("1E+9")));
        assertThat(json).isEqualTo("{\"amount\":\"1000000000.00\"}");
    }

    @Test
    @DisplayName("null stays null - it is not zero")
    void nullIsNotZero() {
        assertThat(objectMapper.writeValueAsString(new Holder(null)))
                .isEqualTo("{\"amount\":null}");
    }

    @Test
    @DisplayName("negative amounts keep their sign")
    void negativesSurvive() {
        assertThat(objectMapper.writeValueAsString(new Holder(new BigDecimal("-6375.00"))))
                .isEqualTo("{\"amount\":\"-6375.00\"}");
    }

    @Test
    @DisplayName("equality ignores trailing zeros")
    void equalityIgnoresScale() {
        assertThat(MoneyScale.equal(new BigDecimal("10.0"), new BigDecimal("10.00"))).isTrue();
        assertThat(new BigDecimal("10.0").equals(new BigDecimal("10.00"))).isFalse();
    }
}
