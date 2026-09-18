# ADR-0005 — Ownership column from the first migration

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

Authentication is deliberately deferred. The temptation is to defer *ownership* with
it and add a `user_id` later. That is the decision that makes multi-user a rewrite
instead of a feature: retrofitting ownership means a migration on every financial
table, backfilling every row, and auditing every query ever written for a missing
filter — with no compiler to help.

## Decision

Ownership exists from migration V1, even with one user.

- Every financial table carries `user_id NOT NULL` with a foreign key
- Every repository method filters by it — `findByIdAndUserIdAndDeletedAtIsNull`
- Services never take a user id from the client; they ask `CurrentUserProvider`
- A row belonging to another user returns **404**, never 403 — existence is not
  disclosed across an ownership boundary
- The development user is seeded by V1 with id 1

`CurrentUserProvider` is the entire seam. Today it returns a constant. With
authentication it reads the security context. **Nothing else changes** — no
migration, no query rewrite.

## Consequences

**Good.** Multi-user becomes a policy change. Every query is already correct.
Isolation bugs are caught now, by tests, rather than after a launch.

**Cost.** Slightly more verbose repository methods and a redundant filter today.

**Verified by.** `AccountServiceImplTest.enforcesOwnership`.
