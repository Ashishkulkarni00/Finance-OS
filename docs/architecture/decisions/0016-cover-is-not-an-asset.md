# ADR-0016 — Insurance is its own primitive, and cover is never an asset

**Status:** Accepted
**Date:** 2026-09-21
**Context:** `ROADMAP.md` 1.3 · `FINANCIAL_STATE.md` missing primitives · `FINANCIAL_OS.md` D7

---

## Context

The product had nowhere to record **being covered**. The user's health insurance existed
only as a `LOAN` account, because the premium had been financed on a credit card — which
records the debt correctly and says nothing whatsoever about the policy behind it. The app
knew ₹3,998 left every month and had no idea what it bought.

Every entity so far answers one of two questions: *what do I have* (accounts, investments)
or *what do I owe* (loans, cards, commitments). A policy answers a third:

> **What would I not have to find if this happened?**

That question has no home in the existing model, which is what makes it a primitive rather
than another kind of bill.

## Decision

### 1. One typed entity, not one per kind

`insurance_policies` with an `InsuranceType` enum (`HEALTH` / `LIFE` / `MOTOR` / `HOME` /
`OTHER`), following `AccountType` (ADR-0008) and `InvestmentType`.

Typed from the start so a device warranty or an appliance AMC fits later without a
migration — they are the same shape, a premium paid against a cost you would otherwise
have to find yourself. **Nothing is built for them now.** A general "protection framework"
for one real use case would be architecture for its own sake.

### 2. The premium is an ordinary commitment

`CommitmentSource` gains `INSURANCE`, alongside `LOAN`, `INVESTMENT` and `GOAL`. A premium
bill *follows* its policy exactly as an EMI follows its loan.

This is what keeps the feature small: the bill, its cycle-scoped occurrences, the settle
path, plan revisions, attention tiers and Months all work already. The new entity only has
to hold what a commitment cannot express — **cover, renewal, insurer**.

One deliberate difference from a loan EMI: the **paying account stays the bill's own**. A
policy records being covered, not which account happens to pay for it, and the same insurer
is often paid from whichever account has room that month.

### 3. **Cover is never an asset**

`coverAmount` is not added to net worth, not counted as money held, and not spendable.

This is the decision most likely to be "helpfully" undone by someone later, so it is
written down. ₹5,00,000 of health cover is money you would **not have to find**, not money
you have. Adding it to net worth would overstate it by the single figure most likely to
make someone feel safe — on a net worth of **−₹2,75,595**, one health policy would flip the
number positive while changing nothing about the position.

`totalCover` on the summary exists for reassurance only, and is not a pot: ₹5L of health
plus ₹1cr of life is not a sum anyone could ever spend.

### 4. A financed premium stays a loan

The roadmap said "migrate the health-insurance-as-loan record". We did not, and would not:
that loan is a **real liability** — ₹42,701 genuinely owed to HDFC. Deleting it to make the
model tidier would erase a debt.

The policy is an *addition*. `insurance_policies.loan_id` links the two so the loan can say
what it bought and the policy can say it is still being paid for, with `ON DELETE SET NULL`
because **cover outlives the instalments**.

## Consequences

- **Almost every field is nullable**, deliberately. "I'm covered but I can't remember for
  how much" and "my employer pays for it" are both true and common. Refusing the record
  until every box is filled loses the fact that cover exists at all (ADR-0006).
- **`monthlyCost` is null when unknown, never zero.** A policy whose premium was never
  recorded costs *something*; reporting ₹0 would quietly improve the monthly picture. A
  genuine one-off premium is the one case that really is zero per month.
- **`monthlyPremium` on the summary is null when any policy's premium is unknown**, rather
  than a total silently missing one.
- **`CoverStatus` is derived, never stored** (ADR-0011) — `LAPSED` / `RENEWS_SOON` /
  `ACTIVE` / `UNKNOWN`, from `renewsOn` against today. `UNKNOWN` rather than `ACTIVE` when
  no renewal date was given: a lapsed policy is the one case where the money looks fine and
  the exposure is total, and we must not imply cover we can't confirm.
- **`PremiumFrequency` is separate from `CommitmentFrequency`.** Half-yearly is common in
  India and has no commitment equivalent, so such a premium is planned *quarterly* — asking
  for the money more often than it is really due. Wrong in the safe direction, never a
  surprise.
- `policy_last_four` only, never the whole policy number (ADR-0010).

## Related

ADR-0006 (incomplete is not an error) · ADR-0008 (enum for kind) · ADR-0010 (never store
identifiers) · ADR-0011 (derived values are never stored) · ADR-0015 (plans are versioned —
a premium bill's changes are recorded like any other).
