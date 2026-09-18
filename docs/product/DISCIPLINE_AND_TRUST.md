# Discipline, behavioural finance and the trust layer

Status: **design, 2026-09-17. Nothing here is built.** Written from the user's brief
"Financial Operating System — Discipline, Behavioral Finance & Trust Layer". Decisions
needed before building are in §10.

> **Never punish reality. Never hide reality. Help the user improve reality.**
> Flexible enough to correct reality, disciplined enough not to rewrite it.

Reading order: §0 (the problem in this codebase) → §2 (truth model) → §4 (discipline loop)
→ §8 (build plan) → §10 (decisions).

---

## 0. What the audit found (the short version)

Kosh already separates several truths: rule vs monthly row (`Commitment` / `CommitmentInstance`),
`expected` vs `confirmed` amount, paid rows that never change, derived balances (ADR-0011),
`INCOMPLETE` instead of guesses (ADR-0006), soft delete (ADR-0004), an immutable
`CycleSnapshot` at month close. That's a strong base.

Where it still lets a month be "made to look good":

| # | Hole | Why it matters |
|---|---|---|
| H1 | **Editing a bill's amount applies to this month's unpaid row** (`reconcileWithRule`). | Commit ₹10,000 to the emergency fund, move ₹6,000, lower the bill to ₹6,000 → the month shows "all paid". The miss disappears. |
| H2 | **`PATCH /commitment-instances/{id}` lowers a row's expected amount** before settling it. | Same effect for a single month, no trace. |
| H3 | **Deleting or archiving a bill removes this month's unpaid row.** | A missed commitment vanishes instead of showing as missed. |
| H4 | **Nothing freezes the plan.** There is no record of what the month was planned to be when it began. | Plan vs actual can't be reconstructed later; the snapshot at close stores actual totals only. |
| H5 | **Transactions in a closed month can be edited or deleted** (no cycle check in `TransactionServiceImpl`). | The closed snapshot and the Ledger silently disagree; history can be rewritten. |
| H6 | **"Update balance" re-bases the account's opening anchor** (`openingBalance/openingAsOf` overwritten). | The unexplained gap between Kosh and the bank is absorbed with no record - the one number that says "something wasn't recorded". |
| H7 | **Goal target and date are overwritten** (`PATCH /goals`). | A goal that's behind can be "fixed" by lowering the target; pace then reads on track. |
| H8 | **Loan outstanding / EMIs left are overwritten** (V13 re-base). | Corrections are legitimate, but there is no trail and no "calculated vs yours" distinction on the figure itself. |
| H9 | **No change history anywhere** (only `created_at`/`updated_at`/`version`). | Corrections can't be explained ("why did September change?"). |
| H10 | **Calculated and entered values look identical** except in the loan form. | Users can't tell a fact from a derivation from an estimate. |

None of these are bugs in the normal sense: every edit was built to fix a real annoyance.
The fix is not "lock everything" - it's to give each field the right kind of edit.

---

## 1. Deliverable 1 — Editability audit

Edit types used below (§3 defines them):
**F** free · **P** plan change (confirm) · **PC** plan change with context (from which month) ·
**C** correction, history kept · **D** derived (override only, labelled) · **I** immutable after a point.

### Ledger (transactions)

| Screen | Field | Current behaviour | Financial meaning | Should edit? | Edit type | Audit | Recommendation |
|---|---|---|---|---|---|---|---|
| Ledger / Add | description, note, merchant | PATCH, instant | label | yes | F | no | keep |
| Ledger | category | PATCH, instant | classification of an actual | yes | F (C if month closed) | if closed | re-classifying a closed month changes its category history: allow, record |
| Ledger | amount | PATCH overwrites | **actual fact** | yes | **C** | **yes** | "Correct amount" - keep previous value, when, optional reason; show "corrected" on the row |
| Ledger | date | PATCH overwrites | actual fact | yes | C | yes | as amount; moving across a cycle boundary says which month it leaves |
| Ledger | type / accounts | PATCH overwrites | actual fact (changes counting) | yes | C | yes | as amount; re-runs matching |
| Ledger | delete | soft delete, any month | removes an actual | yes | C ("Remove - it didn't happen") | yes | reason required when the month is closed |
| Ledger | any field, **closed month** | allowed silently | history | yes | **C + flagged** | yes | allowed, but the month shows "1 correction since close" beside its snapshot (H5) |

