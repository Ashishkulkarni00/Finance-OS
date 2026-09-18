# ADR-0002 — No explicit Hibernate dialect

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

The initialised project configured:

```properties
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

**The application could not start.** Spring Boot 4.1.1 ships Hibernate 7.4.5, which
**removed** `MySQL8Dialect` — deprecated in Hibernate 6, deleted in 7:

```
ClassNotFoundException: org.hibernate.dialect.MySQL8Dialect
```

The datasource connected fine; JPA could not bootstrap. This was the first thing the
Phase 1 assessment found, and it means the project had never successfully started.

## Decision

**Remove the property entirely.** Do not replace it with `MySQLDialect`.

Hibernate resolves the dialect from live JDBC metadata, so it adapts to the actual
server version rather than to a version someone typed once and never revisited.

## Consequences

**Good.** The application starts. The dialect tracks the real server. One fewer
version-coupled string to maintain across a MySQL upgrade.

**Cost.** A negligible amount of connection-time metadata inspection at startup.

**Watch for.** Version-pinned dialect names in tutorials are a persistent source of
this bug. If a dialect ever genuinely must be pinned, use the unversioned
`org.hibernate.dialect.MySQLDialect`.
