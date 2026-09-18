# Product Strategy — beyond the spreadsheet

**Written 2026-09-10.** Supersedes the framing of `SCREEN_PURPOSE_AUDIT.md` (which stays
valid as a *diagnosis* of what is broken, but proposed the wrong ceiling). Study only —
nothing here is implemented.

---

## 0. The correction

The previous study treated `Finance.xlsx` as a specification. It is not. It is **evidence
of how one person manages money when the only tool available is a grid** — which is why it
has 13 tabs, a 79-row glossary, and a month-close checklist that begins *"update the four
opening balances by hand."*

Porting that to the web produces a nicer spreadsheet. The ceiling is the spreadsheet.

The question this document answers instead:

> **What can software do for someone's money that a grid of cells structurally cannot?**

And the test we already wrote for ourselves, at the bottom of `UI_UX_PRINCIPLES.md`:

> *"Does this screen help someone understand their money, or does it merely display it?"*

By that test, the current build is mostly display.

---

## 1. The thesis

> **A spreadsheet tells you where you stand. This product should change what you decide.**

Everything below follows from that sentence. A figure that does not change a decision is
decoration, however beautifully it is set.

---

## 2. The ladder — what "manage better" actually means

Financial control is a ladder, not a feature list. Each rung needs the one below it.

| # | Rung | The question | Excel | Us today |
|---|---|---|---|---|
| 1 | **Record** | What did I spend? | ✅ `Tracker` | ✅ Add |
| 2 | **Know** | Where do I stand *right now*? | ✅ `Today` | ✅ Real Balance / Room |
| 3 | **Anticipate** | What's coming, and will it work out? | ⚠️ partial — due dates, no verdict | ⚠️ per-account shortfall only |
| 4 | **Decide** | Can I afford *this*, specifically? | ❌ **impossible** | ❌ |
| 5 | **Adjust** | Does my plan correct itself from reality? | ❌ manual retyping | ❌ |
| 6 | **Improve** | Am I actually getting better? | ⚠️ `History` records, never interprets | ❌ |

**The Excel tops out at rung 3, and cannot go further** — not because its author lacked
skill, but because rungs 4–6 need computation over time, simulation, and memory of what the
user was told last cycle. Cells cannot do those.

**We are currently at rung 2.5 — below the spreadsheet.** That is the honest read, and it is
why the app feels thinner than the workbook despite looking better.

**All of the product's value is in rungs 4, 5 and 6.** That is where the strategy points.

---

## 3. Four capabilities a spreadsheet structurally cannot have

These are the product. Everything else is table stakes.

### 3.1 · FORECAST — "will this cycle work out?"

The single most valuable sentence we can put on a screen, and nobody in this market computes
it:

> *"On your current pace you'll finish this cycle with about **₹4,200 left over**."*

or, when it doesn't work:

> *"On your current pace you'll be about **₹3,100 short before the 27th**. The tightest
> point is **Sunday the 13th**, when the SIP leaves IDBI."*

Excel knows today's disposable figure. It cannot project *forward* through remaining
commitments at a spending pace, because the pace is a moving statistic and the commitments
are a schedule. We have both.

Two outputs, always visible, never a chart:
- **The verdict** — one sentence, on Today (under Room) and Month (replacing the fat summary).
- **The tightest point** — the date the projection dips lowest and the obligation that causes
  it. This is *actionable*: it tells you what to move, not just that you're short.

Needs no new data. `ProjectionService` already projects per account; this extends it to the
whole cycle.

### 3.2 · DECIDE — "can I afford this?"

**The differentiator.** A spreadsheet answers questions about the past. This answers a
question about a decision you are standing in front of, in a shop, right now.

Input: an amount (optionally a category and date). Output — the honest consequences:

```
₹8,000 · Shopping · today

  Room today         ₹1,157  →  −₹6,843     that's about 7 days of allowance
  Cycle end          +₹4,200  →  −₹3,800    you'd finish short
  IDBI               dips below its ₹3,000 minimum on the 13th, when the SIP goes out
  Emergency fund     this cycle's contribution stops being affordable
                     target date slips Apr 2028 → Jun 2028

  What would make it work
  ·  Move the RD instalment to next cycle, or
  ·  Keep flexible spending under ₹450/day for the rest of the cycle

  [ Not now ]                                    [ Do it — record the spend ]
```