### Months (plan)

| Screen | Field | Current behaviour | Financial meaning | Should edit? | Edit type | Audit | Recommendation |
|---|---|---|---|---|---|---|---|
| Add bill | all fields | create | intention | yes | P | created-when | once the month has started, a new bill is flagged "added mid-month" (unplanned) |
| Edit bill | name, why, if-skipped, category | PATCH | label | yes | F | no | keep |
| Edit bill | amount, day, account, paid as | PATCH, applies to this month's unpaid row (H1) | **commitment** | yes | **PC** | **yes** | default "from next month"; "this month too" = plan revision with reason, shown as "revised mid-month (was ₹10,000)" |
| Edit bill | starts / last payment | PATCH | commitment window | yes | PC | yes | ending a bill in a month that has begun keeps that month's row |
| Edit bill | follows (link) | PATCH | model structure | yes | F | yes | keep |
| Delete / archive bill | whole rule | removes this month's unpaid row (H3) | abandons a commitment | yes | PC | yes | "Stop after <month>" is the action; the current month's row stays and can be skipped/missed |
| Plan row | Estimate (variable bill amount) | PATCH expected | **forecast** | yes | F (forecast) | light | forecast changes are free; the *planned* figure (frozen at month start) stays |
| Plan row | expected amount of a fixed bill (H2) | PATCH expected | pretends the plan was different | **no** as a plan edit | → PC | yes | becomes "revise this month's plan" with reason, or is a forecast only |
| Plan row | Settle / link | links an actual | actual | yes | C (unlink = correction) | yes | keep; partial payments stay partial |
| Plan row | Skip (optional) | status SKIPPED | decision | yes | P | yes | record as a decision (optional reason); mandatory can't be skipped - it can be *missed* |
| Plan row | Confirm (unverified) | status | confirmation | yes | F | yes | keep |
| Salary | expected amount | rule edit | forecast | yes | F | light | expected income is a forecast; actual replaces it |
| Month close | close | writes snapshot | finalises history | yes | **I** | yes | snapshot must also freeze plan totals (H4) |

### Accounts / Cards

| Screen | Field | Current behaviour | Meaning | Should edit? | Type | Audit | Recommendation |
|---|---|---|---|---|---|---|---|
| Accounts | name, institution, last four, purpose | PATCH | label | yes | F | no | keep |
| Accounts | spending money?, minimum balance | PATCH | policy | yes | P | yes | affects Free; confirm |
| Accounts | **Update balance** (opening balance + as-of) | overwrites anchor (H6) | **externally confirmed fact** | yes | **C (reconciliation)** | **yes** | becomes a *reconciliation checkpoint*: stated balance, Kosh's figure, difference; the difference is shown ("₹1,240 not accounted for - add it as an entry?"), never silently absorbed |
| Accounts | opening balance (creation) | PATCH | starting fact | yes, until first checkpoint | C | yes | after a checkpoint exists, edit via a new checkpoint |
| Cards | limit, statement day, due day | PATCH | terms | yes | P | light | keep |
| Cards | statement total / minimum | record, delete | external fact | yes | C | yes | correction keeps previous |
| Debit cards | all | CRUD | label | yes | F | no | keep |

### Debts

| Field | Current | Meaning | Type | Audit | Recommendation |
|---|---|---|---|---|---|
| lender, note | PATCH | label | F | no | keep |
| outstanding, as-of, EMIs left | overwrite (H8) | confirmed fact at a date | **C (checkpoint)** | yes | a loan statement is a checkpoint (like balances); history of checkpoints kept |
| EMI, EMI day, paid via, paid from | PATCH | terms (plan) | PC | yes | change from a month |
| rate, tenure, principal, dates | PATCH | background facts | C | yes | keep "Use these / Keep mine" |
| payoff date, still to pay, implied EMIs, outstanding today, interest | derived | **D** | - | label "calculated from …"; override only as "confirmed by lender" (becomes a checkpoint) |

### Investments / Goals / Settings

