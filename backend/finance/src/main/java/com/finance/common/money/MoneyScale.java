package com.finance.common.money;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * The single place that decides how money is scaled and rounded.
 *
 * <p>Rules, applied everywhere without exception:
 * <ul>
 *   <li>Two decimal places (paise). Persisted as {@code DECIMAL(15,2)}.</li>
 *   <li>{@link RoundingMode#HALF_UP} - the convention users expect and the one
 *       Indian financial institutions use.</li>
 *   <li>Rounding is applied <em>once</em>, at the boundary. Intermediate
 *       calculations keep full precision.</li>
 *   <li>Amounts are always non-negative. Direction is expressed by the posting,
 *       never by the sign of an amount.</li>
 * </ul>
 *
 * <p>{@code double} and {@code float} are banned in every package that touches
 * money. See ADR-0001.
 */
public final class MoneyScale {

    public static final int SCALE = 2;
    public static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(SCALE);

    private MoneyScale() {
    }

    /** Normalises any amount to the canonical scale and rounding. */
    public static BigDecimal normalise(BigDecimal value) {
        return value == null ? null : value.setScale(SCALE, ROUNDING);
    }

    /** Equality that ignores trailing-zero differences ({@code 10.0} vs {@code 10.00}). */
    public static boolean equal(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) {
            return a == b;
        }
        return a.compareTo(b) == 0;
    }
}
