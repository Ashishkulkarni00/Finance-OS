# ADR-0010 — Never store full account or card numbers

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

A finance application naturally accumulates identifiers. Storing a full account or
card number is easy, occasionally convenient, and creates a permanent liability: it
turns a breach from embarrassing into harmful, and brings PCI-DSS obligations we have
no reason to take on.

The product never initiates a payment, so it has no functional need for them.

## Decision

- **Never stored:** full account numbers, full card numbers, CVV, PIN, OTP,
  net-banking credentials, or any authentication material.
- **Stored:** a user-chosen name, the institution name, and `last_four` (4
  characters) for recognition.
- **Never logged:** amounts, descriptions, account identifiers. Logs carry entity ids,
  types and error codes only — enough to diagnose, not enough to expose.

```java
log.info("Account created id={} type={}", saved.getId(), saved.getType());
```

Credentials are also kept out of the repository: `application-local.properties` holds
the database password and is gitignored, with environment variables taking precedence.

## Consequences

**Good.** A database breach exposes balances and names, not the means to move money.
PCI-DSS scope is avoided entirely. Logs are safe to ship to any aggregator.

**Cost.** Account matching during a future bank integration must use the institution's
own identifiers rather than a stored number. Support cannot identify an account by its
full number.

**Applies to future work.** Account Aggregator integration (phase 4) will receive
identifiers per request; those are held for the life of the request and never
persisted.