| Field | Current | Meaning | Type | Audit | Recommendation |
|---|---|---|---|---|---|
| holding name, type, liquid | PATCH | label/policy | F | no | keep |
| monthly amount, day, pay-from | PATCH (bill follows) | commitment | PC | yes | change from a month |
| value check-in | POST value | external fact at a date | C (append-only) | yes | already append-like; keep history visible |
| goal name, priority | PATCH | label | F | no | keep |
| **goal target / date** | overwrite (H7) | **commitment** | **PC** | **yes** | "Adjust target" with reason; progress also shown against the original ("target raised from ₹2L to ₹2.5L in Nov") |
| goal link | PATCH | structure | P | yes | keep |
| goal pace / ETA / required per month | derived | D | - | label as calculated |
| pay day (cycle start) | PATCH | structure | P, rare | yes | changing it re-cuts months: warn strongly; closed months keep their dates |
| categories rename/merge | PATCH | label | F | light | keep (history refers by id) |

---

## 2. Deliverable 2 — Financial truth model

Seven kinds of number. Every figure the API returns is one of these, and the UI marks it.

| Kind | Meaning | Who sets it | Can change? | Example |
|---|---|---|---|---|
| **Actual** | what happened | user entry / import | corrected, with history | a ₹4,500 expense |
| **Planned** | what the month was set to be when it began | frozen from the plan at month start | never (a revision is a new record) | "EF ₹10,000 planned for October" |
| **Commitment** | a standing decision | user, via a rule | changes apply *from* a month; history kept | "₹10,000 a month to the EF" |
| **Forecast** | current expectation | system or user estimate | freely | electricity "about ₹1,790", salary expected |
| **Calculated** | derived by the system | system | not editable; override only | payoff date, Free, goal ETA |
| **Confirmed** | checked against an outside source | user (bank app, statement) | new checkpoint, old kept | "HDFC was ₹8,788 on 27 Sep" |
| **Estimated** | can't be known exactly | system or user | freely, labelled | variable bill before the bill arrives |

Plus two *states* of a value: **Overridden** (a calculated figure replaced by the user, labelled)
and **Corrected** (an actual whose earlier value is kept).

### 2.1 Model changes

| Change | What | Why |
|---|---|---|
| M1 `cycle_plans` | one row per cycle when it **locks** (the first read on/after its start day, or "Start October" by the user): planned income, committed, set aside, flexible, bill count; `locked_at` | H4 - "what I said I would do" for the month |
| M2 `commitment_instances.planned_amount` + `added_after_lock` | the row's amount at lock; `expected_amount` becomes the forecast; rows created after lock are flagged unplanned | H1/H2 - variance = actual − planned, not actual − whatever it was edited to |
| M3 `plan_revisions` | cycle, instance/rule, field, from, to, reason, at | "revised mid-month" is visible and reviewable, not forbidden |
| M4 `change_log` | entity, id, field, old, new, kind (CORRECTION / PLAN_CHANGE / OVERRIDE / CHECKPOINT), reason, source (user/import/system), at | H9 - explainability. Stored data, not application logs, so ADR-0010's "never log amounts" is untouched; it is user-scoped like every table |
| M5 `balance_checkpoints` | account, as-of, stated balance, computed balance, difference, source | H6 - replaces overwriting the opening anchor; balance = last checkpoint + entries since (ADR-0011 still holds: the checkpoint is a fact, the balance is derived) |
| M6 `loan_checkpoints` | loan, as-of, outstanding, EMIs left, source | H8 - same idea for loans; the loan's "where it stands" becomes the latest checkpoint |
| M7 `goal_revisions` | goal, field, from, to, reason, at | H7 |
| M8 `recovery_plans` | cycle, option, parameters (e.g. daily cap), created_at, outcome at close | §5 - remembers the decision |
| M9 `cycle_reviews` | cycle, the user's one-line reflection, chosen next-month adjustments | §4 month-end reflection |
| M10 `cycle_snapshots` + planned totals + `corrections_since_close` (derived) | extend the close snapshot | plan vs actual survives forever |
| M11 `insight_state` | (already deferred) dismiss/snooze | §5 reminders |
| M12 `Provenance` in API responses | `ACTUAL · PLANNED · FORECAST · CALCULATED · CONFIRMED · ESTIMATED · OVERRIDDEN · CORRECTED` on the fields that matter | H10 |

