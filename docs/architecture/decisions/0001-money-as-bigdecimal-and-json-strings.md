# ADR-0001 — Money is `BigDecimal`, serialised as JSON strings

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

Every monetary value in this product is user-visible and consequential. A rounding
error is not a tolerance; it is a defect that destroys trust in the one thing the
product sells — that its numbers are true.

Two independent failure modes exist:

1. **In Java.** `double` and `float` cannot represent `0.1` exactly. Accumulating
   interest or summing a few hundred transactions produces visible drift.
2. **Over the wire.** JSON has one number type. A JavaScript client parses
   `6375.00` into an IEEE-754 double. Values survive today's amounts but not
   arbitrary ones, and the failure is silent.

## Decision

- **Java:** `BigDecimal` only. `double` and `float` are banned in any package that
  touches money.
- **MySQL:** `DECIMAL(15,2)`. Never `FLOAT`, `DOUBLE` or `REAL`.
- **JSON:** monetary values are serialised as **strings** — `"6375.00"` — by
  `MoneySerializer`.
- **Scale and rounding:** two decimal places, `HALF_UP`, applied once at the
  boundary. Centralised in `MoneyScale`.
- **Sign:** amounts are non-negative. Direction is carried by the posting, not by
  the sign of an amount. *(Opening balances are the deliberate exception: a card or
  loan opens with money owed.)*
- **Comparison:** `compareTo() == 0`, never `equals()` — `10.0` and `10.00` are
  equal in value and unequal by `equals`.

## Consequences

**Good.** Exactness end to end. The frontend cannot silently corrupt a figure,
because it receives a string and is forbidden from doing arithmetic on it.

**Cost.** Every client must parse for display. `BigDecimal` arithmetic is more
verbose than primitives. Serialisation must be annotated per field.

**Enforced by.** `MoneySerializerTest` covers scale normalisation, `HALF_UP`
rounding, scientific-notation avoidance, negatives, and null-is-not-zero. A future
ArchUnit rule will fail the build on any `Double` in the codebase.
