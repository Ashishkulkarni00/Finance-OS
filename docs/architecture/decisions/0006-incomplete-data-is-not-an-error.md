# ADR-0006 — "We don't know yet" is a 200, not an error

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

The product's first principle is that it must never be confidently wrong. A figure
like Real Balance depends on many inputs; when one is missing, the honest answer is
"we can't tell you yet, and here is why".

The obvious implementation is to throw. That is wrong on two counts:

1. **Nothing failed.** The request was valid, the system healthy, the data simply
   incomplete. A 4xx or 5xx says something broke.
2. **The client needs a different UI**, not an error toast — the screen must show
   what is missing and link to fixing it.

## Decision

Incomplete data is a **200 response carrying a state**:

```json
{
  "state": "INCOMPLETE",
  "realBalance": null,
  "reason": "One mandatory commitment has no amount set.",
  "blockers": [
    { "commitmentId": 9, "name": "Electricity", "fix": "/commitments/9" }
  ]
}
```

Errors remain errors: a malformed request is 400, a missing resource is 404, a broken
rule is 422. **Absence of data is none of those.**

The frontend models this as a discriminated union, so the compiler prevents rendering
a number that is not there.

## Consequences

**Good.** Honest by construction. Incompleteness gets a designed state instead of an
error screen. `null` and `0` stay distinguishable — a distinction most finance
products lose.

**Cost.** Response types are unions rather than flat objects. Every consumer must
handle the incomplete branch.

**Applies from.** Milestone 2, when `GET /position` exists. Recorded now because it
shapes how those endpoints are designed.
