# ADR-0012 — Time is injected, never called statically

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

This product is unusually date-dependent. Salary cycles run the 28th to the 27th; due
dates decide whether a commitment is overdue; an opening balance cannot be in the
future; "days remaining" divides the number the whole product is built around.

Code that calls `LocalDate.now()` directly cannot be tested at a boundary — and
boundaries are exactly where date logic breaks. A test for "cycle rollover on the 28th"
is impossible to write if the code reads the system clock.

## Decision

A `Clock` bean is injected wherever the current date or time is needed.

```java
@Bean public Clock clock() { return Clock.system(ZoneId.of("Asia/Kolkata")); }
```

Production uses the system clock. Tests inject `Clock.fixed(...)` and control "today"
exactly:

```java
Clock fixedClock = Clock.fixed(
        LocalDate.of(2026, 9, 9).atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant(),
        ZoneId.of("Asia/Kolkata"));
```

**Timezone:** `Asia/Kolkata` throughout, and also set on the JDBC connection and
Hibernate. Financial *dates* are `DATE` — a transaction happens on a day, not an
instant — while audit timestamps are UTC `DATETIME(6)`.

## Consequences

**Good.** Every date rule is testable, including boundaries. `acceptsToday` and
`rejectsFutureOpeningDate` are deterministic rather than dependent on when CI runs.

**Cost.** One more constructor parameter on date-dependent services.

**Future.** The zone becomes a per-user setting — the column already exists on `users`
— when the product serves users outside India. `ClockConfig.APP_ZONE` is the single
place that changes.
