# Product Vision

**Working name:** Kosh *(कोश — treasury. Provisional; see OPEN_QUESTIONS.md Q1)*
**Status:** Phase 0 — Discovery
**Last updated:** 08 Sep 2026

---

## 1. The one-sentence thesis

> Most money apps tell you what happened. **Kosh tells you what you can do.**

A personal financial operating system that turns a bank balance — a number that lies —
into a number you can act on, and then helps you make the next decision well.

---

## 2. The problem, stated precisely

An ordinary salaried person opens their banking app and sees **₹32,000**.

That number is technically true and practically useless. It does not know that:

- ₹8,000 is an emergency fund they promised themselves not to touch
- ₹6,375 is a credit-card bill due on the 10th
- ₹5,000 is an EMI that will auto-debit on the 5th
- ₹2,500 is a SIP on the 13th
- ₹10,000 goes home to family
- their salary is 20 days away

Their real position is **₹8,000, not ₹32,000**. They will discover this on the 25th,
by running out.

Every category of existing product fails this person in a different way:

| Product type | What it gives them | What it misses |
|---|---|---|
| Banking app | A balance | Everything that is already spoken for |
| Expense tracker | A record of the past | Anything forward-looking |
| Budgeting app (YNAB, Monarch, Copilot) | A calendar-month plan | Their salary cycle, their EMIs, their card cycle |
| Indian neobank apps (Jupiter, Fi, axio) | Aggregation + a thin budgeting layer | Independence — the business model is lending |
| A spreadsheet | Truth, if maintained perfectly | Everything else |

---

## 3. Where this comes from

This product did not begin as a market opportunity. It began as a working Excel
system, built over three days in September 2026 for one real person with a real
₹57,700 salary, three loans, a credit card, a SIP, an RD and family obligations.

That workbook works. It computes a number nobody else computes — *what is genuinely
free to spend today* — and it does so honestly, refusing to display a figure when the
underlying data is incomplete.

It also nearly broke six times in its first three days of real use. Every one of those
failures is a product requirement. See `EXCEL_GAPS_AND_PRODUCT_OPPORTUNITIES.md`.

**We are not porting a spreadsheet. We are productising a proven mental model and
removing the fragility that makes spreadsheets fail.**

---

## 4. What we are building

A product organised around **one number, one loop, and one promise.**

### The number — Real Balance

```
Everything you hold
  − money you have reserved (emergency fund, sinking funds)
  − commitments you have made but not yet paid
  = REAL BALANCE
      ÷ days until you are paid again
  = ROOM TODAY
```

Every screen in the product exists to make that number correct, understood, or better.

### The loop — the salary cycle

```
PLAN → LIVE → REVIEW → REFLECT → ADJUST → GROW
```

Anchored to **the user's salary date**, not the calendar month. If you are paid on the
28th, your financial month runs the 28th to the 27th. This sounds small. It is the
single most-requested thing spreadsheet users build by hand and no mainstream product
offers.

### The promise — honest gaps

The product will say **"I don't know"** rather than show a plausible wrong number.
If a mandatory commitment has no amount, Room Today reads *Needs a number* — not a
falsely cheerful figure. Trust in a financial product is built almost entirely on
never being confidently wrong.

---

## 5. The ladder

The product should carry a user up a ladder, one rung at a time, without ever
requiring them to know which rung they are on.

| Level | The user can say | We deliver this in |
|---|---|---|
| 1 Record | "I spent ₹2,000" | MVP |
| 2 Organise | "₹2,000 went on dining" | MVP |
| 3 Understand | "Dining is 14% of my flexible spending" | MVP |
| 4 Compare | "That's 22% above my three-month normal" | Phase 2 |
| 5 Explain | "Because of six transactions in week three" | Phase 2 |
| 6 See consequences | "At this rate I save ₹3,500 less this month" | Phase 2 |
| 7 Decide | "Continue, cut back, or move money from elsewhere" | Phase 2 |
| 8 Learn | "Dining always rises in the last week" | Phase 3 |
| 9 Improve | "Set next month's dining allowance to what's realistic" | Phase 3 |

**Most products stop at level 3 and add charts.** Levels 6 and 7 are the product.

---

## 6. What success looks like

Not *"how many transactions were entered."*

**North star:** the share of active users whose **savings rate, debt trajectory, or
emergency-fund coverage has measurably improved** after six months of use.

Supporting signals:

| Signal | Why it matters |
|---|---|
| Month-close completion rate | The reflect step is where behaviour changes |
| Days from install to first correct Real Balance | Time-to-truth is our activation metric |
| Return rate in the last 5 days of a cycle | The moment money runs out is our moment of value |
| Decisions run through the impact preview | Proof we moved from recording to deciding |
| Share of users whose committed-to-income ratio falls | The clearest evidence of financial maturity |

---

## 7. Explicit non-goals

We are **not** building:

- A neobank, a lending product, or a funnel to either
- A trading or portfolio-performance app
- A tax-filing tool
- A zero-based envelope budgeting system *(YNAB owns that, does it better, and it
  demands more discipline than our target user will sustain)*
- A beautiful dashboard whose insights do not change a decision
- A product that shames the user for spending money

---

## 8. The line we will not cross

The user's financial data is the most sensitive data they own. We will never sell it,
never use it to broker credit or insurance, and never let a monetisation incentive
distort what the product tells them.

**Our incentive must stay aligned with the user's financial health.** This is why the
business model is subscription and not commission — see `BUSINESS_MODEL.md`. Every
Indian competitor in this space monetises through lending, which means their product
gets more valuable to them when the user borrows more. Ours gets more valuable when
the user borrows less.

That is not marketing. It is the reason this product can exist.
