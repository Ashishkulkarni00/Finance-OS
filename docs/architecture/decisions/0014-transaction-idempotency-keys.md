# ADR-0014 — Idempotency keys are handled in the service, backed by a table

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 2

## Context

`POST /transactions` must survive a double-tapped Save without creating two
transactions. `BACKEND_CONVENTIONS.md` §2 lists a `common/web/IdempotencyFilter.java`
in the package tree, suggesting a servlet filter; §12's worked example instead shows
the header passed straight into the service:

```java
@PostMapping
public ResponseEntity<TransactionResponse> create(
        @Valid @RequestBody CreateTransactionRequest request,
        @RequestHeader(value = "Idempotency-Key", required = false) String idemKey) {
    Transaction created = service.create(request, idemKey);
    ...
```

The two are inconsistent, and only one was actually built.

## Decision

**Service-level, not a filter.** `TransactionController` accepts the
`Idempotency-Key` header and passes it straight into `TransactionService.create`,
matching the §12 worked example. A filter would need to buffer and replay the
response body (`ContentCachingResponseWrapper` or equivalent) for byte-identical
replay; the service-level approach instead replays by re-fetching the transaction
that was created the first time and re-mapping it, which is simpler and gives an
equivalent result — the client gets the same transaction, not necessarily
byte-identical JSON (timestamps aside, the content is the same).

**Backed by a table, not an in-memory cache.** A single dev instance doesn't strictly
need durability across restarts, but a financial write path should not depend on
process memory for a correctness guarantee. `idempotency_keys` stores
`(user_id, idempotency_key)` unique, plus a SHA-256 hash of the request body and the
resulting `transaction_id`.

**Match by hash, not by re-comparing the DTO.** The stored request is hashed
(`request.toString()` on the record, SHA-256'd) rather than stored and field-compared.
A same key with a matching hash replays the original transaction; a same key with a
different hash is a `409 IDEMPOTENCY_CONFLICT` — the client reused a key it should
not have.

**Kept generic.** `IdempotencyService` takes a caller-supplied `requestFingerprint`
string rather than knowing about `Transaction`, so another write endpoint can adopt it
later without a new table.

## Consequences

**Good.** Survives a restart between the first and replayed request. No response-body
buffering or filter-ordering concerns. One class (`IdempotencyService`) any future
write endpoint can reuse.

**Cost.** `idempotency_keys` rows are never expired or cleaned up in milestone 2 —
`BACKEND_CONVENTIONS.md` §12 mentions a 24h retention window; no cleanup job exists
yet. The table grows unbounded until one is added. Acceptable for now: it is a small
row per write, and expiry is a deletion job, not a correctness concern, for a
single-user system.

**Doc drift this fixes.** `BACKEND_CONVENTIONS.md` §2's package tree should be updated
to drop `IdempotencyFilter.java` in favour of `common/idempotency/` (`IdempotencyKey`,
`IdempotencyKeyRepository`, `IdempotencyService`) to match what was actually built.