Rules that stay: derived values are never stored (M1 stores the *plan as it was*, which is a
fact, not a derivation); soft delete; `user_id` everywhere; money as strings.

**Conflict with the 2026-09-17 "no SQL until the end" rule:** M1-M10 are schema. See §10 D1.

### 2.2 API shape (sketch)

- `GET /cycles/{id}/plan` → the locked plan (or "not locked yet: this is the draft").
- `POST /cycles/{id}/lock` → "Start October" (idempotent; auto on first read after start).
- `PATCH /commitments/{id}` gains `scope: FROM_NEXT_MONTH | THIS_MONTH_TOO` (+ `reason` for the latter once locked); `applyFrom` stays for later months.
- `POST /transactions/{id}/correct` (amount/date/type + reason) alongside PATCH for labels.
- `POST /accounts/{id}/checkpoints`, `POST /loans/{id}/checkpoints`.
- `GET /cycles/{id}/drift` (§5), `POST /cycles/{id}/recovery-plan`.
- `GET /cycles/{id}/review`, `POST /cycles/{id}/review`.
- `GET /momentum` (§4.4), `GET /cash-flow/releases`, `POST /scenarios/evaluate` (read-only what-if).
- `GET /history?entity=…` for "what changed" views.

---

## 3. The editability policy

| Class | Examples | Interaction |
|---|---|---|
| **1 Free** | names, notes, descriptions, categories (open month), labels, forecasts/estimates | instant save |
| **2 Plan change (confirm)** | future bill, future goal date, account policy | one confirm line: "This changes your plan from November." |
| **3 Plan change in context** | a commitment's amount/day/account, a goal target, a holding's instalment | the sheet asks *when*: "From next month" (default) / "This month too - it's already started" → reason field, recorded as a revision |
| **4 Correction, history kept** | transaction amount/date/type, deleting an entry, statement totals | "Correct amount" - easy, previous value kept and shown on request ("corrected on 3 Oct, was ₹5,000") |
| **5 Derived** | Free, Room, payoff date, interest, ETA, pace, variance | not an input; "Calculated from …" on tap; override only where a real-world source exists ("Lender says 14 EMIs left") → becomes a checkpoint |
| **6 Fixed history** | locked plan, closed-month snapshot, recorded checkpoints, past revisions | never overwritten; corrected by adding a newer record |

Language, used everywhere: **Correct** (an actual was wrong) · **Change plan** (a decision) ·
**Override** (a calculation) · **Adjust target** (a goal) · **Check balance** (a checkpoint) ·
**Stop after** (end a commitment) · **Skip this month** (optional bills only).

Low friction for corrections; intentional friction only where a commitment or history changes
meaning. No confirmation dialogs on labels, ever.

---

## 4. Deliverable 4 — The discipline system

The loop: **Commit → Track → Compare → Explain → Recover → Choose → Remember → Review → Progress.**

### 4.1 Commit - "Start the month"
- On salary day (or when first opened in the new month) Months shows the plan and one
  action: **Start October**. It locks the plan (M1). Nothing is asked that was already set up.
- Before lock, the plan is a draft: edit freely. After lock, edits are revisions (class 3).
- The locked plan is what every comparison uses.

### 4.2 Track - automatic
- Already: auto-matching, expected income, bill sources, reminders. Import (audit step 10)
  and entry memory (step 9) reduce effort further.

### 4.3 Compare and explain - variance with causes
- Variance per line = actual − planned; per month = planned flexible − (spent + unplanned).
- Attribution (explain, don't judge): unplanned bills (added after lock), categories above
  the user's own usual (after 3 cycles; before that, against the plan only), mid-month plan
  revisions, missed/partial commitments, income different from expected.
- Wording rule: "₹2,100 more on dining than your usual", never "you overspent".

### 4.4 Progress - momentum, not a score
Direction indicators, each with its basis, month over month:

| Indicator | Basis | Good direction |
|---|---|---|
| Emergency cover | EF balance ÷ monthly must-pay | up |
| High-interest debt | outstanding on loans/cards above N% | down |
| Savings rate | (set aside actually moved + invested) ÷ income received | up |
| Fixed obligations share | committed ÷ income | down |
| Commitments kept | planned savings/investments actually made ÷ planned | steady/up |
| Goal dates | ETA at current contribution vs last month | earlier |
| Risks funded | annual bills with money reserved ahead | up |

Shown as "Moving forward on 4 of 6" with each line explained, never a composite 0-100.

### 4.5 Remember and review
- Month close gains a **Review** step (M9): planned vs actual (from M1 + snapshot), what
  changed (attribution), what worked (commitments kept), what's next (next month's known
  changes: planned-changes list, annual bills, EMI endings), and one optional sentence
  "Anything to remember?" shown again at next month's start.
