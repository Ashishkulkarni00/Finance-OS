# ADR-0007 — Tests run against real MySQL, not H2

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

The convenient choice for integration tests is H2 in MySQL-compatibility mode: fast,
zero-setup, no external dependency.

It also disagrees with MySQL in exactly the places this application is sensitive:
`DECIMAL` precision and rounding, `DATETIME(6)` fractional seconds, `BIT(1)` versus
`BOOLEAN`, locking, and `CHECK` constraint behaviour. A suite that passes on H2 and
fails in production is worse than no suite, because it is trusted.

`TECHNICAL_ARCHITECTURE.md` originally specified **Testcontainers**. Docker is
installed on the development machine but the daemon is not running, so Testcontainers
would fail the suite for environmental reasons on every run.

## Decision

**Integration tests run against a real local MySQL schema**, `finance_planner_test`,
configured in `src/test/resources/application-test.properties` and selected with
`@ActiveProfiles("test")`.

- Flyway migrates the test schema on each run, so migrations are exercised too
- The development database is never touched by tests
- Unit tests (services, serialisation) need no database and stay fast

**Testcontainers remains the target for CI**, where Docker is available. The
`application-test.properties` indirection means adopting it is a configuration
change, not a test rewrite.

## Consequences

**Good.** Tests exercise the real engine, real types and real migrations. The
`TINYINT`/`INT` mismatch found during milestone 1 would have been invisible on H2.

**Cost.** A developer must create `finance_planner_test` once. The context-loading
suite takes ~24s. The suite is not hermetic.

**Documented deviation.** Supersedes the Testcontainers line in
`TECHNICAL_ARCHITECTURE.md` §1 for local development.
