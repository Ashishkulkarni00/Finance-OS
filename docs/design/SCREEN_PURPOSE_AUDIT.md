# Screen Purpose Audit

**Written 2026-09-10, after reading all 13 tabs of `G:\Finance\Finance.xlsx` against the
five screens as built.** Study only — nothing in here has been implemented.

The trigger: *"Today part I liked, but it should be live — clicking what needs me should
take me to the detail. I'm not sure what Month is showing me, same for Money. The summary
at top consumes a lot of room. Goals won't scale past one. Commitment rules — not sure how
it's working. There should be proper significance to each screen."*

Every one of those is correct, and they share three root causes. This document names them,
then proposes what each screen is actually **for**.

---

## 1. What the workbook actually is

13 tabs, but they fall into three layers — and the app has collapsed two of them.

| Layer | Tabs | What it does |
|---|---|---|
| **Decision surfaces** | `Today` · `C-Month` | Read daily / weekly. Tell you what to do |
| **Registers** | `Accounts` · `Cards` · `Loans` · `Recurring` · `Investments` · `Goals` | One per *kind* of money. Each has its own logic |
| **Machinery** | `Tracker` · `Imports` · `Setup` · `History` · `Legend` | Feeds the above. Rarely opened |

**The workbook has six registers. The app has one screen (Money) covering four of them and
another (Plan) covering two.** That collapse is the direct cause of "I'm not sure what
Money is showing me" — four different kinds of money, each with different rules, stacked in
one scroll with no hierarchy and no thesis.

### What each register knows that we don't

- **Accounts** — `Min Balance`, `MAB Mandatory`, `Reserved`, and crucially **`Available` as a
  figure distinct from `Current Balance`** (HDFC Premium: balance ₹25,000, available **₹0**,
  because the MAB is mandatory). We show one balance column and call it done.
- **Cards** — four *different* numbers that we flatten into one: `Statement to pay` (due on
  the 10th) · `Purchases since that statement` (lands on the next bill) · `Total outstanding`
  · `Available credit`. Plus the anti-double-count rule stated in plain words on the sheet.
- **Loans** — `EMIs Left` · `Remaining Payments` · `Principal Outstanding` · **`Confidence`**
  (Confirmed / Estimated / TBD) · and the split between **EMI leaving a bank account
  (₹14,545/mo)** vs **EMI billed to the card (₹6,398/mo)** — because card EMIs reach you
  *inside* the card bill, not separately. We model none of this.
- **Recurring** — `Why` · **`If I skip it`** · `Priority` · `Verify?`. See §4.
- **Investments** — `Total Invested` vs `Current Value` vs `Gain`, and says **"Not updated"**
  rather than guessing. We have no investments surface at all.
- **Goals** — a flat table, with a **nested milestone** ("milestone: first 1 lakh" under
  Emergency fund) and `TBD` where a target isn't set.

---

## 2. The three root causes

### RC-1 · There is no detail layer. At all.

Six routes exist (`/today`, `/month`, `/month/close`, `/money`, `/plan`, `/onboarding`) and
**every one of them is a list or a summary**. Nothing in the product can be opened. The `Row`
primitive supports `onClick` and not a single caller passes it.

This is the whole of the user's first complaint, and it is bigger than Today: it means no
number in the product can be interrogated. The workbook's answer to "why is this number
what it is?" is `Ctrl + [` — trace the formula back to the `Tracker` row that caused it, with
the `Legend` sheet explaining every figure's inputs and source. We have no equivalent.

`DESIGN_SYSTEM.md` §12 rule 10 already requires this — *"The breakdown is always one tap
away. A number the user cannot verify is a number they will not trust"* — and
`SCREEN_SPECS.md` S3 already specifies the pattern: **"Desktop: master-detail — commitment
list left, selected detail right."** It was specified and never built.

### RC-2 · Today and Month have overlapping jobs, so neither reads clearly

