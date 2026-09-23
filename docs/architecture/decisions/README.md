# Architecture Decision Records

Short records of decisions that would otherwise be re-litigated or accidentally
reversed. Each one states the decision, why, and what it costs.

**Status values:** `Accepted` · `Superseded by ADR-XXXX` · `Deprecated`

| # | Decision | Status | Milestone |
|---|---|---|---|
| [0001](0001-money-as-bigdecimal-and-json-strings.md) | Money is `BigDecimal`, serialised as JSON strings | Accepted | M1 |
| [0002](0002-no-explicit-hibernate-dialect.md) | No explicit Hibernate dialect | Accepted | M1 |
| [0003](0003-flyway-owns-the-schema.md) | Flyway owns the schema; Hibernate only validates | Accepted | M1 |
| [0004](0004-soft-delete-only.md) | Financial records are never hard-deleted | Accepted | M1 |
| [0005](0005-user-id-from-day-one.md) | Ownership column from the first migration | Accepted | M1 |
| [0006](0006-incomplete-data-is-not-an-error.md) | "We don't know yet" is a 200, not an error | Accepted | M1 |
| [0007](0007-real-mysql-in-tests-not-h2.md) | Tests run against real MySQL, not H2 | Accepted | M1 |
| [0008](0008-account-type-enum-category-table.md) | Account type is an enum; category will be a table | Accepted | M1 |
| [0009](0009-per-account-opening-balance-anchor.md) | Opening balance anchored per account | Accepted | M1 |
| [0010](0010-never-store-account-numbers.md) | Never store full account or card numbers | Accepted | M1 |
| [0011](0011-derived-values-are-never-stored.md) | Derived values are never stored | Accepted | M1 |
| [0012](0012-injectable-clock.md) | Time is injected, never called statically | Accepted | M1 |
| [0013](0013-spring-boot-4-consequences.md) | Consequences of Spring Boot 4 | Accepted | M1 |
| [0014](0014-transaction-idempotency-keys.md) | Idempotency keys are handled in the service, backed by a table | Accepted | M2 |
| [0015](0015-plans-are-versioned.md) | Plans are versioned: every commitment/goal change is recorded | Accepted | Phase 0.1 |
| [0016](0016-cover-is-not-an-asset.md) | Insurance is its own primitive, and cover is never an asset | Accepted | Phase 0.3 |
| [0017](0017-writes-report-their-own-effect.md) | A write reports its own effect; a warning is announced on crossing | Accepted | Phase 0.4 |
| [0018](0018-debt-truth-comes-from-recorded-payments.md) | A loan's truth is its recorded payments, not the calendar | Accepted | Phase 0.2 |
| [0019](0019-ai-is-an-interface-never-the-engine.md) | AI is an interface over the state engine, never a calculator | Accepted | Phase 0.6 |

## Writing a new one

Copy the shape of an existing record. Keep it under a page. If the decision is
obvious and uncontested, it does not need an ADR — record the ones a future
maintainer might reasonably want to undo.
