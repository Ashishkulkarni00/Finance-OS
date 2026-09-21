# Kosh — product strategy, UX and backend deep-dive
> **SUPERSEDED 2026-09-20.** The product's source of truth is now `docs/FINANCIAL_OS.md`
> (product), `docs/FINANCIAL_STATE.md` (model) and `docs/ROADMAP.md` (order of work).
> Keep this file as history; do not cite it as current truth. See `docs/DOC_INDEX.md`.


Written 2026-09-18 in answer to the brief "Product strategy + UX + backend deep-dive".
**Design only - nothing here is built.** Supersedes nothing silently: where it changes an
earlier doc it says so. Related: `design/PRODUCT_STRATEGY.md` (the ladder and the four
capabilities), `PRODUCT_DIFFERENTIATION.md`, `COMPETITIVE_ANALYSIS.md` (market research with
sources, Sept 2026), `INFORMATION_ARCHITECTURE.md`, `PRODUCT_AUDIT.md` (12 steps, 1-6 built),
`PLANNED_CHANGES.md` (built), `DISCIPLINE_AND_TRUST.md` (integrity design, parked by the
user until they return to it).

A note on research: §B was re-checked with fresh web research on 2026-09-18 (sources at the
end). It **corrected three claims** in the first draft of this document - forecasting,
decision previews and "money unlocking" all exist somewhere in the market already. The
direction survives, but the argument for it changed: see §B.2.

---

## 0. The answer first (§50)

> **If every chart, every generic tracker feature and every "AI" label were removed, what
> would still make Kosh worth using?**

**A forward-looking, commitment-aware picture of your money that you can trust:**
every rupee you've already promised - EMIs, card dues, rent, family support, SIPs, the
emergency-fund transfer, the insurance due in March - is accounted for *before* it leaves,
so the number you see is what is genuinely yours until the next salary; and the months
ahead are laid out the same way, including when money frees up (an EMI ending) and what a
decision would do to all of it.

Put simply: **"I know what's already spoken for, what's truly mine, and what's coming -
this month and the next twelve."** Everything in this document is judged against that.

It is a strong answer *for people with commitments* (EMIs, family obligations, SIPs, annual
premiums - most salaried Indians). It is a weak answer for someone with a salary, no debt
and few fixed costs; for them Kosh is a nicer tracker. We should build for the first group
and not pretend otherwise.

---

## A. Product diagnosis

### What Kosh is today
A salary-cycle money manager with an unusually honest core:
- **Real Balance / Room**: held − reserved − committed − owed on cards, per day until salary.
- **Commitments as dated obligations** (rule → monthly row) that follow loans, SIPs and goals,
  settle by the right kind of entry, remind when missed, and include expected income.
- **The month in one line** (comes in − committed − set aside = flexible) and "what's
  different this month".
- Double-entry ledger, card statements vs due cycles, loan current-position model with
  derived payoff, goals with pace.

### What is strong (keep and sharpen)
1. **Committed-before-it-leaves.** Simplifi and PocketGuard subtract bills roughly, on a
   calendar month; nobody does it per account, on a salary cycle, with EMIs, card dues and
   goal transfers each settled by the right entry. This is the product.
2. **Honesty engineering**: INCOMPLETE instead of guesses, derived values never stored,
   "never counted twice" enforced by double entry, "never judge the user".