Both screens show commitments. Today shows Room Left + Needs You + Coming Up; Month shows a
summary + the same commitments again. Nothing tells the user which screen is for what.

The workbook has no such ambiguity, because `C-Month`'s obligations block is titled with a
question: **"What do I need to do?"** — it is an *Action Center*, not a report. Ours is a
passive list of names, dates and amounts.

### RC-3 · Summaries are sized like heroes, and lists are sized like summaries

Exactly inverted. On Month, the net-position statement takes ~200px of ruled rows plus a
notes column before the actual work begins. Meanwhile `Goals` renders a **card per goal**
(~110px each — five goals is 550px) where the workbook uses one **row** per goal (~90px for
all three, milestone included).

The workbook's own summary blocks are tight: `Today`'s "Where I stand" is 6 short rows;
`C-Month`'s month summary is 9. Small type, no notes column eating the width, and the work
starts immediately underneath.

---

## 3. What each screen is *for* — proposed

One job each. If two screens can answer the same question, one of them is wrong.

| Screen | The one job | User question | Workbook equivalent |
|---|---|---|---|
| **Today** | Can I spend right now, and is anything about to go wrong? | *"What can I spend today?"* | `Today`, top half |
| **Month** | What still has to happen this cycle, and is the plan holding? | *"What do I need to do?"* | `C-Month` — Action Center + Planned vs actual |
| **Money** | What do I own, owe and hold — and is any of it wrong? | *"What's my position?"* | `Accounts` + `Cards` + `Loans` + `Investments` |
| **Plan** | What rules govern my money, and where do they take me? | *"Is this realistic?"* | `Recurring` + `Goals` + `History` |
| **Month Close** | What happened, and what should change? | *"How did I actually do?"* | close checklist + `History` |
| **Detail** *(missing)* | Everything about **one** thing | *"Why is this number what it is?"* | `Ctrl + [` + `Legend` |

### The rule that separates Today from Month

> **Today is the next 24 hours. Month is the whole cycle.**

Today shows **urgency** — Room Left, what needs you *now*, the next 3 things. It must never
show the full obligation list. Month shows **completeness** — every obligation, with status,
what's still due, and what happens if you skip it. That single rule removes the overlap.

### What Money should become

Not one scroll — **four registers with their own identities**, in the order S4 already
specifies (net worth → accounts → cards → debts → investments), each carrying the logic the
workbook gives it:

- **Net worth** — with change since last cycle, and labelled **approximate** while any
  component is unknown (S4 states this; we show a bare −₹1,77,543 with no framing at all).
- **Accounts** — `Available` alongside `Balance`, reserved and minimum-balance state visible.
- **Cards** — the four distinct numbers, not one.
- **Debts** — the countdown. S4: *"emotionally the most important block on the screen… it
  gets the craft budget."* Currently blocked by a real backend gap (§5).
- **Investments** — invested vs value, "not updated" when it isn't.

---

## 4. The single highest-value thing the workbook has and we don't

`Recurring` carries two free-text columns on every commitment:

| Item | Why | **If I skip it** |
|---|---|---|
| Bike loan EMI | Loan instalment | Late fee and credit-score damage |
| Home support | Family support | **Family depends on it** |
| Mobile recharge | Phone recharges | Number goes inactive |
| Petrol | Fuel — amount varies, but you cannot skip it | You stop being able to travel |
| Electricity | Utility bill | Disconnection |
| Credit-card bill | Settle the statement | Interest around 42% a year plus credit-score damage |

**This is what turns a list of bills into a set of consequences.** It is the difference
between an admin screen and a screen that means something — and it costs two `VARCHAR`
columns. `Commitment` currently has no `why`, no `ifSkipped`, and no `priority`; only a
`mandatory` boolean.

The workbook also states the mechanism in one sentence at the top of the sheet:

> *"This list is what generates the Action Center every cycle. Add a row here and it appears
> there automatically."*

