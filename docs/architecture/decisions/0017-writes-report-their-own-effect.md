# ADR-0017 — A write reports its own effect, and a warning is announced on crossing

**Status:** Accepted
**Date:** 2026-09-23
**Context:** `ROADMAP.md` 0.4 · `FINANCIAL_OS.md` §3.3 (reactive layer) · `FINANCIAL_STATE.md` §7 (thresholds) · ADR-0011 · ADR-0006

---

## Context

The product is silent at the moment it matters. Recording a ₹1,200 expense returns the
saved transaction and nothing else; to learn what it cost you, you leave the form, open
Today, and read the numbers yourself.

The engines to answer already exist. `PositionService` knows Real Balance and Room.
`InsightService` knows what is at risk, with a stable `key` per item. They only speak when
asked. `FINANCIAL_OS.md` §3.3 states the requirement plainly:

> Recording a ₹12,000 expense must, in the same breath, say what it just cost: which
> obligation is now at risk, which goal moved, how many days of room are left.

This is the difference between a record book and an operating system, and it is the one
change that reaches the user where they actually are — on a phone, mid-action — rather
than on a screen they may not open for a week.

## Decision

### 1. `effect` is an additive field, never an envelope

A write response keeps its current shape and gains an optional `effect` object. It is
**not** wrapped as `{ data, effect }`.

An envelope is more uniform and would invalidate every existing response shape, every
frontend call site and every saved Postman example, for a cosmetic gain. Jackson's
`non_null` means an absent effect costs nothing on the wire.

### 2. The effect is computed after commit, and can never fail the write

The effect reads committed state and is produced outside the write's transaction. If it
throws, it is logged and omitted; the write stands.

This follows `LoanPaymentRecorder`'s existing rule — *recording is a consequence of
settling a bill, and a loan whose dates don't line up must not stop the user marking their
rent paid*. A user who recorded an expense has recorded an expense. Losing that because a
projection failed would be indefensible.

### 3. Before **and** after, because the delta is the consequence

"Room ₹699 a day" is information. "Room ₹1,899 → ₹699 a day" is a consequence. The cost is
computing position twice per write, which is accepted deliberately: deriving the delta from
the transaction's own amount would be cheaper and would drift the moment anything else
(reservations, a card due date, a cycle boundary) participates in the figure.

### 4. A warning is announced when it **crosses**, not while it is true

This is the load-bearing decision, and it is behavioural rather than technical.

Re-stating current state after every write means the same warning fires eight times a day
while a condition persists. A person learns to dismiss it within two days, at which point
the feature is **worse than silence** — it has trained the user to ignore the channel the
product most needs. The category's base rate is ~70% abandonment within 100 days; a
self-inflicted nag is not a risk worth taking for an easier implementation.

So: a warning is announced **once, when it becomes true**, and once again **when it stops
being true**. *"Bangalore trip is no longer behind"* is worth as much as the warning was,
and nothing in the product currently says it.

Detection is a diff on `Insight.key`, which is already stable and already documented as
existing for exactly this ("de-duplication now, dismiss/snooze later"). A key that appears
is a crossing; a key that disappears is a recovery. No second rule engine.

### 5. What is stored is notification state, not financial state

`insight_state` records which warnings the user is currently in, when each began and when
each cleared. **It stores no derived financial value.** Room, runway, whether a goal is
feasible and whether an obligation is coverable are all still computed fresh on every read
(ADR-0011). The table only remembers *what the product has already said*, which is not a
fact about money and cannot drift from one.

This is the same table `ROADMAP.md` 2.2 needs for dismiss and snooze, designed once here
rather than twice.

### 6. Silence is a valid effect, and loudness is proportional

The product may speak after any write. It must not speak after every write. Renaming a
category produces no sentence.

Where it does speak, prominence follows `Insight.Severity`. **Both kinds are shown** — the
difference is tone and how long it stays, not visibility:

| Severity | Treatment |
|---|---|
| `CRITICAL` / `ATTENTION` | `HELD` — attention tone; the toast stays until dismissed |
| `OPPORTUNITY` / `INFO` | `QUIET` — calm tone; the toast fades after five seconds |
| nothing moved | no effect at all |

An earlier build displayed only `HELD` and let `QUIET` close the sheet silently. That made the
*common* case — an ordinary expense crossing no line — invisible, which reads as the feature
being broken rather than as restraint. Money moving is always worth one line; "quiet" means
calm, not absent.

### 7. It is a toast, and this reverses the position below

The first build held the sheet open until the user acknowledged the effect. That is right
for something needing a decision and wrong for every ₹50 expense, which is most of them: an
app that costs two taps to record a chai is one you stop recording chai in.

**The argument against a toast in "Alternatives rejected" was conditional on the toast being
the only channel, and it no longer is.** Every warning a toast reports is also on **Needs
you** (`/needs-you`), so nothing is lost when it fades. A toast that is your one chance to
read something trains people to dismiss it; a toast backed by a durable list is a pointer to
something recoverable. `HELD` still does not auto-dismiss — something that costs money if
ignored must not disappear because the user looked away.

This ordering matters: **the toast was only acceptable once the list existed.** Building it
first would have been the design this ADR originally warned against.

Per rule 8, the wording never judges. "₹699 a day left" — never "you're overspending".

## Consequences

- **`ddl-auto=validate` means the backend will not boot until V20 is applied.** Stated
  explicitly because the migration freeze was lifted narrowly for this feature only.
- Every write path gains a small post-commit cost: two position computations and one
  insight pass. Acceptable for a single-user system; if it is ever not, the composer is one
  class and can be made asynchronous without changing the response contract.
- A crossing is only as good as the rule that produced it. The four existing rules
  (`ShortfallRule`, `CardBillRule`, `GoalBehindRule`, `PlanItemRule`) are what the user will
  hear from; `GoalBehindRule` is known to be wrong today (a goal with ₹0 saved and nothing
  funding it reads `ON_TRACK`), so this decision makes fixing goal pace more urgent, not less.
- Crossings become first-class attention items in Phase 2.4 by reading the same table.

## Alternatives rejected

**Report current state, not crossings.** Cheaper, schema-free, and the nag problem above.
Rejected on behaviour, not on cost.

**Compute the effect inside the write transaction.** Guarantees the effect matches the
write exactly, and makes a projection bug able to roll back a recorded expense. Rejected.

**Warn before saving instead of reporting after.** That is a different feature — the
consequence preview of `ROADMAP.md` 3.2 — and it belongs to the decision engine. 0.4 never
blocks a write; it reports one.
