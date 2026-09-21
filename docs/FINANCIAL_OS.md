# The Financial OS

> **This document supersedes `design/PRODUCT_STRATEGY.md` and `product/STRATEGY_DEEP_DIVE.md`
> as the product's source of truth** (2026-09-20). Where any older document disagrees with
> this one, this one wins. See `DOC_INDEX.md` for what is still living and what is history.

---

## 1. What we are building

> **A system that holds your whole financial reality in one model, tells you what it means,
> shows what each choice costs, remembers what you decided, and helps you get back when you
> slip.**

The operating-system analogy earns its place in exactly one way, and it is the whole product:

**An OS arbitrates scarce resources between competing processes.**

The scarce resource is monthly cash flow. The competing processes are every EMI, every
subscription, family support, each goal, and daily life. Every other finance product
*enumerates* those claims on separate screens. None of them arbitrates between them. That is
the job.

### What we are not

Not an expense tracker, a budgeting app, a bill reminder, a loan tracker, a portfolio
tracker, a net-worth dashboard, or a chat window over a database. Those are components or
commodities. Several are traps (§6).

### What we will never become

- A product that earns from what it recommends. Every Indian PFM that failed was customer
  acquisition for lending; that incentive makes optimism profitable and truth expensive.
- A product that moves money on its own.
- A product that makes the user feel watched, judged, or gamified into compliance.
- A product that shows a number it cannot explain.

---

## 2. The product loop

Everything the system does belongs to one of seven steps. If a feature doesn't advance a
step, it is decoration.

| Step | Question | Engine |
|---|---|---|
| **State** | Where do I stand? | State engine |
| **Explanation** | Why am I here? | State engine (traceability) |
| **Attention** | What needs me *now*? | Attention engine |
| **Options** | What can I do? | Decision engine |
| **Consequence** | What does each choice cost? | Decision + Forecast |
| **Commitment** | What did I decide, and did I do it? | Commitment ledger |
| **Trajectory** | Is my financial life structurally improving? | Momentum |

The loop is deliberately ordered: **no recommendation may exist without a state it is
derived from, and no decision may be offered without its consequence.**

---

## 3. The engines