3. **Obligation sources** (enter once: a loan's EMI, a SIP, a goal contribution).
4. **Salary-to-salary months** - matches how the user actually lives.

### What is weak
1. **The IA follows the database.** 8 menu items - Today, Ledger, Months, Accounts, Cards,
   Debts, Investments, Goals - one per entity. The 5-item IA agreed in
   `INFORMATION_ARCHITECTURE.md` was never applied. People don't come to "open Cards"; they
   come to answer "am I okay?" or "can I do this?".
2. **The future is invisible past this month.** Months shows one month at a time; there is
   no view of the next 3-12 months, no "₹6,646/month frees up in 2027", no annual
   obligations seen ahead. The strongest differentiators (trajectory, unlocks, decisions)
   don't exist yet.
3. **No decision support.** "Can I afford this?" / "what if I prepay?" has no answer
   anywhere (the audit's DECIDE capability, never built).
4. **Attention is scattered**: Needs you (Today), Needs you (Months), Needs a look
   (Accounts), Needs a look (Debts), goal-to-push card, plan prompts on Investments, primers
   on every page. Each screen invents its own warnings (audit step 7 exists to fix this).
5. **Effort**: manual entry of everything; import has a backend but no screen; no entry
   memory. Retention literature's #1 killer is categorisation fatigue.
6. **Integrity holes** (DISCIPLINE_AND_TRUST §0): a month can be edited into looking good.
7. **Too many words on screen.** Primers, guides, captions on every band. The Excel the
   user came from was "classier" because it was quieter.

### What is confusing
- "Free this cycle" vs "Room" vs "Real Balance" vs "Flexible" vs "Planned for this cycle" -
  five money figures on Months with overlapping meanings. A user can't say which is "the"
  number.
- Bills, commitments, plan items, obligations, instalments - one concept, five names.
- Cards/Debts overlap (card EMIs are loans billed to a card).

### What is generic (competitors already do it well; don't compete here)
Transaction list, categories, net worth, investment value tracking, charts.

### What has genuine potential
Future cash flow (unlocks, annual obligations, trajectory), decision consequences, recovery
without shame, month review that feeds the next plan - all built on the commitment model
that already exists.

---

## B. Competitive gap analysis (not a checkbox table)

### B.1 What the market actually offers (checked 2026-09-18)

| Product | What it's really for | Closest thing to our ideas | Where it stops |
|---|---|---|---|
| **Monarch** (US; $99.99, Plus $199) | Aggregation, net worth, household. The core plan projects cash flow a few months ahead from recurring bills; **Plus (Apr 2026) adds multi-year forecasting and what-if scenarios** ("buy a house in three years?"); an AI assistant with weekly recaps. | Forecasting, scenarios | Long-horizon net worth/retirement framing; calendar months; bank-sync dependent; no EMI or card-EMI model; US only. |
| **YNAB** (US) | A method: give every dollar a job. "True expenses" (annual ÷ 12 targets), **Loan Planner** (extra-payment what-if tied to the budget). | Reserve-ahead, debt what-if, behaviour change | High effort and learning curve; envelopes; users who don't adopt the method quit. |
| **Simplifi** (US) | **Spending Plan**: income − bills & subscriptions (annual premiums set aside too) − savings = left to spend, adjusting as you spend. | Closest to Real Balance | Calendar month; not per account; thin commitment model; no debt lifecycle. |
| **Copilot** (US, Apple) | Beautiful tracking; recurring detection; forecasts upcoming automatic payments and **alerts on shortfalls**. | Shortfall warnings | Reviewers: weak for big-picture plans (debt, goals); the Cash Flow tab looks backward. |
| **PocketGuard** (US) | "In My Pocket" safe-to-spend; debt payoff plan. | Safe-to-spend, debt plan | Shallow; upsell-driven. |
| **Debt apps** (Payoff, Debt Free, FinProjection) | Single purpose: payoff order, **a freed payment rolls into the next debt**, "cash freed once debt-free", month-by-month tables. | Money unlocking | Cut off from the rest of the month; manual; debt only. |
| **axio** (ex-Walnut, India) | SMS-based auto tracking and bill reminders - now an RBI-registered NBFC selling loans and BNPL. | Automation for India | Revenue grows when users borrow more. |
| **INDmoney** (India) | AA-based aggregation, net worth, investments; free card bill tracker. | Aggregation | Investment / lead-generation funnel; budgeting thin. |
| **Fi** (India) | Neobank with money insights - **banking shut down in 2026**; customers moved to Federal Bank's app. | - | The consumer-neobank-with-insights model failed economically. |
| **Money View, ET Money, Jupiter** | Lending or investing platforms with a tracker attached. | Tracking | Conflicted incentives. |

Retention context (secondary sources; treat as directional): finance apps reportedly lose
~71% of daily users between day 1 and day 30; a CFPB survey is cited for 67% of budgeting-app
triers rating them "not helpful" or "too much effort"; manual-entry apps reportedly churn ~3×
faster than auto-sync ones; apps built around recurring decisions and visible progress
retain better than dashboard-centric ones.

### B.2 What this means - honestly

- **No single idea in our direction is new.** Safe-to-spend (Simplifi, PocketGuard),
  reserve-ahead (YNAB true expenses, Simplifi), shortfall warnings (Copilot), what-if
  (Monarch Plus, YNAB Loan Planner) and freed cash after debt (debt apps) all exist.
- **What nobody does is combine them on one model of obligations, for the way a salaried
  Indian household actually runs**: salary on a fixed day, several EMIs (some billed to a
  card), SIP/RD, family support, annual premiums, festival spending - month to month, per
  account, with numbers that explain themselves.
- **In India the field is conflicted or retreating**: lenders and investment platforms with
  trackers attached, and the one insight-led neobank (Fi) shut its banking. An independent,
  subscription-funded tool that can say "take on less debt" has room.
- **The biggest threat to Kosh is effort, not competitors.** Manual entry is the category's
  #1 churn cause. Import / Account Aggregator can't wait for Phase 4 (see §H).
- **Copy risk**: Monarch could add salary cycles and EMIs but isn't building for India;
  Indian players could copy the maths but not the independence. The durable edge is the
  *combination + India fit + trust*, not any one screen.

### B.3 Crowded, table stakes, open

| | Areas |
|---|---|
| **Crowded - don't compete** | transaction tracking, categorisation, net-worth dashboards, investment value tracking, charts, AI chat |
| **Table stakes - must be good enough** | fast capture, import/auto-sync, recurring detection, bill reminders, goals |
| **Partly served, never combined - our ground** | committed-before-it-leaves free money per account; obligations-first month; debt-to-cash-flow unlocks; reserve-ahead; decisions previewed on *your* months and goals; recovery; numbers that explain themselves |
| **Open in India specifically** | EMI-heavy salary-cycle planning, card EMIs inside statements, SIP/RD as commitments, independent planning with nothing to sell |

**The poorly solved job:** *"Run my month and the next few months with every commitment
accounted for, show me what's truly free, warn me before trouble, and help me get back on
track - without me doing the maths, and without someone trying to sell me a loan."*

---

## C. USP strategy

### C.1 Candidates

| # | Direction | User problem | Why others don't solve it | Enabling capability | Hard to copy because | Backend foundation | Retention |
|---|---|---|---|---|---|---|---|
| 1 | **Committed-first money** ("what's truly mine") | Bank balance lies; money is already promised | They show balances or category budgets | Obligations as dated rows per account, settled by actuals | Needs a commitment model at the core, not a screen | Exists (rules, instances, position) | Daily glance at Room |
| 2 | **Money unlocking** | "When does this get easier?" | Only single-purpose debt apps show freed cash, cut off from the rest of the month | Loan schedules + obligation end dates → freed ₹/month by date | Needs loans + obligations joined to months | Loan model exists; needs forecast service | Monthly anticipation, milestone moments |
| 3 | **The months ahead** (12-month obligation calendar) | Annual premiums, festivals, EMIs ending surprise people | Monarch/Copilot forecast balances (Monarch Plus multi-year, US); none lays out obligations, unlocks and flexibility month by month for Indian lives | Forecast of rules, one-offs, loans, annual items; reserve-ahead | Needs the obligation model + honest assumptions | Needs forecast service + reserve-ahead | Planning sessions; fewer surprises |
| 4 | **Decision consequences** | "Can I afford this EMI / purchase / prepayment?" | Monarch Plus (long-horizon net worth) and YNAB Loan Planner (one loan) exist; none previews a decision on this month, the next 12 and every goal together | Scenario = temporary rules applied to the forecast | Needs forecast + obligations + goals together | Scenario evaluation over forecast (no persistence) | Used at every big decision - high trust moment |
| 5 | **Recover without shame** | "I blew the month - now what?" | "Over budget" red numbers | Drift detection, priced options, remembered choice | Needs locked plan + variance attribution | Plan lock, change log, recovery plan | Returns exactly when users usually quit |
| 6 | **Honest numbers** | "Can I trust this?" | Numbers without provenance; editable history | Provenance labels, calculation explanations, history kept | Cultural + architectural (derived, never stored) | Provenance + change log | Trust compounds |
| 7 | **Goal chains** | Goals feel isolated | Goals are progress bars | When a goal completes, its contribution flows to the next | Needs goals as funded obligations | GOAL-sourced rules exist; add "then" link | Long-horizon momentum |
| 8 | **Salary-cycle life** | Calendar months don't match paydays | Market standard is calendar months | Cycle model | Easy to copy in isolation | Exists | Supporting, not a USP alone |

### C.2 Recommended direction

**"The months ahead, with everything already promised accounted for."**

A single product direction built from candidates 1 + 2 + 3 + 4, with 5 and 6 as the trust
and behaviour layer:

1. **Now** - what's truly free until salary (exists; make it the unmistakable hero).
2. **Ahead** - the next 12 months as obligations, flexibility and unlocks (new, signature).
3. **Decide** - any change previewed against *your* months and goals before it's real (new).
4. **Recover** - when a month drifts, priced options, your choice remembered (new).
5. **Honest** - every number explains itself; history is kept (partly exists).

Why this and not "AI finance" or "all in one place": each piece exists somewhere, but only
as a separate product or a premium add-on on a calendar-month, bank-sync, US model. Kosh
already has the obligation model that lets all five sit on one set of numbers, and it fits
how Indian salaried households actually run. The combination, the India fit and the trust
are the moat - not any single screen (§B.2).

---

## D. Ideal information architecture

Built on what people come to do, not on entities.

| Nav | The question | Contains | Frequency |
|---|---|---|---|
| **Today** | "Am I okay? What needs me?" | Room + why, the 1-3 things that matter, next 7 days | daily |
| **Month** | "How is this month going?" | the month's shape, plan by date, what changed, review/close | weekly |
| **Ahead** | "Where am I heading? Can I do this?" | 12-month view, unlocks, annual obligations, goals, what-if | monthly / at decisions |
| **Money** | "What do I have and owe?" | tabs: Accounts · Cards · Loans · Investments; balance checks | weekly |
| **Activity** | "What happened?" | the ledger, import, search, corrections | as needed |
| **＋ Add** (action, not a page) | - | transaction (default), bill, income, one-off | several times a day |

Changes from today:
- **Goals move into Ahead** (goals are about the future, and connect to unlocks and what-if).
- **Cards, Debts, Investments become tabs of Money** (as `INFORMATION_ARCHITECTURE.md`
  already decided). Loan detail pages stay; they're reached from Money and from Ahead.
- **Ledger is renamed Activity** (plain word; "ledger" is accounting language). Optional -
  see §10 decisions.
- **Primers and guide sheets shrink** to one line + "How this works" per screen, then fade
  after first use.

Depth rule (from the IA doc): surface = exceptions and the answer; one level down =
completeness; two levels down = the evidence (entries, history, calculations).

---

## E. Ideal home experience (Today)

**The 30-second job:** "Am I okay until salary, and is there anything I must do?"

Hierarchy, strictly:

1. **Hero - "₹11,753 free until 28 Oct"** (Flexible remaining) with **₹540 a day** beneath.
   One tap → the derivation: in bank ₹X − still to pay ₹Y − set aside ₹Z − owed on cards ₹W
   = ₹N, each line tappable to its evidence. (Replaces the current competing Real
   Balance/Room/Free figures with one number and one explanation.)
2. **What matters now - at most 3 items**, ranked by the insight engine (urgency × rupee
   impact × consequence): "IDBI won't cover the 5 Oct EMIs - move ₹4,200", "Salary not seen
   yet - arrived?", "October is ₹2,100 off plan - see options". Each has one action.
3. **Next 7 days** - dated list of what leaves and arrives.
4. **One forward line** - e.g. "Next unlock: ₹2,648/month from Mar 2027 (Mobile EMI ends)" or
   goal progress. Quiet, not a card.

States:
- **Empty (new user)**: "Add your salary and what leaves every month - that's all this
  needs." One button.
- **Warning**: attention tone (amber), never red; phrased as fact + option.
- **Success**: "Nothing needs you. ₹540/day is yours." No confetti.
- **Incomplete**: "Electricity needs an estimate before this number is certain" - with the
  number shown as "at most".

Removed from Today: the separate goal card, the per-account cover detail by default (moves
into the "why"), duplicate warnings.

---

## F. Ideal month experience

**The 30-second job:** "Is this month holding, and what's left to happen?"

1. **Header**: month name, dates, day N of 31, "‹ Back to September".
2. **The month's shape** (exists): comes in − committed − set aside = flexible; spent so far
   and pace. After lock: **Planned · Now · Actual** columns (from the integrity design).
3. **Needs you** (≤3, from the engine) - only if something does.
4. **The plan, by date** (exists, default) - coming in on top, then each due date with its
   bills; paid ones stay visible, muted.
5. **What changed** - during the month: drift and its causes ("₹4,000 unplanned: car repair;
   dining ₹2,100 above your usual"). This is where **Recover** opens.
6. **Close & review** (after the month ends): the 60-second review (§J.11) that feeds the
   next month's plan.

Removed or demoted: the "Planned for this cycle" hero (a third money figure that confuses -
fold it into the shape line), the day-to-day spending section as a separate block (becomes
part of "What changed"), the primer.

---

## G. Core behavioural loop

```
Plan the month (salary day: "Start October" - mostly pre-filled from last month)
   ↓
Live: entries match the plan automatically; Today shows what's free
   ↓
Drift detected early → explained → priced options → user chooses (remembered)
   ↓
Month ends → 60-second review: what held, what drifted, why
   ↓
Next month's plan adjusts (one-offs, changes, a realistic flexible)
   ↓
Ahead shows the consequence: goal dates, unlocks, flexibility trend
   ↓
(back to Plan)
```

Retention comes from three genuine reasons to return: **daily** (can I spend?), **salary day**
(start the month; see progress), **decision moments** (can I afford this?). No streaks,
no points, no nagging.

---

## H. Feature roadmap

**Phase 1 - Core (make the core undeniable)**
1. One hero number with its derivation (Today/Month consolidation).
2. Insight engine with ≤3 items per surface (audit step 7) - replaces scattered warnings.
3. Navigation to 5 + Add (Money tabs; Goals into Ahead as a placeholder list until Phase 2).
4. Integrity P0 (plan lock, corrections with history) - *pending the parked D1-D8*.
5. Month review at close (read-only version first).
6. **Import screen (backend exists) + entry memory - effort reduction.** Raised in priority
   after the retention research (§B.1): manual entry is the category's #1 churn cause.

**Phase 2 - Differentiation** *(started 2026-09-19, one item at a time; status per item)*
1. ✅ **Ahead**: 12-month obligation forecast (rules, one-offs, loans, annual items, expected
   income) with assumptions labelled. Built as `GET /forecast` + `AheadForecast.tsx`.
2. ✅ **Money unlocking**: freed cash-flow calendar + "where should it go?" decision. Built
   as the `unlocks` field on each forecast month + `UnlockCalendar` inside `AheadForecast.tsx`
   (the "where should it go?" decision UI is not yet built - it currently only shows *that*
   and *when* money frees up, not a prompt to allocate it).
3. **Reserve ahead** for annual/large obligations ("₹2,500/month makes March comfortable") -
   *next; needs a schema decision (§I7), see CONTINUE_HERE.md*.
4. **Decision preview (what-if)** on the forecast; Adopt → planned changes.
5. **Get back on track** (drift → options → remembered choice).
6. **Month-end surplus suggestion** (user-requested 2026-09-18, added here retroactively - see
   §I and CONTINUE_HERE.md "Surplus suggestion" for the design): at month end/close, suggest
   moving genuinely spare money toward the top-priority goal, showing the date it moves. One-off,
   never automatic; reuses `CycleReview`/`CycleShape` + goal priority; no schema needed unless
   a custom buffer amount must persist.

**Phase 3 - Intelligence**
Baselines ("above your usual"), recurring detection → "add as bill", goal chains, emergency
cover & goal ETAs from contributions, momentum indicators (direction, not score), yearly
story.

**Phase 3.5 - Automation (brought forward from Phase 4)**
Account Aggregator (consented, RBI-regulated) or bank-statement parsing, so entries arrive
instead of being typed. Needs a compliance review; the Phase 1 import pipeline is where the
data lands.

**Phase 4 - Advanced OS** reminders by email/push built on insights, household/partner,
auth/billing/export (SaaS gate), tax-season summary.

---

## I. Backend / domain model changes

Principle: **the obligation model already is the event model.** Don't introduce a generic
"FinancialEvent" that duplicates `Commitment`/`CommitmentInstance`. Extend what exists.

| # | Change | Why | Entity / relationships | API | Persistence | Migration | Calculation impact |
|---|---|---|---|---|---|---|---|
| I1 | **Forecast service** | Ahead, unlocks, what-if, reserve-ahead all need "the next N months" | reads rules, one-offs, loans (schedule), expected income, goals | `GET /forecast?months=12` → per month: in, committed, set aside, flexible, unlocks, annual items | none (derived on read, ADR-0011) | none | new pure calculator; must share generation logic with `CommitmentInstanceGenerator` (no second rule engine) |
| I2 | **Scenario evaluation** | Decision preview | a scenario = list of hypothetical rule changes (add EMI, change amount, prepay, stop SIP) | `POST /scenarios/evaluate` → forecast diff + goal dates | **none** (never persisted); "Adopt" calls existing create/applyFrom APIs | none | forecast with overlays |
| I3 | **Insight engine** (audit step 7) | One ranked attention list | `insight` package, `FinancialContext`, rules | `GET /insights?surface=` | `insight_state` (dismiss/snooze) - deferred SQL | 1 table | read-time rules |
| I4 | **Plan lock + monthly state** | Plan vs actual, reviews, "September better than August because…" | `cycle_plans` (locked plan per cycle), extend `cycle_snapshots` with planned totals, `cycle_reviews` | `GET/POST /cycles/{id}/plan`, `/review` | 2-3 tables | backfill current cycle only | variance = actual − locked plan |
| I5 | **Change history** | Trust, corrections | `change_log` (entity, field, old, new, kind, reason, source) | `GET /history?entity=` | 1 table | none | none |
| I6 | **Balance & loan checkpoints** | Reconciliation with memory; loan statements over time | `balance_checkpoints`, `loan_checkpoints` | `POST /accounts/{id}/checkpoints` | 2 tables | migrate opening balances as checkpoint #1 (**real data - dump first**) | balance = last checkpoint + entries since |
| I7 | **Reserve ahead** | Annual obligations without surprise | reuse `Reservation`: `reservation.commitment_id` + monthly set-aside rule (a TRANSFER-to-self or virtual earmark) | extend reservations; "Reserve monthly" on annual bills | 1 column | none | Real Balance already subtracts reservations |
| I8 | **Goal chains** | One goal unlocks the next | `goals.then_goal_id` or "when reached, move contribution to" | goal PATCH | 1 column | none | forecast moves the contribution at the ETA |
| I9 | **Provenance on responses** | "How did you calculate this?" | enum on DTO fields (ACTUAL/PLANNED/FORECAST/CALCULATED/CONFIRMED/ESTIMATED/OVERRIDDEN/CORRECTED) + `explanation` objects for hero figures | `GET /position?explain=true` returns the derivation tree | none | none | none |
| I10 | **Household seam** | Future couples | keep `user_id`; add nothing now. When needed: `ledger_id`/`household_id` owning accounts, `user_id` as actor | - | - | future | ADR-0005 seam already in `CurrentUserProvider` |

Performance (§33): forecast = rules × months, cheap; cache per (user, month-of-change)
invalidated on any rule/transaction write; month snapshots avoid re-summing history; indexes
on `(user_id, date)` for transactions and `(user_id, cycle_id)` for instances already fit. No
background jobs needed at single-user scale; the insight engine runs per request with a
per-request `FinancialContext`.

**Model-level simplification:** one word for one concept in the UI. Proposal: **"payment"**
for outgoing plan items (bill/commitment), **"income"** for incoming, **"one-off"** for a
single month, **"goal"** for savings targets. Backend names stay.

---

## J. UX flows (short form; each is a screen-level sketch)

1. **Onboarding** (≤3 minutes to the first aha): pay day → take-home salary + account →
   main account balance → "What leaves every month?" as chips (Rent, EMI, Card, SIP,
   Family, Insurance, Subscriptions) each opening a 3-field form → **aha: "₹X is already
   promised; ₹Y is truly yours until the 28th"** → optional: loans (unlock dates), goals.
   Import offered at the end, never first.
2. **Creating a plan**: on salary day, "Start October" shows last month's plan with
   changes already applied (planned changes, EMIs ended, one-offs) → confirm → locked.
3. **Recording actuals**: ＋ Add (amount + description; memory fills the rest) → auto-matches
   a planned payment → toast "Paid: Electricity ₹1,790 (planned ₹1,790)".
4. **Correcting an actual**: "Correct amount" → previous value kept, month totals update,
   row shows "corrected".
5. **Adding a commitment**: from Month "+ Add payment"; if it's a loan/SIP/goal the form
   links it; shows the consequence line "Flexible this month: ₹11,753 → ₹9,753".
6. **Unexpected expense**: record it → if it breaks the month, Today shows "₹4,000 more than
   planned - see options" (flow 8).
7. **Going over plan**: drift card with cause and "See options".
8. **Recovering**: options priced (daily limit, skip optional, move savings to next month,
   use buffer, accept) → choose → Today shows the chosen path → reviewed at close.
9. **Debt payoff**: loan page → "What if I prepay ₹20,000?" → months and interest saved,
   unlock date moves → Adopt = plan a one-off prepayment.
10. **Goal creation**: name, target, date → "₹X/month gets you there by Y" (from forecast
    flexibility) → "Fund it monthly" creates the contribution → optional "then…" goal.
11. **Scenario simulation**: Ahead → "What if…" (new EMI / change payment / income change /
    purchase) → side-by-side months, goal dates, first tight month → Adopt or discard.
12. **Monthly review**: after close, 60 seconds: planned vs actual, what held, what drifted
    (with causes), what's coming next month, one optional note → feeds the next plan.
13. **Month rollover**: salary arrives → Today switches to the new month; the old month
    offers "Review September" once; unfinished items carry over as "from September".

---

## K. Magic moments (ranked)

| # | Moment | Value | Differentiation | Complexity | Retention | Why it ranks here |
|---|---|---|---|---|---|---|
| 1 | "₹39,000 in the bank, **₹8,000 is actually yours**" (first Room) | ★★★★★ | ★★★★ | low (built) | ★★★★★ | The founding insight; the reason to open daily. |
| 2 | "**₹13,400/month frees up by Dec 2027**" (unlock calendar) | ★★★★ | ★★★★ | medium | ★★★★ | Turns debt from dread into momentum; debt apps show it for debt alone - Kosh ties it to the month and to goals. |
| 3 | "IDBI won't cover the 5 Oct EMIs - move ₹4,200" (before it bounces) | ★★★★★ | ★★★★ | low (projection exists) | ★★★★ | Prevents a real cost (bounce fee, CIBIL). |
| 4 | "This new EMI makes **Feb and Mar tight** and moves your EF goal by 5 months" | ★★★★★ | ★★★★ | medium-high | ★★★ (episodic) | Highest-trust moment; Monarch Plus does long-horizon what-if, nobody does it on this month plus every goal. |
| 5 | "Insurance ₹18,000 in March - **₹3,000/month from now** makes it painless" | ★★★★ | ★★★★ | medium | ★★★ | Converts anxiety into a plan. |
| 6 | "October is ₹2,100 off plan - here are 3 ways back" | ★★★★ | ★★★★ | medium | ★★★★★ | Catches users at the moment they usually quit. |
| 7 | "September in 60 seconds: what held, what drifted, why" | ★★★ | ★★★ | medium | ★★★★ | Monthly reason to return; feeds the next plan. |
| 8 | Salary lands two days early and the app still puts it in the right month | ★★★ | ★★★ | built | ★★ | Quiet competence builds trust. |
| 9 | "When your emergency fund is full, ₹10,000/month moves to your wedding fund" | ★★★ | ★★★★ | low-medium | ★★★ | Goals feel like a path, not a list. |
| 10 | "Tap any number → how it's calculated, from which entries" | ★★★ | ★★★ | medium | ★★★ | Trust; rarely noticed until needed. |

Build order follows the table minus what's built: 3 (cheap, exists in parts) → 2 → 5 → 6 → 4 → 7.

---

## L. Product metrics

| Metric | Measures | Healthy sign |
|---|---|---|
| **Commitment coverage** | share of recurring outflows that exist as plan items (vs unplanned recurring spend detected) | ≥90% after month 2 |
| **Plan kept** | planned savings/investments actually made ÷ planned | stable or rising |
| **Surprise rate** | unplanned outflows > ₹X per month | falling |
| **Recovery rate** | months that drifted and ended within N% of plan after a recovery choice | rising |
| **Shortfalls avoided** | cover warnings acted on before the due date | high |
| **Forecast accuracy** | month-end flexible vs forecast at month start | error shrinking |
| **Monthly flexibility trend** | income − committed, month over month | rising (unlocks) |
| **Review completion** | months reviewed within 7 days of close | ≥70% |
| **Time to first aha** | onboarding start → first Room shown | < 3 minutes |
| **Unresolved items** | overdue unrecorded plan items at month end | near zero |

Engagement (DAU etc.) only as a sanity check - a finance app used less because the user is
calmer is a success.

---

## M. Final product thesis

> Kosh should exist because every other money app answers "what did I spend?", and the
> question people actually carry is "**what is genuinely mine, what's already promised, and
> what's coming?**" - this month and the months after. Answering that requires treating
> commitments (EMIs, card dues, family support, SIPs, premiums, goal contributions) as
> first-class, dated obligations that are accounted for before they leave, and keeping the
> numbers honest. Built on that, Kosh can show when money frees up, what a decision would
> do, and how to get back on track - calmly, without scores or shame. **For people with
> commitments, that is a real reason to exist; for people without them, it isn't, and we
> shouldn't chase them.**

---

## N. KEEP · CHANGE · REMOVE · ADD · DEFER

### KEEP
Commitment model (rule → monthly rows, sources, settle-by-type, one-offs, apply-from) ·
salary-cycle months · Real Balance maths · double-entry ledger · INCOMPLETE honesty ·
derived-never-stored · the month's shape line · plan by date · loan current-position model ·
card statement cycle · "What's different this month" · expected income.

### CHANGE
- **One hero number** on Today (flexible remaining + per day) with a tappable derivation;
  retire competing figures ("Planned for this cycle" hero, separate Real Balance/Free labels).
- **Navigation to 5 + Add**: Today · Month · Ahead · Money (tabs) · Activity.
- **All attention through one engine**, ≤3 items per surface.
- **Words**: one name per concept; primers collapse to one line and fade after first use.
- **Month close → Review** that feeds the next plan.
- **Goals** move under Ahead and gain contribution-based ETAs and "then…" chains.

### REMOVE / DO NOT BUILD
- **Financial health score (0-100)** - DO NOT BUILD. Collapses unlike things into a number
  that invites gaming and anxiety; show direction on named dimensions instead.
- **Streaks, badges, points, leaderboards** - DO NOT BUILD. Finances aren't a game; streaks
  punish a single bad week and push dishonest entry.
- **Generic "Ask AI" chat** - DO NOT BUILD. Intelligence belongs in explanations, detection
  and summaries on the screen where the question arises.
- **Category budgets** - DO NOT BUILD (already decided; flexible vs your own usual instead).
- **Envelope budgeting** - DO NOT BUILD. YNAB owns it; high effort is the opposite of our bet.
- **Net-worth charts as a hero** - demote. Net worth is a slow number; it belongs in Money.
- **Live market prices / stock tracking** - DO NOT BUILD. Investment apps do it; it creates
  daily anxiety with no decision attached. Keep dated value check-ins.
- **Marketplace / product recommendations (loans, cards, funds)** - DO NOT BUILD. Kills
  independence, the core trust advantage.
- **Bill payment / money movement** - DO NOT BUILD. Regulatory weight, no behavioural gain.
- **SMS scraping** - DEFER/likely don't: privacy cost, Android-only; AA is the better path.
- The separate **"Planned for this cycle" hero** on Months and the **goal card** on Today -
  remove (duplicate figures).
- **Per-page guide sheets** - shrink to "How this works" links; most content moves into
  point-of-use hints.

### ADD
Forecast service + Ahead (12 months) · money-unlock calendar · reserve-ahead for annual
obligations · decision preview (what-if with Adopt) · insight engine · get back on track ·
month review · import screen + entry memory · provenance & "how is this calculated" ·
goal chains.

### DEFER
Account Aggregator · household · email/push reminders · yearly story · baselines until 3
cycles exist · momentum indicators until reviews exist · SaaS gate.

---

## O. UX principles (the list to design against)

1. One primary question per screen, answered at the top.
2. Meaning before data; the answer before the evidence.
3. Consequences before complexity - show what changes, then how.
4. One hero number per screen, always explainable in one tap.
5. At most three things demand attention at once.
6. Calm over alarm: amber for attention, red only for money actually lost (a bounce, a fee).
7. Every forecast says it's a forecast and on what it's based.
8. Correct mistakes easily; never erase reality silently.
9. Propose, never decide: options with consequences; the user chooses.
10. Connect today's action to a future month when it matters.
11. Fewer, deeper concepts; one name per concept.
12. Every screen answers "so what?" - or it shouldn't exist.
13. Quiet by default; words appear at the point of decision, not as guides.

---


## Q. Feature prioritisation framework

Score 1-5 on each axis; **Complexity counts against**. Behavioural impact and trust are
weighted double - they are what this product is for.

| Feature | Value | Freq. | Behaviour ×2 | Differ. | Trust ×2 | Complexity (−) | Data needed | Retention | Money | **Verdict** |
|---|---|---|---|---|---|---|---|---|---|---|
| One hero number + "why" | 5 | 5 | 4 | 4 | 5 | 2 | exists | 5 | 3 | **MUST HAVE** |
| Insight engine (≤3 items) | 5 | 5 | 4 | 3 | 4 | 3 | exists | 5 | 3 | **MUST HAVE** |
| Import screen + entry memory | 5 | 5 | 2 | 1 | 3 | 3 | statements | 5 | 4 | **MUST HAVE** (churn) |
| Plan lock + corrections with history | 4 | 3 | 5 | 4 | 5 | 4 | exists | 3 | 3 | **MUST HAVE** (parked design) |
| Month review → next plan | 4 | 2 | 5 | 3 | 4 | 3 | lock + snapshot | 4 | 3 | **MUST HAVE** |
| Ahead: 12-month obligations | 5 | 3 | 4 | 4 | 4 | 3 | exists | 4 | 4 | **HIGH-VALUE DIFFERENTIATOR** |
| Money unlocking | 4 | 2 | 4 | 3 | 4 | 2 | loans exist | 4 | 3 | **HIGH-VALUE DIFFERENTIATOR** |
| Reserve ahead (annual items) | 4 | 2 | 5 | 2 | 4 | 2 | exists | 3 | 3 | **HIGH-VALUE DIFFERENTIATOR** |
| Decision preview (what-if) | 5 | 1 | 4 | 4 | 5 | 4 | forecast | 3 | 5 | **HIGH-VALUE DIFFERENTIATOR** (premium) |
| Get back on track | 4 | 2 | 5 | 4 | 4 | 4 | lock | 5 | 4 | **HIGH-VALUE DIFFERENTIATOR** |
| Goal chains | 3 | 1 | 3 | 3 | 3 | 2 | goals | 3 | 2 | **NICE TO HAVE** |
| Momentum indicators | 3 | 1 | 3 | 2 | 3 | 3 | reviews | 3 | 2 | **NICE TO HAVE** (Phase 3) |
| Yearly story | 3 | 1 | 3 | 2 | 3 | 3 | 12 snapshots | 3 | 3 | **NICE TO HAVE** |
| Household | 4 | 3 | 2 | 2 | 3 | 5 | auth | 4 | 5 | **DEFER** (Phase 4) |
| Account Aggregator | 5 | 5 | 1 | 1 | 3 | 5 | compliance | 5 | 4 | **Phase 3.5** |
| Health score 0-100 | 2 | 2 | 1 | 1 | 1 | 2 | - | 2 | 2 | **DO NOT BUILD** |
| Streaks / badges | 1 | 3 | 1 | 1 | 1 | 2 | - | 2 | 1 | **DO NOT BUILD** |
| AI chat box | 2 | 2 | 1 | 1 | 2 | 3 | - | 2 | 3 | **DO NOT BUILD** |
| Live market prices | 2 | 4 | 1 | 1 | 2 | 3 | feeds | 3 | 2 | **DO NOT BUILD** |

---

## R. "Available to spend" - the formula, and how it explains itself

Illustrative, using the user's October plan on salary day (after the ₹57,700 lands):

```
In spending accounts now (incl. salary received)           ₹67,197   (actual, per account)
− Still to pay this month (bills not yet paid)            −₹35,947   (planned)
− Set aside this month (EF, SIP, RD not yet moved)        −₹10,000   (planned)
− Owed on credit cards (statement + unbilled)                  −₹0   (actual)
− Reserved (earmarked money, incl. reserve-ahead)              −₹0   (user)
= Free until 27 Oct                                        ₹21,250
÷ 30 days left                                              ₹708/day

Before salary day, shown beneath, never added in:  + ₹57,700 expected on the 28th (forecast)
```

Rules:
- **Expected income is shown separately, never mixed silently.** Before salary day the hero
  says "₹X free until salary" (money in hand only) with "+₹57,700 expected on the 28th"
  beneath; after it lands, it's part of the actual line. (Today's Real Balance excludes
  expected income - keep that; the forecast line is an addition, clearly labelled.)
- Every line is tappable → its entries / bills / accounts.
- A figure with an unknown amount shows "at most" and names the bill.
- Per-account view on tap: "IDBI: ₹709, ₹17,290 leaves before the 10th → short ₹16,581
  unless you move money in."

---

## S. Guardrails - "can I afford this?"

A lightweight check, not a restriction. Entry points: Today ("Can I afford…?"), and the
Add sheet when an amount is large relative to Flexible.

| Result | Rule (explainable) | Wording |
|---|---|---|
| **Fits** | amount ≤ flexible remaining − the rest of this month's usual daily spending | "Fits: ₹X left for the rest of the month after it." |
| **Tight** | fits this month but leaves less than N days of your usual spending, or a later month in Ahead goes negative | "Fits, but leaves ₹X for 12 days (you usually spend ₹Y)." |
| **Doesn't fit** | exceeds flexible remaining | "₹X more than what's free until salary. Options: next month, from savings (EF cover drops to 1.2 months), or skip optional bills." |

No red. No "you shouldn't". For a new EMI, the check runs as a scenario (§I2) across 12
months: "Makes Feb and Mar tight; EF goal moves 5 months later."

---

## T. Future obligations and reserve-ahead

- **What counts**: annual/quarterly bills (insurance, school fees, vehicle insurance, club
  memberships), festivals (Diwali), known one-offs (a wedding, travel), tax payments.
- **Ahead** lists them by month with "₹X/month from now makes this comfortable" =
  amount ÷ months remaining (shown as a suggestion).
- **"Reserve monthly"** (one tap) creates a monthly set-aside tied to that obligation
  (reservation linked to the bill, §I7). The reservation reduces Free, so the money is
  *already* spoken for when March comes; paying the bill releases it.
- Not unique (YNAB true expenses, Simplifi) - but here it's on the same numbers as
  everything else, and it covers Indian specifics (Diwali, annual premiums, school terms).

---

## U. Debt as a first-class object

**Already built:** lender, account, outstanding, as-of, EMIs left, next EMI, EMI, day,
rate, tenure, principal, dates, paid via bank/card, pay-from, payoff date, still to pay,
outstanding today, terms consistency, estimator, plan bill that follows the loan,
prepayment planning.

**Missing, in order of value:**
1. **Interest remaining** and **interest share of the next EMI** (needs a rate; else
   INCOMPLETE "needs a rate").
2. **Unlock date and amount** per loan, and the household **unlock calendar**.
3. **Prepayment what-if**: months and interest saved for ₹X once, or ₹Y/month extra
   (YNAB-style, but tied to the month and goals); Adopt plans the one-off.
4. **Costliest first**: order by rate; note when a prepayment beats investing (rate vs a
   stated expected return - labelled as an assumption).
5. **Foreclosure value** (lender-specific; user-entered checkpoint, never guessed).
6. **Loan checkpoints** (statements over time) - the integrity design M6.
7. **Refinancing** - DEFER (needs lender data; low frequency).

---

## V. Trajectory - honest projection

- **Horizons**: 3 / 6 / 12 months in Ahead (obligation-level detail); 24-60 months only as
  a coarse line (debt-free date, goal dates, monthly flexibility) - longer horizons
  compound assumptions.
- **Every figure carries its kind**: Actual (past), Planned (rules), Forecast (derived from
  rules + loans), Assumption (income stays ₹57,700; spending at your usual), Scenario
  (what-if overlays). Assumptions are listed on the screen and editable only as scenario
  inputs.
- **Confidence**: months beyond known obligations say "assumes your usual spending of ₹X
  (median of 3 months)"; with fewer than 3 closed months, "assumes flexible is spent in full".
- **Never**: point predictions of market returns, "you'll be a crorepati by…".

---

## W. Financial health - decision

**Do not build a score.** Build a **Standing** line (from `design/PRODUCT_STRATEGY.md` §3.4)
with named dimensions, shown only once there's enough data (3 closed months):

| Dimension | Basis |
|---|---|
| Liquidity | spendable + EF ÷ monthly must-pay (months covered) |
| Commitment load | committed ÷ income |
| Debt pressure | EMIs ÷ income; high-rate debt outstanding |
| Savings consistency | planned savings actually made, last 3 months |
| Readiness | future obligations with reserve-ahead in place |

Show three phrases, not numbers-as-grades: **strongest area**, **biggest vulnerability**,
**improving**. If after testing it reads as a verdict or invites gaming, remove it -
nothing else depends on it.

---

## X. Personal financial memory

Kosh already stores intent next to facts: a bill's **Why** and **If skipped**, loan notes,
goal names. Extend carefully:

| Kind | Example | Stored as | Shown as |
|---|---|---|---|
| Fact | ₹40,000 moved to HDFC Premium on 3 Nov | transaction | the record |
| User note | "Top-up from Diwali bonus" | note on the plan item / transaction | quote, in the user's words |
| Decision | "Stopped RD from Nov to raise EF contribution" | plan revision reason (integrity M3) | "You decided on 18 Sep: …" |
| Assumption | salary stays ₹57,700 | forecast input | labelled "assumption" |
| System interpretation | "Dining ₹2,100 above your usual" | computed, never stored | labelled "Kosh noticed" |

Rule: the system never writes into the user's notes and never presents its interpretation
as the user's reason.

---

## Y. Where AI (or any inference) belongs

| Job | Where it appears | Method | Label |
|---|---|---|---|
| **Explain** "why is this month different?" | Month → What changed | rules over variance (no LLM needed) | "Kosh noticed" |
| **Detect** trends, recurring, anomalies | insights | statistics over history | "Looks like…" + confirm |
| **Forecast** goal/debt dates | Ahead | deterministic projection | "Forecast, assumes…" |
| **Consequences** of a decision | what-if | deterministic | "If you…" |
| **Summarise** a month in 60 seconds | Review | templated from computed facts; an LLM may *phrase* it, never compute it | - |
| **Suggest** categories/accounts | Add | description memory | chip, never auto-applied below high confidence |

**Rule:** numbers are always computed deterministically; language models, if used at all,
only phrase facts the system already computed. No free-form "ask anything" box.

---

## Z. Automation - observed, inferred, confirmed

Every automated item has one of three states, visible:

| State | Meaning | Example | Counts in figures? |
|---|---|---|---|
| **Observed** | came from a source (import, AA, match) | ₹6,145 debit on 5 Oct | yes, as actual |
| **Inferred** | Kosh guessed | "₹649 to Spotify 4 months running - a subscription?" | **no** until confirmed |
| **Confirmed** | the user accepted | Spotify added as a bill | yes |

Automations worth building, in order: bill matching (built) → recurring detection → entry
memory → import de-duplication (built backend) → month-end summary → forecast refresh on
every write (derived, so automatic) → goal contribution suggestions.

---

## AA. Notifications philosophy

Inside the app, the insight engine ranks everything. **Outside** the app (Phase 4 channels),
only what would cost money or a deadline:

| Level | Examples | Channel | Timing | Limit |
|---|---|---|---|---|
| **Critical** | account won't cover a payment in ≤3 days; card bill due in ≤2 days unpaid; salary not seen 2 days after pay day | push/email (opt-in) | once, morning | ≤1/day |
| **Important** | month drifting > N%; annual obligation within 30 days without a reserve | in-app card; weekly digest | when detected | ≤3 visible |
| **Insight** | above your usual; recurring detected; unlock next month | in-app only | on open | ≤3 visible |
| **Milestone** | EMI ended, ₹X/month freed; EF reached 3 months; goal reached | in-app; optional digest | on the day | as they happen |

Suppression: one item per key; snooze/dismiss (deferred SQL table); no repeats within 7
days; nothing at night; batching into one morning digest; the user can turn any level off.
**Never**: urgency language for non-urgent things, "you're missing out", daily "check your
spending" nudges.

---

## AB. India-specific opportunities

| Area | What to do | Not |
|---|---|---|
| Salary cycles | already the backbone | - |
| EMIs incl. **card EMIs / no-cost EMI** | first-class; card EMIs inside the statement (built); unlock calendar | - |
| UPI | fast capture is the main entry path; later, UPI SMS/AA import | a UPI payment app |
| Credit cards | statement vs due cycle (built), utilisation, interest-free window | card recommendations |
| SIP / RD / FD / PPF / EPF / NPS | commitments + dated value check-ins; EPF/NPS as "locked" holdings | fund recommendations, live NAVs |
| Insurance premiums | annual obligations with reserve-ahead | selling insurance |
| Festivals (Diwali), weddings | one-offs + reserve-ahead; bonus planning (built one-offs) | - |
| Family support | a first-class commitment category ("support at home") | judgement |
| Tax | quarterly advance tax / year-end tax as obligations; a year summary of 80C/80D items (Phase 4 report) | tax filing |
| Account Aggregator | Phase 3.5 import path | aggregation as the product |

---

## AC. Convenience - the work Kosh removes

Ranked by cognitive load removed: (1) "how much can I actually spend?" (2) "is there enough
in *that* account for the EMI?" (3) remembering due dates (4) annual expenses sneaking up
(5) "what happens after this loan ends?" (6) reconciling plan vs actual at month end
(7) "can I afford this?" (8) typing every expense (import). Every feature on the roadmap
maps to one of these; anything that maps to none is suspect.

---

## AD. Yearly story (Phase 3)

From month snapshots and reviews (no re-summing raw history): income change; monthly
flexibility change (the headline); debt reduced and ₹/month unlocked; EF months covered;
savings consistency; goals progressed; the user's own notes on major decisions and
recoveries. One scrolling page, in the user's words where they gave them. Needs I4 (month
state) first.

---

## AE. Household (future) - architecture now, feature later

Today every row carries `user_id` (ADR-0005). When couples arrive:
- Introduce a **ledger/household** that owns accounts, rules and goals; `user_id` becomes
  the actor (who recorded it) plus membership.
- Per-account visibility (mine / shared / partner's), contribution ratios on shared bills.
- Cost now: nothing, as long as new tables keep the `user_id` scoping pattern and no code
  assumes "one user = one money world" beyond `CurrentUserProvider`. Don't build it early.

---

## AF. Performance and scale

| Load | Approach |
|---|---|
| 10 accounts, 10 years of entries | balances derive from checkpoints + entries since (M5), not all history; index `(user_id, account, date)` |
| 100 recurring items × 12-month forecast | ~1,200 cheap rows per request; compute on read; cache per user, invalidated on write |
| Insights | one `FinancialContext` per request; rules read it, never query |
| Month history | closed-month snapshots (I4) so reviews and the yearly story don't re-sum raw data |
| Background jobs | none needed at single-user scale; Phase 4 digests use a scheduled job |

Avoid: event sourcing, CQRS, projection tables - premature at this scale.

---

## P. Decisions needed (when the user is ready)

| # | Decision | Recommendation |
|---|---|---|
| S1 | Adopt the direction "the months ahead, with everything promised accounted for"? | Yes. |
| S2 | Navigation: Today · Month · Ahead · Money · Activity + Add? | Yes; Ledger → Activity is optional. |
| S3 | One hero number on Today = flexible remaining until salary (per day beneath)? | Yes; retire competing labels. |
| S4 | Phase 1 contents and order (§H) | Insight engine → hero consolidation → nav → review → import; integrity P0 when D1-D8 are taken. |
| S5 | Build the forecast service as the backbone of Phase 2? | Yes - Ahead, unlocks, reserve-ahead and what-if all sit on it. |
| S6 | Confirm the DO-NOT-BUILD list (§N) | Yes. |
| S7 | Name for the future tab: "Ahead" / "Future" / "Plan" | "Ahead" - short, forward, not confused with the month's plan. |
| S8 | Bring automation forward: import screen in Phase 1, Account Aggregator / statement parsing in Phase 3.5 (was Phase 4)? | Yes - the retention research makes manual entry the biggest risk to the whole thesis (§B.1-B.2). |
| S9 | Accept §B.2's positioning: no single feature is unique; the combination, India fit and independence are the edge? | Yes - and stop claiming individual features as firsts in other docs (`PRODUCT_DIFFERENTIATION.md` needs this correction). |

---

## Sources (research on 2026-09-18)

- [Forecasting in Monarch - Monarch Help](https://help.monarch.com/hc/en-us/articles/48344305092244-Forecasting-in-Monarch)
- [Monarch Money Review 2026 - The Penny Hoarder](https://www.thepennyhoarder.com/budgeting/monarch-money-review/)
- [Monarch Money Review 2026 - WalletGrower](https://walletgrower.com/blog/monarch-money-review-2026)
- [YNAB Loan Planner](https://www.ynab.com/blog/ynab-loan-planner)
- [How to Use Targets in YNAB](https://support.ynab.com/en_us/how-to-use-targets-rk5kkI9ks)
- [Understanding your Spending Plan - Quicken Simplifi](https://support.simplifi.quicken.com/en/articles/4212702-understanding-your-spending-plan)
- [Copilot Money Review 2026 - WalletGrower](https://walletgrower.com/blog/copilot-money-review-2026)
- [Cash Flow Tab Overview - Copilot Help](https://help.copilot.money/en/articles/9682232-cash-flow-tab-overview)
- [Payoff: Smart Debt Planner - Google Play](https://play.google.com/store/apps/details?id=com.payoffplanner.app&hl=en-US)
- [FinProjection](https://finprojection.com/)
- [India neobank Fi winds down banking services - Yahoo Finance / TechCrunch](https://finance.yahoo.com/news/india-neobank-fi-winds-down-221744130.html)
- [axio: Income & Expense Tracker - Google Play](https://play.google.com/store/apps/details?id=com.daamitt.walnut.app&hl=en_IN)
- [INDmoney credit card bill tracker](https://www.indmoney.com/features/track-credit-card-bills)
- [Why 67% of people who try budgeting apps quit within 30 days - Strategia-X](https://www.strategia-x.com/blog/2026-04-12-why-budgeting-apps-fail-30-days-fintech-ux-data/)
- [Why personal finance apps fail at user retention - Product Growth](https://www.productgrowth.blog/p/personal-finance-app-user-retention)
- Earlier research with its own sources: `COMPETITIVE_ANALYSIS.md`.