- Recovery plans (M8) are evaluated here: "You chose a ₹620/day limit; you averaged ₹540."

### 4.6 Trajectory
- Current position → projection → goals, using rules, one-offs, loan schedules and goals.
- What-if (read-only until adopted): "+₹3,000/month to EF", "this EMI ends", "SIP +₹1,000",
  "income changes to ₹X". Output: goal dates, monthly Free, debt-free date. **Adopt** turns a
  scenario into planned changes (already built: one-offs, apply-from).

---

## 5. Deliverable 5 — Get back on track

**Trigger** (insight engine, step 7): during a locked month, when projected month-end flexible
< 0 or pace is materially ahead of time elapsed, or a commitment is missed/partial, or income
arrived lower. Calm wording, one card on Today and Months, never a notification storm.

**Screen: "October is ₹7,400 off plan"** (a sheet from the card)

1. **What changed** (attribution, largest first, each linked to its entries):
   ₹4,000 unplanned (Car repair, added 12 Oct) · ₹2,100 dining above your usual · ₹1,300 other.
2. **What's left**: 13 days · still to pay ₹X (bills) · still expected ₹X (income) ·
   flexible left ₹X · pace ₹X/day so far.
3. **Options** (computed, each with its consequence):
   - **Hold a daily limit** of ₹X for 13 days → month ends on plan / ₹Y short.
   - **Skip optional bills** (listed with amounts; only untouched optional ones) → frees ₹X.
   - **Move part of this month's savings to next month** → a one-off catch-up in November;
     consequence: EF date moves by N days; November's Free falls by ₹X.
   - **Use your buffer / emergency fund** (only if the gap is essential) → EF cover falls from
     1.4 to 1.2 months; shown plainly.
   - **Accept the gap** → recorded as a known variance; nothing else changes.
4. **Choose** → saved as a recovery plan (M8); Today shows it ("₹620/day until 27 Oct").
   Options that change a commitment go through class-3 revisions, with the reason pre-filled
   from the recovery ("recovery after car repair").

**Backend:** `DriftService` reads the locked plan, instances, unlinked spending, baselines,
remaining obligations and expected income; returns drivers, remaining, options with
parameters and consequences (goal ETA via the trajectory model). Pure calculation - only the
chosen plan is stored.

---

## 6. Deliverable 3 — Behavioural UX audit (per screen)

