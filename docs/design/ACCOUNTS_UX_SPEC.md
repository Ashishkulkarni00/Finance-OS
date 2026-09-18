# Accounts — UX Specification

**Written 2026-09-10.** The *how* for `docs/product/ACCOUNTS_EXPERIENCE.md`. Follows
`DESIGN_SYSTEM.md` and `UI_UX_PRINCIPLES.md`; where silent, those govern.

Direction: **The Statement** — net worth (with confidence) → Needs a look → registers, each
with its own identity, ordered by how directly they're "yours to spend."

---

## 1. Screen structure

```
┌──────────────────────────────────────────────────────────────────┐
│ 1  NET WORTH        ₹—,—,— · Approximate - one loan unconfirmed   │  hero
├──────────────────────────────────────────────────────────────────┤
│ 2  NEEDS A LOOK      (only when non-empty)                        │  attention
│                     ⚠ IDBI is already short · ⚠ HDFC below min    │
├──────────────────────────────────────────────────────────────────┤
│ 3  CASH & BANK       balance + available, per account              │  register
├──────────────────────────────────────────────────────────────────┤
│ 4  CARDS             outstanding · unbilled · available credit     │  register
├──────────────────────────────────────────────────────────────────┤
│ 5  DEBTS             countdown, total monthly EMI                  │  register
├──────────────────────────────────────────────────────────────────┤
│ 6  INVESTMENTS       balance only, gain tracking flagged honest    │  register
└──────────────────────────────────────────────────────────────────┘
```

Each register is visually its own block: a `SectionHeader`, its own domain-hue accent
(`--commit` cash, existing `--debt` for cards/debts, `--invest` for investments), not one
continuous table. `DESIGN_SYSTEM.md` already has the hues; they've never been used here.

---

## 2. Zone 1 — Net worth

```
NET WORTH
₹—,—,—                                          ← 44px hero, tabular
Approximate — the Bike Loan's principal hasn't been confirmed.   ← only when applicable
```

- Hero uses the existing `Amount` treatment (`role="hero"`), `emphasiseNegative` (net worth
  can be genuinely negative while paying down debt — that's not a bug, per the Legend's own
  definition; still shown plainly, never alarmed over).
- **Confidence line** appears only when at least one loan is unconfirmed/estimated. Names
  the specific loan, links to it. Absent entirely when everything is confirmed — never a
  reassuring "All figures confirmed" banner; silence is the confirmation
  (`UI_UX_PRINCIPLES.md` §14 pattern, applied to trust instead of attention).
- Below it, the existing two-line breakdown (what you own / what you owe) stays — it's
  already correct, just now sits under the confidence line instead of standing alone.

---

## 3. Zone 2 — Needs a look

Same shape as Month's Needs You — rendered only when non-empty, cards not rows, one line
per fact, no verdict-language, amber tint (`color-mix(in srgb, var(--attention) 8%,
var(--surface))`), never a red fill.

```
┌─ ⚠ ─────────────────────────────────────────┐
│ IDBI is already short                         │
│ Holds −₹12,573 right now.                     │
└────────────────────────────────────────────────┘
┌─ ⚠ ─────────────────────────────────────────┐
│ HDFC Premium is below its minimum              │
│ ₹25,000 held · ₹25,000 required. Mandatory -   │
│ a shortfall can attract a penalty.             │
└────────────────────────────────────────────────┘
```

Each card opens its account's detail page (already exists, `/accounts/:id`). Empty state:
omit the zone entirely — no "nothing needs you" line here (unlike Month, this zone isn't a
guaranteed daily visit; its absence should read as clean, not as a message).

Attention causes, ranked:
1. Below minimum **and mandatory** (a real penalty risk)
2. Already negative
3. Projected short before a known upcoming debit
4. Card outstanding near its limit (a threshold, not a hard rule — e.g. >90% of `creditLimit`)
5. Below minimum, **not** mandatory (a target, not a real risk) — lower urgency, shown last

---

## 4. Zone 3 — Cash & Bank

Replaces the flat "Accounts" table's mixing of every account type. Bank and cash accounts
only — cards, loans and investments get their own zones below.

```
CASH & BANK                                              3 accounts
────────────────────────────────────────────────────────────────
HDFC Salary                              Balance    ₹31,980
Bank · •• 1234                           Available  ₹31,980

HDFC Premium                             Balance    ₹25,000
Bank · Emergency fund · Mandatory min    Available  ₹0

IDBI                                     Balance    −₹12,573
Bank                                     Available  −₹12,573              ›
```

- **Balance and Available both shown whenever they differ.** When they're equal (the
  common case — no reservation, no mandatory minimum), collapse to one line; showing two
  identical numbers is noise, not information. This is the direct fix for the Excel's
  `HDFC Premium` case (§2 of the product doc).
