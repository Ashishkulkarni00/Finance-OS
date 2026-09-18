# The Accounts Experience

**Written 2026-09-10.** Product concept for the **Accounts** tab, written before its
redesign is implemented — same process as `MONTH_EXPERIENCE.md`, applied to a different
question. Companion: `docs/design/ACCOUNTS_UX_SPEC.md` (the how).

Not an Excel port. The workbook's `Accounts`, `Cards`, `Loans` and `Investments` sheets are
evidence of what one person tracks with a grid — four separate tabs because a grid can't
cross-reference them. Software can.

---

## 1. The question

> *If I used this every day, what would I want when I click "Accounts"?*

Not a table of balances. I'd want, in order:

1. **What do I actually have, everywhere, right now?**
2. **Is anything wrong** — short, about to bounce, piling up unnoticed?
3. **What do I owe, and is it shrinking?**
4. **Do these numbers match what the bank says?**

Accounts is the only screen answering "what do I hold and owe" as a timeless snapshot —
distinct from Today (a point) and Month (a bounded cycle). Filter rule, same shape as
Month's: **if a fact isn't about holdings or trust in them, it doesn't belong here.**
Cycle-scoped things — this cycle's income, this cycle's spending pace — stay off Accounts
even though they touch the same accounts.

---

## 2. Balance is not the same question as Available

The single most important idea the Excel already has and we've built shallow so far:

> `HDFC Premium — balance ₹25,000, available ₹0` (the minimum balance is mandatory; that
> money is not yours to spend without a penalty.)

Today's Accounts table shows one number and calls it done. **Two different facts
collapsed into one column is exactly the kind of confidently-wrong the product exists to
refuse** — ADR-0006, applied here for the first time to an account's own balance, not just
to Real Balance.

```
Balance   = what the bank shows
Available = balance − reserved − (minimum, if mandatory)
```

Both belong on every spendable account. This is the "Available" register from
`SCREEN_PURPOSE_AUDIT.md` §1, finally acted on.

---

## 3. What Accounts is not

- **Not a place to log a transaction.** That's Add. Accounts explains money, doesn't move it.
- **Not a place to see cycle spending.** That's Month.
- **Not the same list four times.** Cash, cards, debts and investments have different
  logic and different questions — collapsing them into one table (today's state) is why
  "I'm not sure what Money is showing me" happened in the first place
  (`feedback_ui_must_match_excel_craft`). Four registers, one page, each with its own identity.

---

## 4. Reusing the attention model, not reinventing one

Month already answered "how urgent is this" with three tiers computed once, server-side.
Accounts asks the identical question about holdings instead of obligations — same shape,
same discipline: **one classifier, reused across every account-shaped list.**

**Needs a look** — a below-minimum account (especially where the minimum is mandatory) ·
projected to run short before a known upcoming debit (the existing per-account projection,
already built for Today) · a card whose outstanding is approaching its limit · a loan with
an unconfirmed/estimated principal, which makes net worth itself approximate.

**Fine** — everything else. No separate "watch" tier here — accounts don't accrue urgency
the way a bill's due date does; a balance is either a problem right now or it isn't.

This becomes Accounts' own "Needs a look" zone at the top — the same pattern as Month's
Needs You, not a coincidence. A recurring shape across the product is a feature: once a
user learns "the amber zone at the top is what needs me," it means the same thing everywhere.

---

## 5. Net worth needs a confidence label, not just a number

The Excel's Loans sheet carries a **Confidence** column (Confirmed / Estimated / TBD) that
we've never modelled. It matters here specifically: if any loan's principal is
unconfirmed, the debt total — and therefore net worth — is not a fact, it's an estimate.

`SCREEN_SPECS.md` S4 already commits to this and it was never built: *"Net worth is
labelled approximate while any component is unknown — never silently wrong."*

> **₹—,—,—** ← real figure
> *Approximate — the Bike Loan's principal hasn't been confirmed.*

Never silently precise about a number we're not sure of. This is cheap (a boolean derived
from existing `LoanResponse` confidence, once that concept exists) and it's a direct trust
payoff — the same category of honesty as ADR-0006.

---

## 6. Cards need their third number

The Excel's Cards sheet makes a specific distinction we currently collapse: **outstanding**
(what's due on the next payment) versus **unbilled** (spent since the last statement,
landing on the *next* bill, not this one). `CreditCardTermsResponse` already computes
`unbilled` — the field exists and is simply not shown. Without it, "outstanding ₹3,200"
looks like the whole story when a further ₹1,800 has already been spent and just hasn't
billed yet. This is the cheapest fix on this entire page: display a field that already exists.

---

## 7. Debt keeps its countdown, gains its confidence

