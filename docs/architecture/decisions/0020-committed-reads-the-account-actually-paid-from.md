# ADR-0020 — `committed` reads the account actually paid from, not the planned one

**Status:** Accepted
**Date:** 2026-10-03
**Context:** ADR-0011 · ADR-0018 · `product/USAGE_ISSUES.md` U3 · V23 · `CLAUDE.md` rule 3

---

## Context

A commitment has a **"Paid from"** account. Until 2026-10-02 that field was load-bearing in
two unrelated places at once:

1. **Settlement** refused — or flagged `NEEDS_REVIEW` — a payment from any other account.
2. **`PositionServiceImpl.leavesHeldMoney`** used it to decide whether a bill's outstanding
   amount belongs in `committed`, and therefore whether Real Balance subtracts it.

U3 removed the first. The user's words were *"from anywhere I should be able to pay"*, and
they were right: making someone rewrite the plan in order to record what they actually did is
the product telling the user they are wrong about their own money. Settlement now checks only
the **destination**.

**Nobody changed the second, and that turned "Paid from" into a silent liar.**

The failure showed up on real data within a day, on this user's emergency-fund top-up:

| | |
|---|---|
| Planned | **Cash wallet → HDFC Premium.** Neither account is spendable, so `leavesHeldMoney` returned `false` and all ₹15,000 stayed out of `committed`. Correct, under the plan |
| Actual | ₹9,500 came from Cash wallet, then **₹500 on 1 Oct and ₹500 on 2 Oct came from HDFC Salary**, which *is* spendable |
| Effect | ₹1,000 left spending money having never been counted as promised. `held` fell; `committed` did not. Real Balance had announced that ₹1,000 as free, and then it was gone |
| Still ahead | ₹4,500 outstanding. Paid the same way it would take Real Balance from **₹3,627 to −₹873** — and nothing on any screen could see it coming |

The arithmetic was never wrong at any single instant. **The forecast was.** That is the worse
failure of the two: a balance that is right now and wrong about tomorrow is exactly what the
spreadsheet did, and it is why `committed` exists at all.

## Decision

**For each open instance, resolve the source account from the most recent recorded payment;
fall back to the commitment's planned account only when the bill has no payments yet.**

```
sourceAccountId(instance) = account of the latest row in commitment_instance_payments
                            for this instance, else commitment.accountId
```

`leavesHeldMoney` takes that account id instead of reading `commitment.getAccountId()`.

Three consequences are deliberate:

- **The destination is still read from the plan, and that is not the same compromise.**
  `settle` enforces the destination — money that arrived somewhere else did not pay this bill —
  so the planned destination is a rule the data has to obey. Only the source was ever a guess.
- **Evidence, not inference.** The source comes from a row the user's own settle wrote. We do
  not predict where they will pay from; we read where they have been paying from. A bill with
  no payments has no evidence, and its plan is then the best answer available — and for most
  bills it is also the right one.
- **It is self-correcting in both directions.** Pay the rest of that top-up from Cash wallet
  and the latest payment's source becomes non-spendable again, the ₹4,500 leaves `committed`,
  and Real Balance returns to ₹3,627 — which is the truth, because nothing left spending money.

This is ADR-0018's rule applied to a second figure: **a number is true because an entry says
so, not because a plan said it would be.** It is also why V23's payments table had to exist
first — with only `linked_transaction_id` to read, "where has this bill been paid from" could
be answered only for the most recent settle, and that value was the one a second settle
destroyed.

## Consequences

