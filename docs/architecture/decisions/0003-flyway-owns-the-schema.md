# ADR-0003 — Flyway owns the schema; Hibernate only validates

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

The initialised project used `spring.jpa.hibernate.ddl-auto=update`.

For a financial application this is dangerous. `update` is additive-only and
silently inconsistent: it will add a column but never change a type, never add a
constraint it did not create, never remove anything, and never tell you what it did.
The schema becomes a side effect of whatever the entity classes happened to look like
at each deploy — with no history and no review.

The product's own principle is that **derived state must never drift from its
source**. A schema that drifts is the same failure at a lower layer.

## Decision

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

- **Flyway owns the schema.** Versioned SQL in `db/migration`, reviewed like code.
- **Hibernate validates.** On startup it checks every mapping against the real
  schema and refuses to boot on a mismatch.
- **Never edit an applied migration.** *(V1 was corrected during milestone 1 before
  any release — the only permitted exception, and the local databases were
  recreated.)*

## Consequences

**Good.** Schema changes are explicit, reviewable, ordered and repeatable. Indexes,
constraints and column types are deliberate rather than inferred.

`validate` proved its worth within minutes: it caught `cycle_start_day` declared
`TINYINT` in SQL against `Integer` in Java, and `CHAR(3)` against `String(3)` — both
of which `update` would have silently tolerated until a query behaved oddly in
production.

**Cost.** Every schema change needs a migration file. Entity and migration must be
kept in step by hand.

**Boot 4 note.** `flyway-core` on the classpath is **inert** without the
`spring-boot-flyway` autoconfiguration module. See ADR-0013.