Three things matter about this design:

1. **"What would make it work"** is the advisor move. Every other product tells you *no*.
   This tells you *what would have to be true* — which is what a person actually wants.
2. It **ends in a transaction**. Choosing "Do it" pre-fills Add. Simulation and capture are
   the same flow, so the record is never lost.
3. It is a **peer of Add**, not a screen. Add records what happened; Decide tests what might.
   That symmetry is the product in two verbs.

### 3.3 · EXPLAIN — "why is this number what it is?"

This is the info-icon request, and it deserves to be a system rather than scattered tooltips.

`UI_UX_PRINCIPLES.md` §9 already commits us: *"His spreadsheet eventually needed a glossary
and 61 tooltips. **Build that in from screen one.** Financial literacy is a feature we
deliver, not a prerequisite we assume."* And §7 defines the four layers. Neither is built.

The Excel's `Legend` tab is genuinely excellent content in the worst possible place — a
separate tab, so understanding requires *leaving the number you were confused by*. Its three
columns become our popover, in place:

```
Real balance                                              ⓘ
────────────────────────────────────────────────────────────
WHAT IT MEANS
What is genuinely yours to spend, after setting aside money
you've reserved and bills you've already promised.

HOW IT'S WORKED OUT
  Held across accounts            ₹63,157
  Less reserved                  −₹42,000
  Less committed                       ₹0
  ────────────────────────────────────────
  Real balance                    ₹21,157

WHERE IT COMES FROM
  4 accounts · 2 reservations · 8 commitments this cycle →

WHAT CHANGED IT
  Fell ₹2,500 when the electricity bill was confirmed, 2 days ago.
```

Rules so it clarifies rather than clutters:
- **Only on figures that are derived or use vocabulary** — hero numbers, status words,
  anything using *reserved / committed / available / unbilled*. Never on a plain amount.
- **Affordance:** appears on hover on desktop, always present on touch. Never a chevron.
- **One component**, one shape, everywhere. A user learns the gesture once.
- **Status words get it too** — `UNVERIFIED`, `NEEDS_REVIEW`, `PART_PAID` each answer *what
  it means* and *what to do*, which is exactly the Excel's status table.
- **"What changed it"** is the part no spreadsheet can do, and probably the most valuable
  line in the panel.

Plus a **learn-once layer**: the first time a screen shows "Reserved", a short inline
sentence explains it, dismissible forever. Literacy delivered progressively, not as a manual.

### 3.4 · STANDING — "where am I, honestly?"

*Decided 2026-09-10: mirror the position, give the pros and cons of standing there, then
recommend.* An advisory posture rather than a calculator — and the answer to Plan's own
question, *"is this realistic?"*

Three parts, in order, all computable from data we already hold:

```
WHERE YOU STAND
  ₹57,700 comes in.  ₹43,900 is spoken for before you spend anything — 76%.
  That leaves about ₹13,800 a month for everything unplanned.

WHAT'S WORKING
  ·  Nothing has gone overdue in the last two cycles.
  ·  Your emergency fund covers about 1.2 months of your outgoings.

WHAT YOU'RE EXPOSED TO
  ·  At 76% committed, one unplanned bill uses most of what's left.
  ·  IDBI ends most cycles under its ₹3,000 minimum.
  ·  Two loans have estimated figures, so your payoff dates are approximate.

WHAT WOULD HELP MOST
  ·  The ZestMoney EMI ends in 4 cycles — that's ₹5,000 a month back.
  ·  Moving the RD to the 20th would clear the tight spot every cycle.
```

Design constraints, because this is the easiest section in the product to get wrong:

- **No score.** No "Financial Health: 62/100". That is the fintech cliché quality gate 13
  exists to catch, and a number like that is a verdict, which §11 forbids.
- **Observations and consequences, never judgement.** *"76% is committed, which leaves
  ₹13,800 for the unplanned"* — not *"your fixed costs are too high."*
- **Few recommendations, and only confident ones.** Ranked by what actually frees the most
  money. Where we cannot be sure, we say so rather than padding the list.
- **Exposures must be actionable or informational, never alarming.** §10, steady heart rate.

Home: **Plan**, whose question this directly answers, and which is currently the thinnest
screen. Plan becomes the reflective screen — *Where you stand · Trajectory · Goals · Rules*.