- **Real Balance will drop for any bill planned from a non-spendable account and actually paid
  from a spendable one.** That drop is the warning, not the bug. Real Balance went from ₹3,627
  to **−₹873** on the user's live data the moment this shipped, and `Emergency fund top-up
  ₹4,500` now appears as a named row in the position breakdown, so the change is visible and
  attributable rather than a figure that moved on its own.
- **No schema change.** V23's table already holds everything needed. One extra query per
  position read, indexed on `commitment_instance_id` via the unique key.
- **No API shape change.** `GET /position` returns the same fields; `breakdown.commitments`
  simply gains rows that belong in it.
- **A negative `perDay` is now reachable in ordinary use.** `FreeUntilSalaryHero` already
  switches to the "more is planned to leave than you hold" wording when Real Balance is
  negative and suppresses the per-day figure there, so nothing renders `−₹34.92 a day`.
- **Not changed, and knowingly inconsistent:** the shortfall insight and the 12-month forecast
  still project from the planned account. For *which account will run short* the plan is
  arguably the right input — it is a statement of intent about a future payment. But it is the
  same disagreement between plan and evidence, and it deserves its own pass rather than being
  swept along with this one.

## The register (M1, 2026-10-03)

The decision above was made for one figure. **1.9 and 1.11 then turned up as the same defect in
two more places, so every read of a commitment's plan accounts was audited and labelled.** A
plan field is not wrong to read — it is wrong to read *without having decided*. Each site now
says which it wants, in a comment, so the next reader inherits the decision instead of the
ambiguity.

| Site | Wants | Status |
|---|---|---|
| `PositionServiceImpl` — `committed` | **evidence** (source) · plan (destination) | fixed, this ADR |
| `ProjectionServiceImpl` — which bills hit an account | **evidence** | **fixed 2026-10-03 (1.9)** |
| `CommitmentBucketClassifier` — source | **evidence** | **known wrong, not fixed (1.11)** — see below |
| `CommitmentBucketClassifier` — destination | plan | correct; `settle` enforces it |
| `CommitmentInstanceServiceImpl.settle` — `accountMatches` | plan | correct; this *is* the rule |
| `CommitmentInstanceServiceImpl.settledFrom` | evidence | already correct (U3) |
| `CommitmentAutoMatcher` | plan | correct, and deliberately so |
| `TimelineServiceImpl` — Coming up | plan | correct; unpaid bills have no evidence |
| `ForecastServiceImpl` | plan | correct; a rule projection by design |
| Mappers, `CommitmentPlanFields`, detail views | plan | correct by definition — they display or version the plan itself |

**`CommitmentSourceResolver`** now holds the one implementation of "where does this bill's money
come from", shared by the position and the projection. It was two copies for a day, which is how
long it takes for two copies to be one copy too many.

### Why the auto-matcher keeps the plan

It is the one reader that should. Auto-matching links a bill **without being asked**, so a loose
match is a silent wrong answer rather than a choice someone made; narrowing to the planned
accounts is exactly what stops it guessing. A payment from elsewhere is still linkable — on the
Settle sheet, where the user can see what they are agreeing to.

### Why the bucket classifier was left alone

Reading the planned source there means an account's **spendability** decides a month's shape, so
flipping Cash wallet to "spending money" on 2026-10-03 moved a ₹15,000 top-up into
`plannedSavings` and took *Free this month* down by that much — retroactively, with no warning
(FIX_BACKLOG 1.11).

The fix is the same as everywhere else, but the blast radius is not: the classifier is shared
with `CycleReview`, where changing it would **restate closed cycles**, and a closed cycle is a
historical fact rather than a cache (`CLAUDE.md` rule 1). `CycleReview` recomputes live today
rather than reading `CycleSnapshot`, so that is a real risk and not a theoretical one. **That
question is open.** Half-changing it — evidence for the open cycle, plan for closed ones — would
be a fourth rule in a file whose whole purpose is that there is only one.

---

## Alternatives rejected

**Count a bill as committed if *any* of its payments came from a spendable account.** Safer in
one direction — it would never under-count — but it never lets go. One accidental payment from
the salary account would hold back that bill's remainder for the rest of the cycle, and the
user would have no way to tell the app it was a one-off.

**Flag the disagreement as an insight and leave the figure alone.** Honest, and worth doing
*as well*, but it leaves Real Balance stating a number it knows is wrong. A warning beside a
wrong figure is still a wrong figure.

**Make the user fix the plan.** This is precisely what U3 removed, and re-adding it one layer
down would be the same defect wearing a different hat.
