# Screen Specifications

Every major screen, specified before implementation. No screen gets built until its spec
passes the quality gate in `UI_UX_PRINCIPLES.md`.

Order = build order.

---

# S1 · TODAY

**The screen the product is judged by.** Opened 1–3× daily, ~20 seconds.

**Purpose** — Answer *"can I spend, and is anything about to go wrong?"* without thought.
**User question** — "What can I spend today?"
**Primary action** — Add a transaction. Secondary: settle something that needs attention.

### Hierarchy

| | Element | Weight |
|---|---|---|
| 1st | **Room Left** — ₹290 | Hero, 44px, accent |
| 2nd | Allowance / spent today | 15px, beneath the hero, one line |
| 3rd | Anything that needs you | Amber card, only when non-empty |
| 4th | Next 3 commitments | 48px rows |
| 5th | Real Balance strip | Collapsed to one line; expands to the full chain |
| 6th | Where the extra went | Only when something is over its baseline |

```
Tuesday, 9 September                         28 Aug – 27 Sep · day 13 of 31

  ROOM LEFT TODAY
  ₹290                                       of ₹512 today · ₹222 spent
  ─────────────────────────────────────────────────────────────
  Real Balance ₹10,021        held 68,021 · reserved 42,000 · committed 16,000  ⌄

  NEEDS YOU
  ⚠ IDBI will be ₹6,882 short before Sunday's SIP        [Move money]
  ⚠ ZestMoney EMI — not yet confirmed with the bank      [Confirm] [Not yet]

  COMING UP
  Sun 13 Sep   SIP · Zerodha            ₹2,500   IDBI
  Tue 15 Sep   RD instalment            ₹1,000   IDBI
  ...                                                    See all 8 →
```

### Financial intelligence
- Room Left is forward-looking and commitment-aware — **the thing no competitor computes**
- The shortfall alert is per-account projection, not a total-balance view
- Real Balance strip teaches the three states of money every time it is glanced at

### Emotional outcome
> *"I know where I stand. Nothing is going to ambush me."*

Relief, not vigilance. When nothing needs attention the screen says **"Nothing needs you
today"** — an achievement, not a void.

### Retention value
The only place that answers the daily question. Missing a day means not knowing.

### Desktop / Mobile
**Desktop:** two columns — hero + Real Balance left, Needs You + Coming Up right. Left nav rail.
**Mobile:** single column, **hero fully above the fold on a 375×667 screen** (non-negotiable). Bottom nav; Add is the centre button.

### States
| | |
|---|---|
| **Loading** | Skeleton in the hero's exact dimensions. **Never a spinner there** |
| **Empty** (new user) | Serif: *"Your financial picture starts here."* + "Add your accounts so we can tell you what's actually yours to spend." + [Add an account] |
| **Unknown** | Hero becomes `—` with *"Room needs a number"*, the blocker named, and a link to fix it. Amber, not red — nothing failed |
| **Error** | Hero shows last-known with a timestamp: *"Showing your last saved position. We couldn't reach the server."* Never a blank screen |
| **Success** | Hero counts down 250ms. No toast |

---

# S2 · ADD  *(sheet, not a route)*

Used 2–6× daily. **Every second here is a withdrawal from the habit that keeps the product alive.**

**Purpose** — Record money in under 5 seconds.
**User question** — none. The user already knows; the product must not ask much.
**Primary action** — Save.

### Hierarchy
1. **Amount pad** — 64px digits, ₹ pre-filled, focused on open
2. Predicted category — one tap to accept
3. Account — pre-filled with last used for that category
4. Save — always thumb-reachable
5. Everything else (date, note, type) behind "More"

**Type is inferred, never asked first.** Choosing "Expense / Transfer / Investment" before
entering an amount is an accounting question, and this is not an accounting product.

### Financial intelligence
On save, Room Left **counts down visibly**. That is the entire behaviour-change mechanism:
spend ₹200 → watch the number fall → feel it. Nothing else in the product does this work.