`LoanDetailPage` already does the hard part right — "₹0 repaid · debt-free Jun 2028" as a
countdown, never a bare balance (blocked today by the known `LoanPayment` write-path gap,
tracked separately). What's still missing here is the **list view's** framing: today's
`DebtsSection` cards are fine individually but don't summarise "how much is leaving every
month for debt, total" — a single fact the Excel surfaces (`Monthly EMI leaving a BANK
account`) that we don't.

---

## 8. Investments — the honest gap

We hold `INVESTMENT`-type accounts (Zerodha, an RD) but no valuation history, no "invested
vs current value," no gain. Building the Excel's full Investments register (opening
invested, added since, current value, gain%) is a real domain addition — a `Valuation`
entity with its own write path — not something to fake with the one balance figure we have.

**For this pass:** show what we honestly know — the account and its current balance,
grouped under its own "Investments" identity rather than mixed into the cash table — and
say plainly that gain tracking isn't built yet, the same honest-placeholder treatment
already used for Month's flexible-spending baseline before that had real data. Do not
invent a gain figure from one balance.

---

## 9. Reconciliation — the trust primitive, still not built

Already named in `PRODUCT_STRATEGY.md` §6 as Accounts' primary action and still not
implemented: replace the Excel's *"retype four opening balances"* ritual with the product
asking, occasionally, *"HDFC Salary — we make it ₹31,980. Does your bank agree?"* A
mismatch **is** a missing or duplicated transaction, and the product can help find it. This
document keeps that as the destination for the primary action; the UX spec sequences it as
a later step, not step one, since it needs its own interaction design.

---

## 10. Concept exploration

Three directions, evaluated the same way Month's were.

### Concept A — "The Ledger" (what exists today)
Net worth, then one flat accounts table, then cards, then debts, stacked. Complete,
familiar, cheap to keep. *Rejected as the spine* — it's a report of holdings, not an
answer to "is anything wrong," and it already produced "I'm not sure what this is showing
me."

### Concept B — "The Vault" (registers as visually separate rooms)
Each register (Cash, Cards, Debt, Investments) as a distinct card-like block with its own
heading, icon and domain hue, net worth as a banner above all of them.
*Strength:* visually distinct, matches the domain-hue system already in the design
language (`--commit`/`--goal`/`--debt`/`--invest` exist for exactly this).
*Weakness:* alone, it's still just organised description — doesn't surface what's wrong
without reading every room.

### Concept C — "The Statement" *(chosen)*
Net worth as the hero, with its confidence label · a **Needs a look** zone immediately
below it (Accounts' equivalent of Month's Needs You) · then the registers, each with its
own identity, ordered by how directly they're "yours to spend": Cash & Bank → Cards →
Debts → Investments.
*Why it wins:* it answers "is anything wrong" before "what do I have," matching the actual
order a worried person reads a page in — and it reuses a pattern the user has already
learned from Month, rather than inventing a new one. Consistency across the product is a
usability feature, not a stylistic preference.

---

## 11. Jobs to be done

**Primary**
- What do I actually have, right now, everywhere?
- Is anything wrong with an account — short, below minimum, about to bounce?
- What do I owe, and is it shrinking?
- What's genuinely available to spend vs just sitting in a balance?

**Secondary**
- Do these numbers match my bank? *(reconciliation — deferred interaction, not deferred intent)*
- What's my card situation before the next statement?
- Where does my investment money sit?

**Explicitly not Accounts' job**
- How is this cycle going? → Today / Month
- Can I afford ₹8,000 right now? → Decide (planned)
- Am I improving over time? → Plan (trajectory)

---

## 12. Success criteria

A person opens Accounts and, without navigating away, can answer:
1. What do I have, across every account?
2. Is anything wrong right now?
3. What's actually available to spend vs just showing as a balance?
4. What do I owe, and is the debt shrinking?
5. Can I trust this number, or is part of it a guess?

And the negative test: nothing here is shown only because we have the data — Investments
stays honest about what it doesn't yet track rather than performing completeness.

---

## 13. What this needs from the backend

Computable today: net worth (exists), per-account balance (exists), card outstanding/
unbilled/available (exists, `unbilled` just isn't rendered), loan countdown (exists,
blocked on the separate `LoanPayment` gap), per-account shortfall projection (exists).

Needs adding:
- **Available balance** per account = `balance − reserved − (minimum, if mandatory)`.
  Small, mirrors the `plannedTotal` addition made for Month.
- **Account-level attention tier**, reusing the shape of `AttentionTier` — computed
  server-side for the same reason: one definition, shared with Today's shortfall card.
- **Loan confidence** concept, to drive net worth's approximate label.
- Reconciliation itself — a real feature with its own data model, sequenced later.