That sentence is the entire answer to *"commitment rules — not sure how it's working."* Our
Plan screen shows a read-only list of rules with nothing explaining that a **rule** generates
a monthly **instance**, and that the instance is the thing you settle on Month.

---

## 5. Domain gaps this study surfaces

Ordered by (value ÷ cost). Items 1 and 3 are cheap and change how the product *feels*.

1. **`Commitment.why` · `Commitment.ifSkipped` · `Commitment.priority`** — consequence
   framing, per §4. Two text columns and an enum.
2. **Loan payments have no write path** — already logged separately: nothing in the codebase
   ever creates a `LoanPayment`, so `amountRepaid` is permanently `₹0` and every loan shows
   its full original term. This blocks S4's "most motivating element in the product".
3. **A system-health endpoint** — the workbook's `Today` ends with **seven named checks**
   (transactions with a problem · mandatory payments with an unknown amount · obligations
   overdue-or-unverified · accounts below minimum · card minimum due not entered · loans with
   unknown principal · goals without a target · import rows to clean), each with a count and
   a consequence. Ours checks two of the eight.
4. **Loan `confidence` + `emisLeft` + `remainingPayments`**, and honouring `paidVia = CARD`
   so card EMIs aren't counted twice.
5. **Investments / valuation** — no entity exists.
6. **Goal milestones** — nested sub-goals.
7. **Category plan numbers — reopen `OPEN_QUESTIONS` Q2.** We decided *no budgets*, on the
   sound reasoning that aspirational budgets are what people fail and abandon; the intended
   replacement was *"compared against your own baseline"*. But a baseline needs ≥3 cycles,
   the DB has one, so **both** of the workbook's most-used judgement blocks are currently
   empty placeholders: `Today`'s "Where the extra went this cycle" and `C-Month`'s "Planned
   vs actual by category". The workbook solves it with an explicit per-category number in
   `Setup`. Suggested resolution: a **plan** number per category — seeded from history the
   moment history exists, editable, and worded as *your own plan*, never as a budget you have
   failed. This keeps the honesty rule and unblocks half of Month.

---

## 6. Suggested build order

Four phases. A is presentation-only; B is the user's headline ask; C and D need backend.

**Phase A — make each screen mean one thing** *(no backend)*
- A1 · Move the full obligation list off Today (keep the next 3). Make Month the Action
  Center, with `Still due` distinct from `Amount`.
- A2 · Compress the Month and Money summaries into a dense strip; derivation on demand.
- A3 · Goals → rows, not cards. Commitment rules → a real table, opening with the one
  sentence that explains rule → instance.
- A4 · Money → four titled registers; net worth labelled approximate, with its change.

**Phase B — the detail layer** *(the headline ask)*
- B1 · `/commitments/:instanceId` — the rule behind it, why, what happens if skipped,
  history across cycles, the linked transaction, and the actions. Then make Needs You,
  Coming Up and the Month rows all navigate to it.
- B2 · `/accounts/:id` · `/loans/:id` · `/cards/:accountId` · `/goals/:id`.
- B3 · Desktop master-detail on Month, per S3.

**Phase C — the domain fields**
- C1 · why / ifSkipped / priority → unlocks consequence framing on every surface.
- C2 · Loan payments → fixes the debt countdown.
- C3 · System-health endpoint → a real "Needs attention".

**Phase D — judgement**
- D1 · Category plan numbers → "planned vs actual" on Month, "where the extra went" on Today.
- D2 · Investments and valuation.
- D3 · Explain-this-number breakdowns — the `Legend` equivalent, per §12 rule 10.

---

## 7. One thing to preserve

The workbook closes `Today` with this line:

> *"Every number on this sheet is calculated. Nothing here is typed in, and nothing is
> assumed — if a figure cannot be worked out safely it says Insufficient data or Needs Review
> instead of guessing."*

That is already our ADR-0006 and our `Unknown` state, and it is the one thing the app
currently does **better** than the spreadsheet. Nothing in the phases above should trade it
away for a fuller-looking screen.
