package com.finance.plan.domain;

/**
 * How to read the strings in a {@link PlanFieldChange}.
 *
 * <p>One column has to hold a name, a date, a flag and an amount, so the values are
 * stored as strings (money in its canonical {@code "4200.00"} form, per ADR-0001). This
 * carries the meaning a {@code VARCHAR} loses, so the UI can format "₹4,200" or
 * "5 Oct 2026" without guessing from the shape of the text.
 */
public enum PlanValueKind {

    /** Canonical money string - {@code "4200.00"}. Render with the rupee formatter. */
    MONEY,

    /** ISO date - {@code "2026-10-05"}. */
    DATE,

    /** A plain count, not money - a due day, a priority. */
    NUMBER,

    /** Free text, or an enum name. */
    TEXT,

    /** {@code "true"} / {@code "false"} - mandatory, requires verification. */
    FLAG
}