The mirror and the trade-offs work from cycle one. The recommendations get better with
history but are not blocked on it.

### 3.5 · TRAJECTORY — "am I getting better?"

The Excel's `History` tab records seven columns per cycle and interprets none of them. Rows
2–24 are pre-filled with zeros for cycles that haven't happened. It is a ledger of the past,
not a read on direction.

Four honest measures, cycle over cycle:
- **Savings rate** — the single best measure of progress (the Legend says so itself).
- **Debt outstanding** — the countdown. For a user at ~76% committed this is *the* motivating
  number, and per S4 it gets the craft budget. Currently broken (§6).
- **Net worth direction** — not the absolute, which is alarming and slow-moving; the delta.
- **How much the system had to chase you** — obligations that went overdue or needed review.
  Falling is improving.

That fourth one is a *behaviour* measure rather than a money measure, and it is the one that
says "you are managing better", not merely "you have more". Framed as an achievement
statement — *"Nothing went overdue this cycle"* — never as a score. **Flagging a tension:**
§13 forbids streaks and badges, and a reliability metric can drift that way. It stays as a
month-close observation, not a persistent number on a dashboard.

---

## 4. Three organizing principles

### P1 · Exceptions on the surface, completeness one level down

The spreadsheet must show everything, because it cannot compute what matters. We can.

- `C-Month`'s category table lists **20 rows including zeros**. The Excel's *own* `Today`
  sheet does it better — *"Categories that are over budget, worst first"*, 3 rows. Follow the
  Today version everywhere.
- Accounts: surface the one below its minimum, not all nine at equal weight.
- Obligations: Today shows what needs you; Month holds the full register.

This principle simultaneously fixes the space complaint and justifies the detail layer:
**the detail layer is where completeness goes.**

### P2 · Every screen states its question and offers one action

The reason Month and Money read as unclear is not their content — it is that neither
announces its job or offers an obvious next move. Money's subtitle currently defines *net
worth*, not the *screen*. Quality gates 1 and 4 both fail today.

Every screen gets a question as its header and exactly one primary action.

### P3 · Propose, never invent — and never leave the screen empty

The rule that resolves the budget question (§5) and generalises well beyond it: the product
may **observe** and **propose**; only the user **decides**; and where we have neither
observation nor decision, we show something honest rather than nothing.

---

## 5. Resolving the budget question (`OPEN_QUESTIONS` Q2)

We decided *no budgets* — correctly, because aspirational budgets are what people fail and
abandon. The intended replacement was "compare against your own baseline". But a baseline
needs ≥3 cycles, the DB has one, so **both** judgement blocks are empty placeholders and the
Month screen is half-missing. The Excel solved it with a typed number in `Setup` — the exact
failure mode we rejected.

There is a third option, and it works from day one:

| Stage | What we show | Needs |
|---|---|---|
| **Cycle 1–2** | **Pace.** *"You're 45% through the cycle and have used 60% of your flexible money."* | Nothing but today's date |
| **Cycle 3+** | **Observation.** *"Drinks ₹7,830 — your usual is about ₹6,100."* No verdict. | 3 cycles |
| **Any time after** | **Plan.** A number *we propose from observation* and the *user confirms* — adjusted at month close as reality moves. | A confirmed proposal |

Pace is the unlock: it is a genuine, useful comparison that requires **no history at all**,
and no spreadsheet computes it because it needs to know what today is. It means the screen is
never empty and never invents a number.

A plan number arrived at this way is not an aspirational budget — the user never types a
hopeful figure. It is their own behaviour, offered back for confirmation.

---

## 6. What "trust" requires — and where the Excel is weakest

The origin story: the workbook *"functioned and nearly corrupted itself six times in three
days."* Trust is the product's foundation, and it is the thing a spreadsheet is worst at.

**Reconciliation, replacing manual opening balances.** The Excel's month-close step 1 is
*"update the four opening balances on Accounts, and move the Balance as at date."* Truth is
injected by retyping — and a mistyped figure silently corrupts everything downstream.

Invert it: we compute the balance continuously, and periodically ask one question —

> *"HDFC Salary — we make it ₹31,980. Does your bank agree?"*

If it differs, the difference **is** a missing or wrong transaction, and we can help find it.
S4 already names this as Money's primary action (*"correct a balance against the bank"*). It
is the single highest-trust interaction in the product and costs one number per account.