- Rows stay clickable to `/accounts/:id` with the same chevron affordance established on
  Month — one clickability language across the app, not a new one per screen.
- Needs-a-look accounts do **not** repeat here with their warning — they were already shown
  in Zone 2. This row shows their plain facts only, same as Month's Plan zone not repeating
  Tier 1 content.

---

## 5. Zone 4 — Cards

```
CARDS                                                        1 card
────────────────────────────────────────────────────────────────
HDFC MoneyBack                            Outstanding   ₹3,200
Due 12th                                  Unbilled       ₹0
                                           Available      ₹1,46,800        ›
```

Three figures, not two — `unbilled` is already computed server-side and simply wasn't
rendered. Labelled, not just juxtaposed, so "outstanding" (this bill) and "unbilled" (next
bill) can't be misread as the same thing — the exact confusion the Excel's own Cards sheet
calls out in its header note.

---

## 6. Zone 5 — Debts

Countdown framing stays exactly as `LoanDetailPage` and the current `DebtsSection` already
do it — that part is right. Adds one summary line above the list, the Excel's "Monthly EMI
leaving a bank account" fact that we don't currently surface anywhere:

```
DEBTS                                          2 loans · ₹8,700/mo total
────────────────────────────────────────────────────────────────
Bajaj Finance                             ₹0 repaid · debt-free Jun 2028
₹3,900/mo                                                                  ›

SBI                                       ₹0 repaid · debt-free Jan 2030
₹4,800/mo                                                                  ›
```

Cards keep their `--debt` domain-hue accent bar, already built. No change to the countdown
logic itself — it's blocked on the separate `LoanPayment` write-path gap, tracked
independently and not part of this redesign.

---

## 7. Zone 6 — Investments

```
INVESTMENTS                                                  2 accounts
────────────────────────────────────────────────────────────────
Zerodha                                                       ₹47,500
Investment

RD Account                                                    ₹21,000
Investment

Gain tracking isn't built yet - this shows what's held, not what it's worth.
```

Honest placeholder sentence, same treatment as Month's flexible-spending baseline before
it had real data. **Never compute a fake gain** from opening-vs-current when we don't track
valuation history — that's confidently-wrong territory (ADR-0006), applied here for the
first time to an investment figure.

---

## 8. Interaction model

Matches Month: **visible → detailed**, two tiers (no `ⓘ` contextual popover here yet —
that's the Explain system, shared infrastructure, sequenced globally rather than
per-screen). Every register row opens its account/loan detail page via the chevron
affordance already established.

Reconciliation (`ACCOUNTS_EXPERIENCE.md` §9) is **not** in this pass — it needs its own
interaction (a periodic prompt, a confirm/correct flow) and is sequenced as a later step,
not squeezed into the structural pass.

---

## 9. States

| State | Treatment |
|---|---|
| **Loading** | Skeletons per zone, independent — a slow Cards fetch must not block Net worth. |
| **Empty — no accounts** | Existing empty state, unchanged: *"Nothing here yet."* + [Add an account]. |
| **Empty — no cards / no loans / no investments** | That zone is omitted entirely, not shown empty — a user with no credit card shouldn't see a "Cards" heading over nothing. |
| **Needs a look — empty** | Zone omitted, no reassurance banner (§3). |
| **Net worth unavailable** | Existing fallback line kept: *"Net worth isn't available right now."* |
| **Error** | Per zone, not per page — a failed Cards query must not blank Net worth or Cash & Bank. |

---

## 10. What this needs from the backend

| Addition | Why server-side |
|---|---|
| `available` per account (`balance − reserved − mandatory minimum`) | Money arithmetic — never client-side |
| Account-level attention classification | One definition, shared with Today's existing shortfall card, same reasoning as `AttentionTier` |
| Loan `confidence` (or reuse of an existing estimate signal) | Drives net worth's approximate label |
| `EMI total` for the Debts zone header | A sum across loans — server-side |

None of these are large additions individually — each mirrors a pattern already built for
Month (`plannedTotal`, `AttentionTier`, a small derived total).

---

## 11. Build order

1. **Restructure** — four/five registers with real identity, Balance/Available split,
   unbilled shown, Needs a look zone (using a first-pass client-composed attention check
   from existing per-account data, mirroring how Month's Zone 1–2 shipped before Pace).
2. **Attention, server-side** — move the Needs a look classification to a real endpoint,
   same shape as `AttentionTier`.
3. **Confidence** — loan confidence field, net worth approximate label.
4. **Reconciliation** — the primary-action feature, its own interaction design.
5. **Investments** — real valuation tracking, if and when a `Valuation` entity is built.
