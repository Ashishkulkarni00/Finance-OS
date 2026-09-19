# Information Architecture

---

## 1. The test every screen must pass

> Can the user answer *"what should I do?"* within five seconds of arriving?

If a screen only answers *"what happened?"*, it belongs one level deeper.

---

## 2. Primary navigation — five items

**Applied 2026-09-18** as Today · Months · Ahead · Money · Ledger + Add (see `STRATEGY_DEEP_DIVE.md` §D; "Plan" became "Ahead"; Goals live under Ahead; the Money tabs are Overview · Cards · Debts · Investments).

Deliberately five. Mobile bottom-bar limit, and more than five means we have not decided
what matters.

| # | Nav | Answers | Frequency |
|---|---|---|---|
| 1 | **Today** | "What can I spend? What needs doing?" | Daily |
| 2 | **Month** | "How is this cycle going?" | Weekly |
| 3 | **Add** *(centre, action)* | — | Several times daily |
| 4 | **Money** | "What do I have, owe, and own?" | Weekly |
| 5 | **Plan** | "Where am I heading?" | Monthly |

**Add is a centre action button, not a destination.** Capture is the highest-frequency
task in the product; burying it behind a menu is how retention dies.

---

## 3. What lives where

### 1 · Today
```
Room Left                             ₹290        ← the hero
  Room today ₹512 · spent ₹222
Real Balance                       ₹10,021        ← tappable → full breakdown
  held ₹68,021 · reserved ₹42,000 · committed ₹16,000

Next up
  Sun 13 Sep   SIP              ₹2,500   IDBI
  Tue 15 Sep   RD              ₹1,000   IDBI
  ⚠ IDBI is ₹6,882 short before the 13th        ← the projection alert

Needs you  (only when non-empty)
  ZestMoney EMI — unverified          [Confirm] [Not yet]
```

Empty state when nothing is wrong: *"Nothing needs you today."* — and that is a
feature, not a wasted screen.

### 2 · Month
The salary cycle, selectable. Plan → Live → Review → Close in one place.

- Cycle header: *28 Aug – 27 Sep · day 12 of 31*
- In / Out / Saved / Net
- **Commitments** — every instance, its status, one tap to settle
- **Flexible spending** — categories against personal baselines *(not moralised budgets)*
- **Close cycle** — appears in the last three days

### 3 · Add
Sheet, not page. Amount → category → account. Repeat merchants: 3 taps.
Type is inferred and correctable, never asked first.

### 4 · Money
- **Accounts** — balance, available, reserved, projection
- **Cards** — outstanding, unbilled, statement, due date
- **Debts** — payoff timeline, schedules
- **Investments** — invested vs value
- **Net worth** — assets − liabilities

### 5 · Plan
- **Goals** — progress, required per month, honest feasibility
- **Commitments** — the rules that generate every month
- **Insights** *(Phase 2)*
- **History** — cycle over cycle

---

## 4. Alternatives considered and rejected

| Structure | Why not |
|---|---|
| Overview · Transactions · Accounts · Budgets · Reports | The default everywhere. Transaction-centric — it makes the ledger the product. The ledger is the *substrate* |
| Dashboard-first with widgets | Configurable dashboards mean we failed to decide what matters |
| Separate Debt / Investments / Goals tabs | Seven nav items. Correct grouping is by *question*, not by financial instrument |
| Chat-first / AI-first | Premature. AI needs a correct model beneath it, and a blank prompt is a worse empty state than a number |
| Excel's 13 sheets | Sheets are storage, not navigation. `Setup`, `Legend`, `Imports`, `History` are settings and utilities, not destinations |

---

## 5. Layering — three depths

**Depth 1 — Glance.** Room Left, what is next, what needs attention.
**Depth 2 — Understand.** Tap any number → what it is made of, in plain words.
**Depth 3 — Manage.** Edit the rules, accounts, terms.

A user can live entirely at depth 1 for weeks. Nothing at depth 3 is ever required
unless something changed in their life.

---

## 6. Mobile vs desktop

| | Mobile | Desktop |
|---|---|---|
| Primary use | Capture, glance | Setup, review, close |
| Nav | Bottom bar, 5 items | Left rail |
| Today | Full screen, one card per section | Two columns |
| Month | Vertical sections | Master-detail |
| Tables | Cards | Real tables |

**Mobile is the primary capture surface** — that is where the user already logs.
**Desktop is the thinking surface** — setup, month-close, decisions.
Neither is a compromised version of the other.

---

## 7. Naming — plain words only

| Never | Always |
|---|---|
| Disposable income | Real Balance |
| Discretionary allowance | Room today |
| Liabilities | What you owe |
| Outstanding principal | Left to repay |
| Amortisation | Payment schedule |
| Reconciliation | Check against your bank |
| Debit / Credit | Money out / Money in |
| Net worth | Net worth *(then: "everything you own minus everything you owe")* |

Rule: if a 25-year-old with no finance background would have to look it up, it does not
ship — unless it is a term they will meet in real life anyway, in which case we use it
**and explain it inline**.