**System health.** The Excel's `Today` ends with seven named checks, each with a count and a
consequence. Ours checks two of eight. This should be one endpoint feeding one panel: *what
is currently stopping this product from telling you the truth* — unknown amounts, unconfirmed
payments, accounts below minimum, loans with no principal, goals with no target.

**And the one thing already better than the spreadsheet:** ADR-0006 and the `Unknown` state.
The workbook's closing line — *"if a figure cannot be worked out safely it says Insufficient
data instead of guessing"* — is our rule too, and it is enforced in code rather than by
discipline. Nothing in this strategy may trade it for a fuller-looking screen.

**Known blocker:** `LoanPayment` has no write path anywhere in the codebase, so
`amountRepaid` is permanently ₹0 and every loan shows its full original term. The debt
countdown — the most motivating element in the product for this user — cannot work until
that is fixed. It is a strategy item, not a bug.

---

## 7. The screens, restated

| Screen | Question | Primary action | What's new under this strategy |
|---|---|---|---|
| **Today** | Can I spend, and is anything about to go wrong? | Add | **Forecast verdict** under Room. Needs You becomes clickable exceptions |
| **Month** | What must still happen, and will the plan hold? | Settle | Becomes the **Action Center** — still-due, priority, consequence. Fat summary → forecast line. Flexible spending by **pace** |
| **Money** | What do I own, owe and hold — is any of it wrong? | **Reconcile** | Four registers with their own logic. Net worth as *direction*, labelled approximate |
| **Plan** | Where is this taking me, and is it realistic? | Adjust a rule or goal | **Trajectory first.** Goals as rows. Rules editable, with *why* and *if I skip it* |
| **Month Close** | How did I actually do? | Close | Plan correction from observation. Ends on something that moved right |
| **Decide** *(new)* | Can I afford this? | Do it / not now | The simulator. Peer of Add |
| **Detail** *(new)* | Why is this number what it is? | Act on this one thing | The completeness layer. Every list row opens |

**The rule that separates Today from Month:** Today is the next 24 hours (urgency, 3 items
max). Month is the whole cycle (completeness). Today never shows the full obligation list.

### 7.1 · Naming

*Decided 2026-09-10.* Nav labels name the user's job in their own words, never our jargon.

| Was | Becomes | Why |
|---|---|---|
| Today | **Today** | Already right. Temporal, actionable, unambiguous |
| Month | **This Month** | The user's own words for it. "Month" alone reads as a calendar month or a report; "This Month" is possessive and current. The `28 Aug – 27 Sep · day 14 of 31` subtitle does the teaching that it's a *salary* month — which works better than forcing "Cycle" as vocabulary |
| Money | **Accounts** | Every item on that screen literally is an account — bank, cash, card, loan, investment. "Money" is true of the entire app, so it carries no information. Net worth stays the hero on it |
| Plan | **Plan** | Holds up once ordered as a narrative: where you stand → where it's heading → the rules that get you there |

### 7.2 · "This Month" — the structure, not just the name

The screen the user called *"critical to manage this month."* Its failure was never the
label — it was being a **report** when the job is a **worklist**. Restructured around the
three questions actually being asked, in this order:

```
THIS MONTH                              28 Aug – 27 Sep · day 14 of 31
On your current pace you'll finish with about ₹4,200 spare.      ← forecast, one line

NEEDS A DECISION            1
  Petrol            variable — needs an amount before your Room is certain      →

STILL TO COME               3                                        ₹4,149
  RD instalment     due 15 Sep      ₹1,000    IDBI        RD schedule breaks    →
  Netflix           due 20 Sep        ₹649    HDFC        optional              →

DONE                        6                                       ₹23,200
  Electricity       paid 2 Sep      ₹2,500                                      →
  …                                                              collapsed by default

WHERE THE FLEXIBLE MONEY WENT
  45% through the cycle · 60% of your spending money used
  Drinks ₹7,830 · the largest share, worst first
```

Why this shape:

- **Needs a decision / Still to come / Done** answers *"what's done, what's left"* directly,
  which a flat list with status pills does not. It is a worklist, and the count and total
  per group are the two figures that matter.
