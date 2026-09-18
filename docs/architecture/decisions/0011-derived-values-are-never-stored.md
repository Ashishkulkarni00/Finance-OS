# ADR-0011 — Derived values are never stored

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

This is the single most important technical rule in the project, and it comes directly
from watching the predecessor spreadsheet fail.

In three days of real use that workbook produced a materially wrong number several
times. **Every one was a stored value that should have been derived:**

| What happened | Result |
|---|---|
| A row inserted mid-table lost its formulas | A ₹5,000 EMI became invisible to every total |
| Two formulas were typed over with literals | Committed under-stated by ₹7,500; safe-to-spend inflated 2× |
| Manual confirmation ticks had no expiry | Would have hidden ₹22,800 at the next cycle roll |

In two of those cases the wrong number was **optimistic**, which is the dangerous
direction.

## Decision

**Anything that can be computed is computed, at query time.** Never persisted.

This includes account balances, Real Balance, Room, commitment status, cycle
membership, net worth, savings rate and goal progress.

Concretely:
- `Account` has no `current_balance` column. `AccountBalanceCalculator` derives it.
- Response DTOs expose derived fields; entities do not carry them.
- Derived values are never writable through any API.

Where a computation becomes too slow it is **cached with an explicit invalidation
key** — never persisted as a column that can drift.

## Consequences

**Good.** The entire class of bug that nearly destroyed the spreadsheet is
unrepresentable. A number cannot be wrong unless its inputs are wrong, and the inputs
are the rows the user typed.

**Cost.** More computation per request. Some queries will need optimising as history
grows — a known, bounded cost with a measured budget (`GET /position` under 200ms).

**Present shape.** `AccountBalanceCalculator` exists in milestone 1 returning only the
opening balance, because no transactions exist yet. The seam is deliberate: milestone 2
adds the posting sum in one method rather than hunting for balance arithmetic scattered
across services.