| Screen | Encourages | Could accidentally encourage | Understand reality? | Accountability? | Anxiety? | Action? | Manipulable? | Make it healthier |
|---|---|---|---|---|---|---|---|---|
| **Today** | checking daily room, handling what's due | fixation on a single number; a red negative "Free" reads as failure | yes (derivation line) | partial | **yes** when Free < 0 in red | yes (Settle, Record) | via H1/H2 | show "₹7,503 more is planned than you hold - see options" in attention tone, not red; link to Get back on track |
| **Months** | planning ahead, settling | editing the plan until it fits (H1-H3) | yes (shape line, what's different) | **weak** - no locked plan | low | yes | **yes** | lock + planned vs actual columns; revisions visible; "Stop after" instead of delete |
| **Ledger** | recording | deleting inconvenient entries; editing closed months | yes | weak (no history) | low | yes | yes (H5) | corrections with history; "corrected" marker; closed-month flag |
| **Accounts** | reconciling | absorbing unexplained gaps via Update balance | partial | weak | low | yes | yes (H6) | checkpoints with visible difference and "add the missing entry" |
| **Cards** | paying bills on time | none major | yes | ok | low | yes | low | overdue statement in Needs you (backlog 3.2) |
| **Debts** | knowing debt-free dates | overwriting outstanding to "look better" | yes | weak | medium (large totals) | partial | yes (H8) | checkpoints; "what frees up when" (step 8) as hope, not dread |
| **Investments** | valuing holdings | chasing value changes | yes | ok | medium (red −₹60) | yes | low | show contribution consistency before market value; neutral tone for small moves |
| **Goals** | saving toward something | lowering targets when behind | partial | **weak** (H7) | medium ("behind") | partial | yes | revisions; ETA from contributions; "what would get it back on date" |
| **Month close** | closing the books | closing without looking | partial (actuals only) | weak (no plan) | low | low | via earlier holes | becomes the Review (§4.5) |
| **Onboarding** | quick setup | unrealistic first plan | partial | n/a | low | yes | n/a | first month framed as "learning month": plan kept, variance shown without judgement |

---

## 7. Deliverable 6 — Screen redesign (what changes)

| Screen | Visible | Remove / demote | Calculated | Editable | Confirm | Immutable | Behind a click | Surfaced proactively |
|---|---|---|---|---|---|---|---|---|
| **Today** | Room, Needs you (≤3), recovery plan if any, next 7 days | red hero for negative Free | Room, cover, drift | nothing directly | - | - | derivation, all insights | off-plan card, salary late, planned change tomorrow |
| **Months** | shape line with **Planned · Now · Actual** columns once locked; what's different; plan | nothing | variance per line and month | draft plan; forecasts | class 3 edits after lock | locked plan | revision history per row | Start month, off-plan, month-end review |
| **Ledger** | entries, corrected marker | - | day totals | labels free; facts via Correct | closed-month corrections | - | previous values | unlinked entries that look like bills |
| **Accounts** | balances with "checked on" | Update balance as an overwrite | balance since checkpoint | policy fields | policy | checkpoints | checkpoint history | stale balance, unexplained difference |
| **Debts** | debt-free date, frees-up calendar | - | all loan figures (labelled) | terms (from a month) | terms | checkpoints | amortisation | EMI ending soon → choose where it goes |
| **Investments** | invested, contribution kept, value (dated) | - | gain, age | holding terms | instalment changes | value history | valuations | instalment missed |
| **Goals** | target (and original), ETA at contribution, pace | - | ETA, required/month | label free; target via Adjust | target/date | revisions | history | behind → what would fix it |
| **Month close → Review** | planned vs actual, what changed, what worked, what's next, one-line note | bare totals only | attribution | note | close | snapshot + plan | entries | commitments kept |
| **Bill sheets** | "Change plan · from next month / this month too" | silent this-month edits | - | per class | class 3 | past rows | revisions | - |

---

## 8. Deliverable 7 — Differentiation

Concrete capabilities, not slogans. Most apps do one or two; none combine them for an Indian
salaried household:

1. **Salary-to-salary months** with expected income, and a Real Balance that already subtracts
   what's committed and owed on cards - "what can I spend until the 28th?"
2. **Plan that remembers**: a locked monthly plan, revisions with reasons, variance against
   the original - a spreadsheet can always be overwritten; this can't be quietly rewritten.
3. **Obligations entered once**: loans, SIPs/RDs, card EMIs and goal contributions generate
   the plan and follow their source.
4. **Get back on track with consequences**: options priced in rupees and goal dates, the
   user's choice remembered and reviewed.
5. **Future cash flow**: EMI endings, one-offs, bonuses and annual bills laid out ahead, with
   "where should the freed ₹4,983 go?" as a decision.
6. **Honest numbers**: every figure says whether it's actual, planned, calculated, estimated
   or confirmed; missing data says so (INCOMPLETE), never guesses.
7. **Reconciliation with memory**: balance and loan checkpoints expose unrecorded money
   instead of absorbing it.
8. **Momentum without scores**: direction on cover, debt, savings rate, obligations and goals.

vs **Excel**: the source workbook corrupted itself six times in three days because values
were stored and overwritten; Kosh derives, locks and keeps history. vs **expense trackers**:
they look back; Kosh plans the month and holds it. vs **budget apps**: category budgets that
people abandon; Kosh commits to obligations and savings and measures flexible spending
against the user's own usual. vs **banking apps**: one bank's view, no plan, no goals.

---

## 9. Deliverable 8 — Implementation plan

### P0 · Financial integrity (close the manipulation holes)
| Item | Backend | DB | Frontend | Risk |
|---|---|---|---|---|
| P0.1 Bill edits default to **from next month** once the month has started; "this month too" needs a reason | `update` scope param; reason stored (M3) | M3 | Edit sheet "When" choice | existing edits that relied on this-month behaviour |
| P0.2 **Stop after** replaces delete/archive for bills with a started month; current row kept | delete/archive keep current row | - | sheet wording | users who really mis-added a bill: "Remove - added by mistake" (correction, reason) |
| P0.3 Fixed rows' expected amount is a revision, not an edit (H2) | instance PATCH → revision for fixed bills | M2/M3 | Estimate only for variable | - |
| P0.4 Lock the month's plan (M1, M2) | lock on first read after start; `planned_amount` | M1, M2 | Start month card; Planned column | backfill: current cycle locks from current values |
| P0.5 Corrections with history (M4) for transactions; closed-month flag | correct endpoint; change_log writes | M4 | Correct amount; corrected marker | import commit path |
| P0.6 Balance checkpoints (M5) instead of overwriting the anchor | balance calc from last checkpoint | M5 + migrate each account's opening into checkpoint #1 | Check balance sheet with difference | **balance maths change - real data**: mysqldump, compare every balance before/after |
| P0.7 Closed-month snapshot also stores plan totals (M10) | close writes planned figures | M10 | Review | - |

### P1 · Behavioural foundation
Provenance labels (M12) · goal revisions (M7) · loan checkpoints (M6) · month-end Review (M9)
· variance attribution (planned vs actual, unplanned, revisions) · wording pass (no shame).

### P2 · Intelligence
Insight engine (audit step 7) including drift, INCOME_LATE, PLANNED_ITEM_MISSED,
PLANNED_CHANGE_SOON · Get back on track (§5, M8) · baselines after 3 cycles · entry memory
(step 9) · recurring detection (step 11) · import (step 10).

### P3 · Advanced planning
Loan intelligence and EMI-release decisions (step 8) · trajectory + what-if with Adopt ·
momentum indicators · emergency-fund cover and goal ETA (step 12) · annual bills reserved ahead.

### P4 · SaaS differentiation
Auth/tenancy (ADR-0005 seam), export, account deletion, reports (yearly / tax), household,
reminders by email/push built on insights.

### Regression risks
- Balance checkpoints change the core balance calculation → every Real Balance figure;
  compare all accounts before/after on a dump.
- Plan lock changes what "variance" and "settled" totals mean → Months, Month close, shape.
- Scope defaults on bill edits change existing muscle memory → clear wording.
- The existing 125 tests cover much of balance/plan behaviour; tests for this layer are
  deferred with SQL (see §10 D1).

### Order with the remaining audit steps
P0 → step 7 (insight engine, now including drift) → P1 → steps 8, 12 → §5 recovery → steps
9-11 → P3 → P4.

---

## 10. Decisions needed (tomorrow)

| # | Decision | Recommendation |
|---|---|---|
| D1 | P0/P1 are mostly schema (M1-M10), but the current rule is "no SQL/tests until the end". | **Lift the rule for P0 only** (migrations + mysqldump + a few integrity tests), or build P0's non-schema parts first (P0.1 wording/default, P0.2, sheet language) and batch M1-M10 later. |
| D2 | When does a month lock? | Automatically on the first open on/after salary day, plus an explicit "Start October" card that shows what's being committed. |
| D3 | Mid-month "this month too" edits: allowed with reason, or blocked? | Allowed with a reason, shown as a revision. Blocking pushes people back to spreadsheets. |
| D4 | Deleting a mistaken bill mid-month | "Remove - added by mistake" (correction, reason) vs "Stop after" (decision). |
| D5 | Balance checkpoints: migrate existing opening balances as checkpoint #1? | Yes, after a dump; figures must not change. |
| D6 | Baseline for "above your usual" | Median of the last 3 closed cycles; nothing shown before 3 exist. |
| D7 | Momentum indicators to start with | Emergency cover, savings rate, fixed obligations share, commitments kept. |
| D8 | Order vs audit steps 7-12 | P0 first, then step 7 with drift folded in. |