### Emotional outcome
> *"That took no effort — and I saw what it cost me."*

### States
| | |
|---|---|
| **Loading** | None. Optimistic — the sheet closes immediately |
| **Error** | Sheet reopens with values intact and the field-level message. **Never lose what was typed** |
| **Success** | Sheet closes, hero counts down. No toast for routine saves |
| **Offline** | Saves locally, queues, shows a subtle "will sync" marker |

### Desktop / Mobile
**Desktop:** centred modal, keyboard-first, `⌘K` to open, Enter to save.
**Mobile:** full-height sheet, pad occupying the lower two-thirds.

---

# S3 · MONTH

The workspace. Weekly, 2–4 minutes. **This is where the product stops being a tracker.**

**Purpose** — Answer *"how is this cycle going, and what's left to do?"*
**Primary action** — Settle a commitment.

### Hierarchy
1. **Cycle header** — `28 Aug – 27 Sep · day 13 of 31` with a thin progress rule
2. **Net position** — in / out / saved, three numbers
3. **Commitments** — every instance, status, one tap to settle. *The heart of the screen*
4. **Flexible spending** — categories vs **your own baseline**, never vs an invented budget
5. **Close cycle** — appears in the last 3 days, as an invitation

### Financial intelligence
- Commitments show what is genuinely left, not a static list
- Flexible spending is measured against personal history: *"₹8,900 on drinks — your usual is ₹6,100"* — observation, not verdict
- A projected month-end position once ≥3 cycles of history exist

### Emotional outcome
> *"I'm on top of this month."* Command, not audit.

### Retention value
The weekly return. Also where the month-close ritual begins.

### Desktop / Mobile
**Desktop:** master-detail — commitment list left, selected detail right.
**Mobile:** stacked sections, commitments first, collapsible.

### States
**Empty:** *"This cycle is a blank page."* + "Add what leaves your account every month and the rest builds itself." + [Add a commitment]
**Unknown:** commitments with no amount sit in a distinct group — *"2 need a number"* — never mixed into the paid/pending list.

---

# S4 · MONEY

Weekly. Accounts, cards, debts, investments, net worth.

**Purpose** — Answer *"what do I have, what do I owe, what do I own?"*
**Primary action** — Correct a balance against the bank.

### Hierarchy
1. **Net worth** — hero, with the change since last cycle
2. **Accounts** — balance, available, reserved, and a **shortfall warning where projected**
3. **Cards** — outstanding, unbilled, due date
4. **Debts** — payoff timeline. *Emotionally the most important block on the screen*
5. **Investments** — invested vs value

### Financial intelligence
- Net worth in plain words on first view: *"everything you own minus everything you owe"*
- Debt shown as a **countdown, not a balance**: `₹58,000 repaid · debt-free Oct 2029`
- Per-account projection surfaced inline, not as a separate feature

### Emotional outcome
> *"It's moving in the right direction."*

For a user at 76% committed, **the debt countdown is the single most motivating element in
the product.** It gets the craft budget.

### States
**Unknown:** loans with no principal show `—` and *"Add the sanction figures and we can show your payoff date."* Net worth is labelled **approximate** while any component is unknown — never silently wrong.

---

# S5 · PLAN

Monthly. Goals, commitment rules, insights (Phase 2), history.

**Purpose** — Answer *"where am I heading, and is it realistic?"*
**Primary action** — Adjust a goal or a commitment.

### Hierarchy
1. **Goals** with honest feasibility
2. Commitment rules — the engine, editable
3. History — cycle over cycle
4. Insights *(Phase 2)*

### Financial intelligence
The difference between arithmetic and honesty:

> ~~"Save ₹8,316/month to reach ₹2,00,000 by April 2028."~~
> **"₹8,316 a month gets you there by April 2028. Your recent surplus averages ₹4,100 —
> at that rate it's July 2029. Want to move the date, or the target?"**

