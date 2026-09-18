# ADR-0004 — Financial records are never hard-deleted

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

Financial data has an obligation ordinary CRUD data does not: **history must remain
explicable.** If a user asks in March why February's savings figure changed, the
answer must be reconstructible. A `DELETE` makes that impossible.

There are also two genuinely different user intentions that CRUD collapses into one:

- *"This account is closed."* — a real event, part of the financial story
- *"I entered this by mistake."* — a correction

## Decision

Three distinct states, all preserving the row:

| State | Column | Meaning | Reversible |
|---|---|---|---|
| Active | — | In use | — |
| **Archived** | `archived_at` | Closed or dormant. History retained and still counted historically | Yes, via API |
| **Deleted** | `deleted_at` | A mistake. Excluded from everything | Not via API |

`DELETE /accounts/{id}` sets `deleted_at` and returns `204`. The row remains.
Every query carries `deleted_at IS NULL`.

## Consequences

**Good.** History is never destroyed. Corrections stay auditable. Archive-vs-delete
matches how users actually think. Recovery from a mistaken delete is a database
update, not a restore.

**Cost.** Every query needs the `deleted_at` predicate — an omission is a real bug
class. Unique constraints cannot be enforced by the database alone, because
soft-deleted rows keep their names; uniqueness is enforced in the service where the
condition can be applied. Rows accumulate; a purge policy will eventually be needed
for GDPR/DPDP erasure requests, which is a deliberate future exception.

**Verified by.** `AccountServiceImplTest.deleteIsSoft` asserts the repository's
`delete` and `deleteById` are never called.
