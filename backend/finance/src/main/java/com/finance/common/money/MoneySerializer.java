package com.finance.common.money;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueSerializer;

import java.math.BigDecimal;

/**
 * Serialises monetary {@link BigDecimal} values as JSON <em>strings</em>.
 *
 * <p>A JSON number such as {@code 6375.00} is parsed by JavaScript as an IEEE-754
 * double. Round-tripping money through a double eventually loses paise. Emitting
 * {@code "6375.00"} keeps the value exact all the way to the browser, where the
 * frontend is forbidden from performing arithmetic on it anyway.
 *
 * <p>Spring Boot 4 ships Jackson 3, where {@code JsonSerializer} became
 * {@link ValueSerializer} and {@code SerializerProvider} became
 * {@link SerializationContext}. See ADR-0001 and ADR-0013.
 */
public class MoneySerializer extends ValueSerializer<BigDecimal> {

    @Override
    public void serialize(BigDecimal value, JsonGenerator gen, SerializationContext ctxt)
            throws JacksonException {
        if (value == null) {
            gen.writeNull();
            return;
        }
        gen.writeString(value.setScale(MoneyScale.SCALE, MoneyScale.ROUNDING).toPlainString());
    }
}
