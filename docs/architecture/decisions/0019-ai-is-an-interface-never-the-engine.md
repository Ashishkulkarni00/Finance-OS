# ADR-0019 — AI is an interface over the state engine, never a calculator

**Status:** Accepted
**Date:** 2026-09-23
**Context:** `FINANCIAL_OS.md` D8 and §7 · `ROADMAP.md` Phase 6 and the not-building list · ADR-0006

---

## Context

Nothing AI-shaped is built, and nothing here asks for any to be. This record exists because
the pressure to add it will not arrive as a design decision — it will arrive as a small,
reasonable-looking convenience: *"just let the model work out how much they can afford."*

The reason to write it down now, while nothing is at stake, is that the constraint is
cheapest to hold before there is code depending on it.

## Decision

**A language model may only read from the state engine, phrase what it finds, and route the
user to a screen that already exists. It may never produce a figure.**

Concretely, the boundary:

| Allowed | Not allowed |
|---|---|
| Turning a question into a query against `FinancialState` | Computing Room, Real Balance, a projection or a payoff date |
| Wording an answer the engine already contains | Deciding whether a commitment is at risk |
| Summarising a month the engine has closed | Producing a number that appears nowhere else |
| Suggesting which existing screen answers the question | Being the only source of an answer |

Every figure a user reads must be traceable to the same computation that produced it on a
screen. If the model and the ledger can disagree, the feature is wrong regardless of how well
it performs.

## Why this and not the obvious alternative

The obvious alternative — let the model compute, it is good at arithmetic now — fails for a
reason that is not about capability.

**This product's core promise is that it is never confidently wrong** (ADR-0006: missing data
returns `INCOMPLETE`, never a guess). A model asked "can I afford ₹12,000?" will answer.
It will answer when a mandatory bill has no amount yet, which is precisely the state where
the engine deliberately *refuses* to answer. The failure is silent, fluent, and indistinguishable
from a correct answer — the single worst failure mode available to a money product, and the
one this codebase has been shaped around avoiding since ADR-0006.

A wrong number the user can trace is a bug. A wrong number in a sentence is a betrayal.

## Consequences

- **`GET /financial-state` (Phase 1.1) is the prerequisite**, not a nice-to-have. Until one
  object can answer "where do I stand" with provenance, there is nothing safe to put an
  interface over. This is why D8 sits in Phase 6 and not earlier.
- **Provenance (1.3) is load-bearing for this**, not decoration: "every figure carries what
  produced it" is what lets a phrasing layer cite rather than compute.
- A model answer that cannot be traced to an engine figure must be **withheld**, in the same
  way and for the same reason a partial total is withheld.
- This forecloses a genuinely useful-sounding feature — free-text "what if I spend ₹X?" —
  until the simulation behind it exists as real code (Phase 3.2). That is the intended cost.

## Not in scope

No model, no provider, no prompt, no vendor. Choosing any of those is a separate decision and
a later one. This ADR only fixes what such a feature would be **allowed to do**.