- **Ordered by what it costs to ignore** — blocked first, upcoming second, finished last and
  collapsed. Done work should be *available*, not *prominent*; it has already been dealt with.
- **Justification lives on the row** — the "if I skip it" text sits as the row's secondary
  line, so the consequence is visible without opening anything. This is the single change
  that turns an admin list into something meaningful.
- **The fat summary is gone.** In/out/saved moves behind the ⓘ on the forecast line. The
  forecast sentence does what the summary was trying to do, in one line instead of four rows.
- Every row opens its detail — the rule behind it, its history across cycles, the linked
  transaction, and the actions.

---

## 8. What we deliberately do not copy

Strategy is exclusion. From the workbook:

- **The 20-row category table** → only what's off-pace, worst first.
- **The month-close checklist as chores** → the app performs most of those steps; the ones
  that need a human become guided moments (reconcile, confirm).
- **Retyping opening balances** → reconciliation (§6).
- **Manual "Confirmed?" tick columns** → explicit confirm actions with an audit trail.
- **`Setup` as a config dump** → settings live where they are relevant.
- **A tab per asset class as navigation** → registers inside Money, with detail routes.
- **The `Legend` tab** → dissolved into the Explain system, at the point of confusion.

And from the wider category, things we are choosing not to build: bank/SMS auto-sync,
charts without a takeaway sentence, gamification of any kind, notifications beyond a very
small set, and anything resembling advice on what to invest in.

---

## 9. Execution — six phases, each with a felt outcome

Sequenced so that **every phase changes how the product feels**, never a long invisible
backend stretch. Phases 1–4 work from cycle one; only 5 needs history.

**Phase 1 · Make it legible** *(frontend)*
Screen headers stating the question + one action · Month becomes the Action Center with
*still due* distinct from *amount* · Money into four registers · Goals to rows · summaries
compressed · **detail routes** for commitment, account, loan, card, goal.
→ *"I know what each screen is for, and I can open anything."*

**Phase 2 · Make it explain itself** *(frontend + 3 backend fields)*
The Explain system — means / worked out / comes from / what changed it · status-word
explanations · learn-once inline literacy · `why`, `ifSkipped`, `priority` on `Commitment`.
→ *"I understand these numbers, and why each bill matters."*

**Phase 3 · Make it look ahead** *(backend + frontend)*
Cycle forecast verdict + tightest point · pace-based flexible spending · the system-health
panel.
→ *"It tells me what's coming, not just what happened."*

**Phase 4 · Make it answer decisions** *(the differentiator)*
Decide sheet — impact on Room, cycle end, account minimums, goals · *what would make it
work* · flows into Add.
→ *"I use this before I spend, not after."*

**Phase 5 · Make it improve with me** *(needs history + the loan fix)*
Loan payments → debt countdown works · Trajectory on Plan · plan numbers proposed from
observation · Month Close gains the correction step.
→ *"I can see I'm getting better, and the plan gets more accurate each cycle."*

**Phase 6 · Make it unquestionably right**
Reconciliation · the import flow · investments and valuation.
→ *"I believe these numbers."*

---

## 10. How we'll know it worked

Not opinions — things a person can be observed doing.

1. Answers *"can I spend ₹5,000 right now?"* in under 10 seconds, without opening anything else.
2. Can explain any number on screen to someone else after one tap.
3. Can name the one thing to do today.
4. Knows whether the cycle will end well **before** it ends.
5. Opens Decide *before* a purchase, not Add after.
6. Can see they are better than three cycles ago.
7. Stops opening the spreadsheet.

Number 7 is the real one.

---

## 11. Decisions I need from you

1. ~~**Does the ladder framing hold?**~~ **Answered 2026-09-10.** Neither option as posed —
   the product should **mirror where the user actually stands, give the pros and cons of
   standing there, and then recommend**. That is an advisory posture across rungs 2→4
   rather than a choice between them, and it became §3.4 · STANDING.
2. **Budget question (§5)** — agree with pace → observation → proposed plan?
3. **Reconciliation (§6)** — worth making Money's primary action, or too much friction?
4. **Trajectory's fourth measure** — keep "how often things went overdue", or drop it as too
   close to gamification?
5. **Phase order** — Phase 1 is the least exciting and the most foundational. Comfortable
   starting there, or would you rather feel Explain (Phase 2) or Forecast (Phase 3) sooner?
