# Kosh — product strategy, UX and backend deep-dive

Written 2026-09-18 in answer to the brief "Product strategy + UX + backend deep-dive".
**Design only - nothing here is built.** Supersedes nothing silently: where it changes an
earlier doc it says so. Related: `design/PRODUCT_STRATEGY.md` (the ladder and the four
capabilities), `PRODUCT_DIFFERENTIATION.md`, `COMPETITIVE_ANALYSIS.md` (market research with
sources, Sept 2026), `INFORMATION_ARCHITECTURE.md`, `PRODUCT_AUDIT.md` (12 steps, 1-6 built),
`PLANNED_CHANGES.md` (built), `DISCIPLINE_AND_TRUST.md` (integrity design, parked by the
user until they return to it).

A note on research: the market picture below uses `COMPETITIVE_ANALYSIS.md` (researched this
month, sources listed there) plus product knowledge up to mid-2026. No fresh browsing was
done for this document; claims about competitors are about their *model*, which changes slowly,
not their latest feature list.

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
1. **Committed-before-it-leaves.** Nobody else in the market subtracts obligations before
   they're paid, per account, on a salary cycle. This is the product.
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

| Area | State of the market | Implication for Kosh |
|---|---|---|
| **Tracking + categorisation** | Crowded, commoditised (Monarch, Copilot, axio SMS, AA-linked neobanks). Automation wins. | Table stakes. Reduce friction (import, memory); never lead with it. |
| **Budgeting methods** | YNAB owns "give every rupee a job" (envelopes: powerful, high effort, steep learning). Others do category budgets that people abandon. | Don't copy envelopes or category budgets. Our budget is *obligations first, flexible is what's left* - lower effort, same honesty. |
| **Safe-to-spend** | Simplifi ("Spending Plan"), PocketGuard ("In My Pocket") compute it roughly: income − bills − savings on a calendar month, not per account, not salary-cycle, weak commitment model. | We're ahead on correctness; they're one decision from copying the *number*. The moat is the obligation model underneath + trust, not the formula. |
| **Debt** | Loan payoff calculators exist everywhere; almost no app connects a loan to monthly cash flow or to what happens when it ends. Indian apps are lenders - conflicted. | **Open.** "Money unlocking" is ours to take. |
| **Future / forecasting** | Monarch/Copilot show recurring + balance forecast; Empower forecasts retirement. Nobody shows a household's next 12 months of *obligations and flexibility* with explicit assumptions. | **Open.** Signature territory. |
| **Decisions** | "What-if" exists as generic calculators (loan EMI calculators, SIP calculators) disconnected from the user's actual month. | **Open.** Consequences on *your* months and goals. |
| **Behaviour change** | YNAB changes behaviour through method + effort; the rest inform. Reviews in the market: "built to show what happened, not to decide what happens next". | **Open** for a calm plan→live→review→recover loop without envelope effort. |
| **India specifics** | EMI-heavy lives, card EMIs, SIP/RD, annual premiums, festival spending, salary on fixed days - served by lenders/investment apps with a tracker attached. | Independent, subscription-funded, can honestly say "take on less debt". |
| **Trust** | Aggregators monetise via lending/advice. Few apps explain their numbers. | "How did you calculate this?" on every figure; history kept. |

**The poorly solved job:** *"Help me run my month and the next few months with all my
commitments accounted for, show me what's truly free, warn me before I get into trouble,
and help me get back on track when I do - without me doing the maths."*

---

## C. USP strategy

### C.1 Candidates

| # | Direction | User problem | Why others don't solve it | Enabling capability | Hard to copy because | Backend foundation | Retention |
|---|---|---|---|---|---|---|---|
| 1 | **Committed-first money** ("what's truly mine") | Bank balance lies; money is already promised | They show balances or category budgets | Obligations as dated rows per account, settled by actuals | Needs a commitment model at the core, not a screen | Exists (rules, instances, position) | Daily glance at Room |
| 2 | **Money unlocking** | "When does this get easier?" | Loans treated as expenses; no cash-flow future | Loan schedules + obligation end dates → freed ₹/month by date | Needs loans + obligations joined to months | Loan model exists; needs forecast service | Monthly anticipation, milestone moments |
| 3 | **The months ahead** (12-month obligation calendar) | Annual premiums, festivals, EMIs ending surprise people | Forecasts are balance lines, not obligations | Forecast of rules, one-offs, loans, annual items; reserve-ahead | Needs the obligation model + honest assumptions | Needs forecast service + reserve-ahead | Planning sessions; fewer surprises |
| 4 | **Decision consequences** | "Can I afford this EMI / purchase / prepayment?" | Generic calculators ignore your month | Scenario = temporary rules applied to the forecast | Needs forecast + obligations + goals together | Scenario evaluation over forecast (no persistence) | Used at every big decision - high trust moment |
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

Why this and not "AI finance" or "all in one place": each piece depends on the obligation
model Kosh already has and competitors don't; together they answer questions people
otherwise answer in a spreadsheet or not at all.

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
6. Import screen (backend exists) + entry memory - effort reduction.

**Phase 2 - Differentiation**
1. **Ahead**: 12-month obligation forecast (rules, one-offs, loans, annual items, expected
   income) with assumptions labelled.
2. **Money unlocking**: freed cash-flow calendar + "where should it go?" decision.
3. **Reserve ahead** for annual/large obligations ("₹2,500/month makes March comfortable").
4. **Decision preview (what-if)** on the forecast; Adopt → planned changes.
5. **Get back on track** (drift → options → remembered choice).

**Phase 3 - Intelligence**
Baselines ("above your usual"), recurring detection → "add as bill", goal chains, emergency
cover & goal ETAs from contributions, momentum indicators (direction, not score), yearly
story.

**Phase 4 - Advanced OS**
Account Aggregator import, reminders by email/push built on insights, household/partner,
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
| 2 | "**₹13,400/month frees up by Dec 2027**" (unlock calendar) | ★★★★ | ★★★★★ | medium | ★★★★ | Turns debt from dread into momentum; nobody shows it. |
| 3 | "IDBI won't cover the 5 Oct EMIs - move ₹4,200" (before it bounces) | ★★★★★ | ★★★★ | low (projection exists) | ★★★★ | Prevents a real cost (bounce fee, CIBIL). |
| 4 | "This new EMI makes **Feb and Mar tight** and moves your EF goal by 5 months" | ★★★★★ | ★★★★★ | medium-high | ★★★ (episodic) | Highest-trust moment; decisions are where money is won or lost. |
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
