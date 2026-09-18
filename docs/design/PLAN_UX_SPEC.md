# Plan — UX Specification

**Written 2026-09-10.** The *how* for `docs/product/PLAN_EXPERIENCE.md`. Follows
`DESIGN_SYSTEM.md` and `UI_UX_PRINCIPLES.md`; where silent, those govern.

Direction: **Standing, then the record** — STANDING (hero) → Goals → Commitment rules
(the engine) → History.

---

## 1. Screen structure

```
┌──────────────────────────────────────────────────────────────────┐
│ 1  STANDING          ₹57,700 in · 42% committed before you spend  │  hero
│                     ⚠ What you're exposed to (only if non-empty)  │  attention
│                     → What would help most (0-2 items)            │
├──────────────────────────────────────────────────────────────────┤
│ 2  GOALS             progress, required/month                     │  register
├──────────────────────────────────────────────────────────────────┤
│ 3  COMMITMENT RULES  the engine, read-only this pass               │  register
├──────────────────────────────────────────────────────────────────┤
│ 4  HISTORY           cycle over cycle, real empty state             │  register
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Zone 1 — Standing

Same visual grammar as Month's crux and Accounts' net worth: micro label, a hero-weight
fact, a sentence beneath it. Standing's "hero" is a sentence rather than a single number -
there isn't one figure that captures "how am I doing," so the mirror itself carries the
weight typography usually gives a number.

```
STANDING
₹57,700 comes in. ₹24,349 is committed before you spend anything - 42%.
That leaves about ₹33,351 for everything else this cycle.
```

- First line: income, in plain figures, tabular (`Amount`, `role="section"` weight - a
  step down from a true hero, since this is a sentence carrying two numbers, not one figure).
- Second line: the plain consequence, in `text-body text-ink-soft` - same tone as Month's
  verdict line.
- **No score. No "Financial Health: 62/100."** Quality gate 13 and
  `PRODUCT_STRATEGY.md` §3.4 both rule this out explicitly.

### Exposed-to cards

Rendered only when non-empty, identical shape to Month's Needs You / Accounts' Needs a
Look - amber tint, chevron, opens the relevant detail. This pass's only computable trigger:
committed share of income above a high threshold (e.g. >70%, matching the product's own
origin story of a 76%-committed household). Card-near-limit-style richer triggers wait for
real cross-cycle data.

```
┌─ ⚠ ─────────────────────────────────────────────┐
│ Most of what comes in is already spoken for       │
│ 76% committed. One unplanned bill uses most of    │
│ what's left. Open This Month to see what's due.   │
└──────────────────────────────────────────────────┘
```

### What's working

**Not rendered this pass.** No cross-cycle history exists to make a true claim. Per
`PLAN_EXPERIENCE.md` §2, an absent section here is not a bug - it's the same honesty
already proven on Month (pace/outlook suppressed pre-day-3) and Accounts (confidence label
absent without a confirmed/estimated concept). Do not fill this with a placeholder
sentence; omit the heading entirely rather than announce an empty category.

### What would help most

Zero to two items, ranked by concrete impact, each a single sentence with a figure. This
pass's only computable source: a loan within a few cycles of payoff.

```
The Bike Loan is 3 cycles from paid off - that's ₹3,900/month back from Oct 2028.
```

Never invented, never more than two - if there's nothing confidently helpful to say, this
section is omitted too.

---

## 3. Zone 2 — Goals

Unchanged from current build (progress bar, required/month) - already matches the
product's honesty rules. No feasibility comparison added this pass (blocked on surplus
history, §2). Not clickable - no destination exists yet; documented as a known gap rather
than faked with a dead link.

---

## 4. Zone 3 — Commitment rules

Unchanged in content and interactivity (still read-only - editing is its own scope). The
one change: confirm rows render with **no chevron and no hover affordance**, so their
non-interactivity is honest rather than ambiguous - the inverse of the fix applied to
Month and Accounts, same underlying principle (a row's appearance must match whether it
actually does something).

---

## 5. Zone 4 — History

Unchanged rendering for populated history. Adds a real empty state instead of silently
rendering nothing when no cycle has been closed yet:

> *No cycles closed yet. Close This Month's cycle once it ends, and it'll start building here.*

---

## 6. States

| State | Treatment |
|---|---|
| **Loading** | Skeletons per zone, independent. |
| **Standing unavailable** | If the current cycle's summary can't load, Standing shows nothing rather than a broken sentence with gaps. |
| **No exposures** | Section omitted, no reassurance banner (same rule as Month's empty Needs You / Accounts' empty Needs a Look). |
| **No "helps most" candidates** | Section omitted. |
| **Empty goals** | Existing empty state, unchanged. |
| **Empty rules** | Existing (section omitted), unchanged. |
| **Empty history** | New real message (§5), replacing silent nothing. |

---

## 7. What this needs from the backend

| Addition | Why server-side |
|---|---|
| Committed share of income for the current cycle | A ratio over money - never client-divided |

Everything else in step 1 (loan payoff proximity, goal progress, history) already exists.
"What's working" and goal feasibility comparisons need cross-cycle data that doesn't exist
yet, not new backend capability - they wait for real closed cycles, not a schema change.

---

## 8. Build order

1. **Restructure** - Standing (mirror + exposed-to + helps-most, all computable today),
   Goals/Rules/History reordered beneath it, honest empty states, the rules-section
   non-affordance fix.
2. **What's working** + goal feasibility comparisons - once real closed-cycle history exists.
3. **Commitment rule editing** - its own scope, comparable to Add's form.
4. **Goal detail route** - once a goal has enough behind it to justify one.
