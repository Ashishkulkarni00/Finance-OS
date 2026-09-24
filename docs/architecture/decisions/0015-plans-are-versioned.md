# ADR-0015 — Plans are versioned: every change to a commitment or goal is recorded

**Status:** Accepted
**Date:** 2026-09-21
**Context:** `FINANCIAL_OS.md` decision **D2**; `ROADMAP.md` Phase 1.1; the missing
primitive "Plan revision" in `FINANCIAL_STATE.md` §Missing primitives.

---

## Context

The app can answer "what did I spend?" It cannot answer **"did I keep to my plan?"**,
because nothing anywhere records what the plan *was*.

Three concrete holes, all verified in code before this ADR was written:

1. **`CommitmentServiceImpl.update`** — when `applyFrom` is set, the rule is split:
   `copyStartingOn` builds a second `commitments` row and the first is ended the day
   before. The split itself is right (months before `applyFrom` must keep the old
   figures). What is wrong is that the two rows have **no relationship**. To every
   reader they are two unrelated bills. Their shared history is gone, and so is the
   fact that one replaced the other. Without `applyFrom` it is worse: the row is
   mutated in place and the previous amount simply ceases to exist.

2. **`GoalServiceImpl.update`** — target amount, target date and priority are all
   mutated in place. Moving an emergency-fund target from Aug 2027 to Aug 2028 leaves
   no trace, so "I have moved this deadline three times" — the single most useful
   thing the system could tell that user — is unknowable.

3. **`CycleServiceImpl.close`** — the snapshot stores `incomeTotal`, `expenseTotal`,
   `realBalance`, `netWorth` and so on. Every one of them is an **actual**. Nothing
   planned is captured, so a closed cycle cannot be compared against the plan that
   was in force during it, even in principle.

This blocks Phase 6.4 (month close as a real review), the North Star operational
metric (**commitments kept**), and any honest statement about trajectory.

## Decision

**A change to the plan is itself a financial event, and is recorded as one.**

Three parts:

### 1. `plan_revisions` — the decision

One row per user-initiated change to a commitment or a goal. It records *what kind*
of change, *when it was decided*, *when it takes effect*, *why*, and **what it cost**
— `monthly_effect`, the change in the monthly cash requirement in rupees.

`monthly_effect` is what makes the log a financial record rather than an audit trail.
"Changed Jio bill" is a diff. "Changed Jio bill, +₹150/month" is a decision with a
price, which is what the product exists to show.

### 2. `plan_revision_changes` — the field-level log

Child rows: field key, plain-language label, old value, new value, and a `value_kind`
(`MONEY` / `DATE` / `NUMBER` / `TEXT` / `FLAG`) so the UI can format without parsing.

Values are stored as **strings**, including money, which stays the canonical
`"4200.00"` form (ADR-0001). One column has to hold a name, a date, a flag and an
amount; a string is the only honest shared type, and the `value_kind` carries the
meaning that `VARCHAR` loses.

The label is supplied **by the calling domain service**, not by a lookup table in the
plan package. The commitment package is the only thing that knows `dueDay` should read
"Due day" and `activeTo` should read "Last payment". Centralising labels would put
plain language a package away from the domain that owns it.

### 3. Snapshots gain planned totals

`cycle_snapshots` gains `planned_committed_total`, `actual_committed_total`,
`commitments_planned`, `commitments_kept` and `plan_revisions_count`. At close, these
come from the cycle's `commitment_instances` — the occurrences, which are already
cycle-scoped — and from the revisions decided during the cycle.

## What we deliberately did *not* do

**Full temporal versioning of the plan entities** (a `commitment_versions` table, or
bitemporal `valid_from`/`valid_to` on every column). It is the textbook answer and it
is the wrong size for this problem.

The cash-flow question — "what was this bill worth in March?" — is *already* answered
correctly by the existing `activeFrom`/`activeTo` split. That mechanism works. What is
missing is not reconstructable state; it is the **narrative**: what changed, when it
was decided, why, and what it cost. A revision log gives that at a fraction of the
cost, and does not require every read path in the system to become time-aware.

The chain between split rules therefore lives in `plan_revisions`
(`superseded_subject_id` → the ended rule, `subject_id` → its replacement) rather than
as a column on `commitments`. The revision *is* the relationship; storing it twice
would give two places to disagree.

## Consequences

- **A silent plan rewrite is now impossible.** Every mutating path on
  `CommitmentService` and `GoalService` records a revision, including archive, unarchive
  and delete — pausing a SIP is a plan change with a price, not a status flag.
- **Source-driven syncs are recorded but marked `SYNCED`.** When a loan's EMI changes,
  its bill's amount changes too. That is a real change to the plan and hiding it would
  make the log lie — but it was not decided at the bill, it was decided at the loan.
  `SYNCED` lets a "what did I decide this month?" view exclude it while a "what changed
  this month?" view includes it.
- **`reason` is optional and never demanded.** A forced "why did you change this?" prompt
  is the kind of friction that produces `"."` as an answer. It is offered, and its absence
  is recorded honestly as absent.
- **`monthly_effect` is nullable, and null means unknown** — a `VARIABLE` commitment has
  no monthly cost to compare. It is never coerced to zero (ADR-0006).
- **Sign convention:** positive `monthly_effect` = *more money needed each month*. An
  `INCOME` commitment (the salary) is therefore negated: raising expected income lowers
  the requirement.
- Revisions are **append-only**. They are not soft-deleted with their subject and they
  do not extend `AuditableEntity` — a deleted commitment keeps its history, which is the
  entire point. Deleting the commitment writes an `ENDED` revision; it does not erase the
  ones before it.
- Cost: two tables, five snapshot columns, and a recording call on ~10 write paths.

## Related

ADR-0004 (soft delete only) · ADR-0006 (incomplete is not an error) ·
ADR-0011 (derived values are never stored — snapshots remain the deliberate exception,
and planned totals are captured for the same reason actuals already are).
