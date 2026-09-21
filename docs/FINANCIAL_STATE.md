# Financial State — the canonical model

Companion to `FINANCIAL_OS.md` (the product) and `product/DOMAIN_MODEL.md` (entity-level
detail, now partly stale — this document wins where they disagree). Written 2026-09-20.

---

## 1. The idea

Today the closest thing to a "financial state" is `PositionResult`: **one cycle's spendable
cash**. Debt, investments, goals, protection and net worth are separate reads with nothing
relating them. A Financial OS needs one object that spans all of it, so that every engine —
attention, decision, goal, opportunity, momentum — reasons over the same picture.

**`FinancialState` is derived on every read, never stored** (ADR-0011). It is a composition
of existing calculators plus the missing ones, not a new source of truth.

---

## 2. Shape of `FinancialState`

```
FinancialState
├── asOf, cycle {start, end, daysToSalary, elapsed}
├── completeness  { COMPLETE | INCOMPLETE, blockers[] }      ← ADR-0006, already exists
│
├── LIQUIDITY
│   ├── held, reserved, committed, realBalance, room          ← PositionResult today
│   ├── available per account, card dues
│   └── runway  { months of essential spend covered by liquid assets }   ← MISSING
│
├── FLOW (this cycle, and trailing 3/6/12)
│   ├── incomeExpected / received
│   ├── committed, setAside, flexible, spent                  ← CycleShape today
│   ├── savingsRate, investmentRate                           ← partly (CycleSummary)
│   └── baseline  { usual flexible spend, from own history }  ← MISSING
│
├── OBLIGATIONS
│   ├── thisCycle[]  (occurrences with status, attention tier) ← strong today
│   ├── next12Months[] (forecast months)                       ← ForecastMonth today
│   └── annual/irregular[]                                     ← partial
│
├── DEBT
│   ├── perLoan { outstanding, rate, emi, remainingTenure, payoffDate }
│   ├── totals  { debt, monthlyEmiBurden, emiShareOfIncome, weightedAvgRate }  ← partial
│   ├── unlocks[] { date, amount, source }                      ← ForecastUnlock today
│   └── debtFreeDate                                            ← MISSING
│
├── ASSETS { accounts, investments, liquidTotal, netWorth }     ← exists
│
├── PROTECTION { policies, cover, premiums, renewals, gaps }    ← MISSING ENTIRELY
│
├── GOALS
│   ├── perGoal { target, saved, spent, schedule, requiredPerMonth, feasibility }
│   └── contention { totalRequiredPerMonth vs availableForGoals }  ← MISSING
│
├── TRAJECTORY
│   ├── momentum { debt↓, runway↑, savingsRate↑, obligations↓ }  ← MISSING
│   └── milestones[] { debt-free, goal dates, unlocks }          ← MISSING (timeline is short-horizon)
│
└── ATTENTION { items[] ranked }                                 ← InsightService today
```

Each branch must carry **provenance**: which inputs produced it, so any figure can answer
"why is this number what it is?" (Principle 4). The `blockers` pattern already does this for
Real Balance — generalise it.

---

## 3. Derived vs stored

**Derived today (keep):** Real Balance/Room (`PositionServiceImpl`), cycle shape/standing/
review/plan-progress (`CommitmentInstanceServiceImpl`), forecast (`ForecastServiceImpl`),
goal schedule (`GoalServiceImpl`), insights (`InsightService`), timeline
(`TimelineServiceImpl`), account projection (`ProjectionServiceImpl`), balances/net worth/
cash position (`AccountBalanceCalculator`, `AccountAvailableCalculator`), amortisation
(`AmortisationCalculator`), investment summary, card statements/due dates.

**Stored inputs (legitimate):** transactions + postings, commitments (rules), per-occurrence
expected/confirmed amounts, account opening balances (ADR-0009), stated investment values,
reservations, goals, loan terms, the closed-cycle snapshot (declared exception).

**Hybrids to fix:** `Loan.outstandingBalance` + `balanceAsOf` rolled forward by *elapsed
calendar periods* (D3 — should come from recorded payments).

---

## 4. Missing primitives

| Primitive | Why it must exist | Notes |
|---|---|---|
| **Protection / Insurance** | Health insurance is currently modelled as a **loan account**. Cover, premium, renewal date and gaps drive runway and risk | New entity; premiums become obligations; renewals become timeline events |
| **Plan revision** | Editing a commitment silently clones the rule; no record of what changed or why | `plan_revision` + change log; snapshot gains planned totals |
| **Decision** | Advice with no memory is not accountability | `decision { situation, options, chosen, expectedEffect, madeAt, followedThrough }` |
| **Commitment (promise)** | Distinct from a *bill*: "I will put ₹5,000 into the emergency fund this month" | Feeds recovery + momentum + North Star |
| **Allocation** | Where free cash is *intended* to go, when several goals compete | Makes goal contention resolvable |
| **Runway** | The single most legible safety metric ("X months if income stopped") | Derived: liquid assets ÷ essential monthly spend |
| **Baseline** | "Is this month unusual?" needs the user's own history, not a budget | Derived from trailing cycles; needed before any "you're overspending" claim |
| **Loan payment (wire up)** | Table and entity exist, unused | Link EMI transaction → period; outstanding from truth |

---

## 5. Meaning of a transaction

A transaction is currently: type, amount, account(s), category, optional plan link. For a
Financial OS it must also resolve:

- **Planned or unplanned?** (plan link exists; absence is meaningful)
- **Essential or discretionary?** (category group is a proxy; insufficient)
- **Recurring or one-off?** (detectable from the ledger; not detected today)
- **What it just cost**: effect on room, on the nearest at-risk obligation, on a goal's date.

That last line is the reactive requirement (`FINANCIAL_OS.md` §3.3): the effect is computed
**at write time** and returned with the write, so the UI can say it immediately.

---

## 6. State transitions worth modelling

- **Cycle**: planning → running → ended → closed (snapshot). Exists.
- **Obligation occurrence**: pending → (due/overdue) → settled | skipped | unverified. Exists.
- **Goal**: funding → at risk → infeasible → reached | abandoned. Partly.
- **Loan**: active → prepaid/refinanced → closed → *unlock released*. The unlock is an
  **event**, not just a date: it should create an attention item and a decision.
- **Decision**: proposed → committed → kept | missed | revised. Missing.
- **Plan**: current → revised (with reason) → superseded. Missing.

---

## 7. Thresholds the engine watches

These are the crossings that make the system speak (§3.3 of `FINANCIAL_OS.md`). Each needs a
defined rule, an owner engine and a wording:

| Threshold | Meaning |
|---|---|
| Runway < 1 cycle | Liquidity emergency |
| Mandatory obligation uncoverable before salary | Hard shortfall |
| Projected account balance < 0 before a due date | Account-level shortfall (exists) |
| Card due within N days and cash insufficient | Interest risk (exists) |
| Goal becomes infeasible given cash flow | Plan is fiction |
| Flexible spend > own baseline by X% with Y days left | Pace warning, never a budget |
| Unlock within 60 days | Opportunity to redirect |
| Debt rate > expected return on a funded goal | Allocation is costing money |
| Plan changed in a way that moves a goal's date | Consequence disclosure |

---

## 8. Sequencing note

Nothing in this document requires a rewrite. `FinancialState` is a **composition** over the
engines that already exist plus four new ones (runway, baseline, protection, momentum). The
expensive parts are the *new primitives* (§4), which need migrations — see `ROADMAP.md`
Phase 0.