### 3.1 State engine
One canonical object describing the user's whole financial reality, derived at query time,
never stored (ADR-0011). Contract in `FINANCIAL_STATE.md`. Today's `PositionResult` is one
slice of it (this cycle's spendable cash) and becomes a component.

### 3.2 Attention engine *(exists, narrow)*
Decides what deserves the user's attention **and what does not**. Silence when healthy is a
feature, not an empty state. Must also speak when nothing is wrong ("nothing needs you; here
is what moved"). Evidence: reminders change behaviour only when they name a *specific* future
expense (Karlan et al., *Management Science* 2016) — so every attention item names the thing,
the date and the amount, never a generic nudge.

### 3.3 Reactive layer — the system must react the moment reality changes
**Requirement (2026-09-20):** the OS is an engine, not a report. Any write that changes
financial reality re-evaluates state and attention *immediately*, and surfaces a consequence
if a threshold is crossed. Recording a ₹12,000 expense must, in the same breath, say what it
just cost: which obligation is now at risk, which goal moved, how many days of room are left.

Triggers, in order of importance:
1. A transaction is recorded, edited or imported.
2. A commitment is settled, skipped, or its amount becomes known.
3. A balance is corrected, or a reservation changes.
4. A plan is changed (amount, date, new commitment, goal edited).
5. Time passes: a due date arrives, a cycle rolls, a loan reaches payoff.

What "react" means concretely: recompute state → re-run rules → if a *threshold crossing*
occurred (runway fell below one cycle, a mandatory obligation became uncoverable, a goal
became infeasible, an account is projected to go negative, a card's due date is inside the
danger window), say so at the point of the action, not on a dashboard the user may not open.

Time-based triggers need a scheduler; event-based triggers need only the existing write
paths. Build event-based first — it covers everything the user does, which is most of it.

### 3.4 Decision engine *(absent — the biggest gap)*
For a real financial situation: **Situation → Options → Consequences → Recommendation
factors → Commitment.** It never decides; it makes the trade-off legible. A decision is a
first-class record: what was chosen, when, what it was meant to achieve, and what actually
happened. Examples the product must answer:
- "Can I afford this ₹15,000 now?"
- "Prepay the 22% card EMI, or keep building the emergency fund?"
- "₹2,648/month frees in Feb 2027 — where should it go?"

### 3.5 Goal engine *(shallow — must arbitrate)*
Goals compete for one cash flow. A goal must know its funding source, its priority, whether
it is *feasible*, and what it costs the other goals. A goal that needs ₹15,182/month of money
that does not exist must say so — not draw a green bar.

### 3.6 Opportunity engine *(one rule)*
Detects what could improve the user's position, not only what's broken: an EMI ending, idle
cash, an unused subscription, a rate worth refinancing, a goal underfunded early enough to
fix cheaply. The freed-EMI unlock is the flagship: no consumer product ships it.

### 3.7 Momentum
Is the financial life structurally improving? Debt down, runway up, savings rate up,
obligations down, volatility down. Explicitly **not** a score: a small set of named
directions with the reason attached. Opaque scores are the thing users distrust.

---

## 4. Our differentiation, ranked

Validated against Monarch, Copilot, YNAB, Empower, Rocket Money, Simplifi, Origin, Cleo,
Jupiter, Fi, CRED, INDmoney, ET Money, Kuvera (research 2026-09-20).

1. **Salary-cycle obligation modelling.** Incumbents are calendar-month locked; changing that
   is a data-model rewrite for them. We already have it end to end.
2. **Freed cash-flow choreography.** Debt lifecycle → unlock date → redirect decision.
   Nobody ships it. Most emotionally powerful fact in a heavily-committed income.
3. **Plan vs actual with immutable history.** Incumbents won't build it because it makes
   users look worse. It is exactly what the commitment-device evidence says works.
4. **Competing-goal allocation** under one cash flow.
5. **Consequence preview before spending** (not after).
6. **Recovery after a broken month** — aimed at the documented cause of abandonment.
7. **No conflicted incentive.** We sell nothing. We can afford to tell the truth.

---

## 5. Behavioural design (what the evidence supports)

- **Commitment devices work.** SEED (Ashraf, Karlan & Yin, *QJE* 2006): a deliberately
  worse, illiquid savings product produced **+81% savings after one year**. Implication: the
  product's value is in helping people *bind themselves*, not in showing charts.
- **Specific reminders work; generic ones don't** (+3% goal attainment, +6% amount saved, and
  only when a specific future expense was made salient).
- **Abandonment is the base rate** (~70% of such apps abandoned within 100 days), and the
  documented causes are cleanup burden, "tells me what happened, not what to do", and
  graduation once awareness is achieved. Our answers: low upkeep, a decision layer, and
  usefulness that survives awareness (arbitration doesn't graduate).
- **Never**: shame, fear, streak-anxiety, dark patterns, roasting.

---

## 6. Traps (deliberately not building)

- Chat-with-your-money AI as a differentiator — table stakes since 2026 (Monarch, Cleo).
- Any opaque health score.
- SMS auto-capture — effectively policy-dead on Play Store.
- Gamification and roast tone.
- Subscription-cancellation as a hook (commodity; fee models have damaged trust).
- Monte Carlo retirement projection — free elsewhere, wrong horizon for the daily problem.
- Neobank/lending ambitions — this is what destroyed the Indian PFM category's honesty.

---

## 7. AI: strictly an interface

AI may **read** the state, **explain** it in the user's words, and **route** to a decision.

It must never: compute a financial figure itself, invent a number not present in the state,
decide on the user's behalf, or move money. Every AI answer cites the state values it used.
Sequencing: AI is Phase 6 — it is only as good as the state engine underneath, and shipping
it earlier would produce a confident liar.

---

## 8. North Star

> **Financial trajectory improvement per quarter** — a composite of debt-free date pulled
> forward, months of runway gained, and savings rate — with the operational metric being
> **commitments kept**: decisions the user made and then followed through.

Deliberately not engagement, sessions, or transactions recorded. A product that nags scores
badly on this; one that helps you act correctly and then leaves you alone scores well.

---

## 9. Principles

1. **Never be confidently wrong.** Say "I don't know" and why (ADR-0006).
2. **Truth over editable history.** Corrections are recorded, not overwritten.
3. **Arbitrate, don't enumerate.** Always relate claims to one cash flow.
4. **Every number explains itself** and can be traced to its source.
5. **Consequences before actions**, not after.
6. **Attention is scarce.** Silence when healthy.
7. **Guidance without control.** The system never moves money.
8. **The salary cycle is the unit of time.**
9. **Progress is structural** (debt down, runway up), never cosmetic.
10. **Recovery is designed for.** Slipping is expected; abandonment isn't.
11. **Derived, never stored** — one declared exception: the closed-cycle snapshot.
12. **Money is never counted twice.**

---

## 10. Decisions taken in this reassessment

| # | Decision | Reason | Consequence |
|---|---|---|---|
| D1 | The canonical unit of the product is **financial state**, not a screen or a module | Modules can't arbitrate; a state object can | One state engine; every surface reads from it |
| D2 | **Plans are versioned; history is immutable** | "Did I keep to my plan?" is unanswerable today, and it's the mechanic the evidence supports | Schema: plan revisions + change log; snapshots store planned *and* actual |
| D3 | **Debt truth comes from recorded payments**, not elapsed calendar periods | The freed-EMI differentiator rests on it; contradicts "truth from entries" everywhere else | Wire `loan_payments`; derive outstanding from payments |
| D4 | **Goals compete**; infeasibility must be stated | A goal needing money that doesn't exist showed "on track" | Goal engine reads cash flow; priority becomes functional |
| D5 | **Decisions are first-class records** | Otherwise advice evaporates and accountability is impossible | New `decision` entity + follow-through tracking |
| D6 | **The system reacts on write**, not on dashboard visit | An engine, not a report | Re-evaluate state + attention in the write path; threshold crossings surface at the point of action |
| D7 | **Protection (insurance) is a primitive** | Health insurance is currently modelled as a *loan* | New entity; feeds runway and risk |
| D8 | **AI is an interface over the state engine**, never a calculator | Prevents a confident liar | Phase 6, after state |
| D9 | **No monetisation that conflicts with advice** | The category's failure mode | Rules out lending/distribution revenue |

---

## 11. The test this product must pass

A 26-year-old salaried person with a salary, cards, EMIs, investments, insurance, expenses,
goals and upcoming large expenses opens the app. In order:

1. Can it explain their financial life in words they understand?
2. Can it say what deserves attention?
3. Can it show the consequence of a choice *before* they make it?
4. Can it help them act?
5. Does it remember what they committed to?
6. Can it help them recover after a bad month?
7. Can they see their financial future getting clearer?

Today the honest answers are: partly, partly, no, partly, no, no, partly. The roadmap exists
to turn all seven into yes.