**Never presents a required contribution the user demonstrably cannot afford.** That is
the aspirational-spreadsheet failure this product exists to end.

### Emotional outcome
> *"I know what it actually takes."*

### States
**Empty:** *"A goal turns 'I should save' into 'I need ₹8,300 a month'."* + [Set a goal]

---

# S6 · MONTH CLOSE  *(the signature moment)*

Monthly, ~5 minutes. **The most important screen for retention and the most likely to be
remembered.** It gets the largest craft budget in the product.

**Purpose** — Close the cycle with understanding, not a report.
**User question** — "How did I actually do?"
**Primary action** — Close the cycle.

### Structure — a sequence, not a dashboard

```
1  Confirm      four balances, tap to confirm or correct
2  Resolve      anything unverified or unmatched
3  What happened
      Serif, editorial:
      "You kept ₹9,200 this month — your best cycle since May."
      in ₹57,700 · out ₹48,500 · saved ₹9,200
4  What moved
      Debt        −₹14,545      ↓ ₹58,000 since May
      Net worth   +₹9,200
      Emergency   ₹42,000 → ₹46,100   31% built
5  What changed
      "Drinks ₹8,900 — ₹2,800 above your usual, mostly in the last week."
      Observation. No verdict.
6  Next cycle
      "Electricity has averaged ₹2,850 over four cycles. Your plan says ₹2,500."
      [Use ₹2,850]  [Keep ₹2,500]
7  Close        snapshot written, permanently
```

### Financial intelligence
Baselines, cause explanation, and **plan correction from real history** — turning
aspirational numbers into realistic ones. This is the ADJUST step where behaviour changes.

### Emotional outcome
> *"I understand what happened, and next month will be easier."*

**Must end on something that moved the right way.** Even in a poor cycle, debt fell or a
goal advanced. This is the moment the user decides whether to keep paying.

### Craft notes
Full-width, one step at a time, generous space. **The only screen where the serif carries
a full sentence.** Should feel like closing a book — reflective, finite, quietly earned.
No confetti. The reward is the sentence, not an animation.

### States
**Loading:** each step resolves in sequence, not all at once — the pacing is part of the feeling.
**Insufficient history** (cycles 1–2): steps 5 and 6 are replaced by *"We'll start showing your normal after three cycles."* Honest, and it sets an expectation that brings them back.

---

# S7 · ONBOARDING

Once, ~15 minutes. **The riskiest screen in the product** — every step can lose the user.

**Purpose** — Reach a true Real Balance with the least work possible.

### Sequence
```
1  When are you paid?          → one question, defines everything
2  Where is your money?        → accounts + balances. "Approximate is fine"
   →  SHOW REAL BALANCE HERE, even though it is still wrong
3  What leaves every month?    → commitments. The heavy step
   →  Real Balance visibly corrects with each one added
4  Anything set aside?         → reservations
```

### The governing rule
**Value must arrive before the work does.** Real Balance appears the moment step 2 ends —
and every commitment added visibly *sharpens* it. The user is not filling a form; they
are watching a number become true.

**Escape hatches on every step.** "I'll add this later", always. A half-configured product
in use beats a perfect one abandoned at step 3.

Loans and cards are **not** in onboarding. Prompted afterwards, once the core number works.

### Emotional outcome
> *"Oh. That's what I actually have."*

The ₹39,000 → ₹8,000 moment. **If onboarding delivers nothing else, it must deliver this.**

---

## Build order

| # | Screen | Why here |
|---|---|---|
| 1 | Add | Nothing works without data |
| 2 | Today | The product's centre |
| 3 | Month | Where commitments live |
| 4 | Money | Accounts, cards, debt |
| 5 | Plan | Goals |
| 6 | Month Close | Needs a full cycle of data first |
| 7 | Onboarding | Build last — you cannot design the path in until you know the destination |

Onboarding last is deliberate: it is the hardest screen and impossible to get right before
the product it introduces exists.
