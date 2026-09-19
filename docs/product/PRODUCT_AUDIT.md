# Kosh: product audit and intelligence plan

Written 2026-09-16, from the code as it stands (backend V15, 103 tests, 16 route paths).
**Study only. Nothing here is built.** It builds on, and does not replace:
`design/PRODUCT_STRATEGY.md` (the ladder: Record → Know → Anticipate → Decide → Adjust →
Improve), `product/DATA_ENTRY_AUDIT.md`, `product/LEDGER_IMPROVEMENT_PLAN.md`,
`product/BUSINESS_MODEL.md` and `product/FIX_BACKLOG.md`. Where an item is already in
the backlog, its number is given (e.g. **B1.2**) rather than restating it.

---

## 0. The verdict in one page

**What Kosh already does better than any spreadsheet or tracker:**

- One number that answers "what can I spend": Real Balance = held − reserved − committed − owed on cards. It's derived, never stored, and returns INCOMPLETE rather than guessing.
- A salary-to-salary month.
- Double-entry postings, so money is never counted twice.
- Loans modelled from where they stand today, with calculated terms, an estimator and "calculated" tags the user can override.
- Card statements, bill settlement and auto-matching.

The foundations are **correct and unusually honest**.

**What stops it from being "an operating system that understands my money":**

1. **One real obligation is modelled in up to three places that don't know about each other.** A loan's EMI lives on the Loan, again as a plan bill, and (for card EMIs) again as a card charge. A SIP's monthly amount lives on the Investment and again as a bill. The emergency-fund transfer is a bill that can't be settled with a transfer. The user types everything twice, and a missed copy silently corrupts Free (B1.1, B1.2, B1.3, B3.1). **This is the single biggest product defect.** Every intelligence feature in the brief (EMI release, "₹5,000 free from May", contribution pace) depends on fixing it.
2. **Income is not modelled** (B2.4). The product knows the salary *day* and not the *amount*, so it can't state the month's structure ("₹57,700 in → ₹43,435 committed → ₹14,265 flexible") before salary day. That structure is the heart of the brief's "financial relationship engine".
3. **No insight layer exists.** Every warning is hand-built inside a component (Needs You, Needs a look, shortfall, goal pace). Nothing ranks, de-duplicates, explains or snoozes. That's fine at five warnings and unmanageable at fifty.
4. **Nothing learns from history yet.** There is no baseline, no recurring detection and no description→category memory, and imports have no screen. Yet `BUSINESS_MODEL.md` §5 says the thing that makes someone pay in year two is *"it knows my normal"*.
5. **Trust gaps:**
   - Accounts don't enforce what they can be used for (an EXPENSE can be booked against a LOAN account).
   - Percentages use two conventions (fraction vs 0–100).
   - Optional bills don't reduce Free.
   - Net worth doesn't move as EMIs pass (B1.5).
   - Almost none of the last three sessions' UI has been clicked through in a browser.

**Recommended direction:** don't add screens. Build three engines under the existing screens, in this order:

1. **Obligation engine:** every recurring outflow *and* inflow is one rule with a source (loan, investment, goal, card, or manual), settled by the right transaction type.
2. **Insight engine:** ranked, explained, snoozable findings from one reusable service.
3. **Learning layer:** baselines, recurring detection, category memory and import.

Then let each screen show less, because the engines rank for it.

---

## 1. Deliverable 1: product audit

Priority key:
- **P0:** wrong numbers, broken logic, or missing fundamentals.
- **P1:** high value.
- **P2:** enhancement.
- **P3:** future SaaS.

### 1.1 Screens

| Area | Current state | Problem | Missing | Intelligence opportunity | UX recommendation | P |
|---|---|---|---|---|---|---|
| **Today** `/today` | Room-left hero, position statement (the derivation), Needs You (shortfalls, due/overdue bills with cover check), goal-pace card, Coming up (30 days) | Needs You mixes three hand-built warning kinds; Coming up repeats bank EMIs (B1.3); overdue card statements absent (B3.2) | Expected income before salary day; "salary lands in N days" | Needs You = top 3 of the insight feed for `TODAY`; tightest day of the cycle ("lowest point ₹1,240 on 5 Oct, when 3 EMIs leave") | Keep. Cap Needs You at 3 with "N more on This Month". Coming up: 7 days, not 30 (the month is This Month's job) | P0 (dupes), P1 |
| **Ledger** `/ledger` | Day-grouped entries, filters, stated view, category manager, edit | Every entry is typed from scratch; merchant never captured; no import screen although the CSV backend exists | Import; "this looks like your Netflix bill → link it"; category memory | Description → last-used category and account (deterministic, per user); recurring-candidate detection; link-to-bill suggestion for transfers/investments too | Primary CTA: Add. Secondary: Import statement. Suggestions shown as a quiet one-line chip in the form, never auto-applied at low confidence | P1 |
| **This Month** `/month` | Overview (in/out/invested/saved), crux (free for rest of cycle), Needs You, Plan (by category / by when), flexible spending, close | Before salary day "in" is ₹0, so the structure reads wrong; flexible spending has no reference point; no opportunities | Snapshot against *expected* income; "vs your usual"; opportunities (EMI ending, surplus, goal ahead) | Pace (cycle 45% gone, flexible 60% used) from cycle 1; baseline from cycle 3; month-structure waterfall | Restructure to **Snapshot → Attention → Opportunities → Plan → Spending** (§4). No new widgets: Attention and Opportunities are the insight feed filtered by surface | P0 (income), P1 |
| **Month close** `/month/close` | 5-step ritual, immutable snapshot | Runs on actual only; no "what changed vs last month" beyond moved figures | Carry-forward of unpaid bills; income variance | "3 things changed this month" (insight engine, `CLOSE` surface) | Keep the ritual; end with one forward-looking line ("next month starts with ₹X committed") | P2 |
| **Accounts** `/accounts` + detail | Net worth with confidence, Needs a look, cash/bank register, cards, debts, update balance | Net worth debt side stale (B1.5); reservations have no screen (B2.5); "minimum balance" editable only in the edit sheet | Reconciliation as a habit ("does HDFC still say ₹X?") | Stale-balance insight (not matched for 30+ days); idle-cash insight (money above 6× obligations sitting in a 0% account) | Primary CTA: **Check balances** (reconcile), not Add account | P0 (B1.5), P1 |
| **Cards** `/cards` + detail | Credit and debit cards, statements, pay bill, EMIs on card, utilisation | Available/utilisation ignore EMI principal blocked on the card (new gap A); statement remaining wrong after a mid-cycle re-anchor (new gap B); card EMIs not charged automatically (B3.1) | Recurring charges on the card; "statement will be about ₹X" before it generates | Projected next statement = unbilled + card bills due before statement date | Card page leads with **Next bill: ₹X due 10 Oct** then utilisation; debit cards are a footnote | P0 (A, B), P1 |
| **Debts** `/debts` + loan detail | Loan list, standing, needs-a-look, estimator, schedule | Remaining interest, interest paid, prepayment benefit not shown; costliest-debt ranking absent; loan payments not recorded individually (B4.3) | EMI release calendar; "which loan to prepay first" | Remaining interest = remaining payments − outstanding principal (when rate known); prepay simulation; freed cash-flow date per loan | Lead with **Debt-free date** and **₹/month freed next** (the date the next EMI ends) | P1 |
| **Investments** `/investments` | Holdings, check-in of values, standing | SIP/RD contribution is display-only: it isn't committed, isn't in Coming up and isn't matched to Ledger entries | Contribution calendar; goal link (B2.1) | Contribution consistency ("SIP missed in Aug"); allocation to goals | Keep simple: invested, value, as-of. Contribution becomes a generated obligation (§3) | P0 (relationship), P2 |
| **Goals** `/goals` + detail | Goals with progress, required per month, pace (new) | Progress can only come from one account or reservation; no monthly contribution link; pace measured against time, not contribution | "At your current contribution you reach it in ~13 months" | Contribution-based ETA once a bill/transfer feeds the goal; emergency-fund target suggested from must-pay total (B2.2) | Each goal row: **₹75,000 / ₹2,00,000 · ~13 months at ₹10,000/mo** | P1 |
| **Bill detail / rule detail** | Instance statement, linked entry, history, edit | Fine; can't show what the bill *is* (a loan EMI? a SIP?) because that relation doesn't exist | Source link | Price-change detection ("TV+WiFi rose ₹100 in Aug") | Show the source ("from Bike loan · 37 EMIs left") | P1 |
| **Onboarding** `/onboarding` | Pay day → accounts → bills → reservations → Real Balance preview; runs only with zero accounts | Asks for bills before income; salary amount never asked; can't be resumed | Salary amount; "do you have loans / a credit card / SIPs?" routing to the real forms | Show the month structure after 3 inputs | 3 mandatory inputs (salary amount + day, main bank balance, "what leaves every month" quick chips), then a checklist that links to the real forms (as `DATA_ENTRY_AUDIT` recommends) | P0 (income), P1 |
| **Navigation** | 8 items: Today, Ledger, This Month, Accounts, Cards, Debts, Investments, Goals | Eight peers; Cards/Debts/Investments are registers, not daily destinations | n/a | n/a | P2: **Today · This Month · Ledger · Money · Goals**, where Money holds Accounts/Cards/Debts/Investments as tabs. Fewer choices; same pages | P2 |

### 1.2 Cross-cutting findings

| Finding | Evidence | Consequence | P |
|---|---|---|---|
| Same obligation modelled 2–3× | Loan.emi + Commitment; Investment.monthlyContribution (only in `InvestmentSummary`) + Commitment; card EMI loan + card bill | Double typing; forgetting a copy overstates Free | **P0** |
| No expected income | `User` has `cycleStartDay` only | Month structure unknowable before salary; committed share empty | **P0** |
| ~~Account usage not enforced~~ **Wrong: already enforced** | `TransactionType.acceptsSource/acceptsDestination`, checked in `TransactionServiceImpl` (found during step 1, 2026-09-16) | None. Step 1 only added: a REFUND may go to a CREDIT_CARD | ~~P0~~ Done |
| Optional bills don't reduce Free | `findOpenMandatoryForCycle` in `PositionServiceImpl` | A planned ₹1,999 subscription (Must pay = No) is "free money" until charged | **P0 (decide)** |
| Percent conventions differ | `savingsRate` is a fraction; `progressPercent`, `timeElapsedPercent` are 0–100 | A 100× display bug already happened once | P1 |
| Hand-built warnings | NeedsYouCard, NeedsALookZone, DebtsNeedsALook, GoalPaceCard | Can't rank, de-duplicate or snooze; each screen drifts | P1 |
| No history-based intelligence | No baseline/recurring/merchant code anywhere | Year-two value (`BUSINESS_MODEL` §5) absent | P1 |
| Import has no UI | `/imports` controller; no service in the frontend | Heavy manual entry, the #1 churn cause in personal-finance apps | P1 |
| No auth, fixed user | `CurrentUserProvider` returns user 1 | Not yet a SaaS; ADR-0005 keeps this a policy change | P3 (gate for launch) |
| Unknown route → 500 | B4.1 | Error contract broken for clients | P1 |
| UI unverified in a browser | Handoff §6 | Regressions undetected | **P0 (trust)** — add a browser smoke test |

---

## 2. Deliverable 2: intelligence map

`input → derived → insight → optional action`. **Have** = built; **Gap** = needs work.

| Domain | User input (ask once) | Derived (calculate) | Insight (when it matters) | Action (user decides) | State |
|---|---|---|---|---|---|
| Income | Salary amount, day, account; other income (amount, frequency, variable?) | Expected inflow per cycle; income vs actual; committed share | "Salary ₹2,300 lower than usual" · "Nothing credited yet, 2 days after pay day" | Record it / mark as late | **Gap** (B2.4) |
| Month structure | (none, all derived) | Income − committed − planned savings = flexible; per-day room | "76% of income is committed; 3 EMIs end within 12 months" | Open Debts | **Gap** (needs income) |
| Loans | Outstanding, EMI, EMIs left *or* rate, EMI day, pay-from | Payoff date · still to pay · outstanding today · implied EMIs · consistency | "Terms don't agree" | Use calculated / keep mine | **Have** |
| Loans (more) | (same inputs) | Remaining interest · interest share of next EMI · prepayment saving (₹X lump → months and interest saved) · costliest-first order | "₹4,983/month is freed from Dec 2027" · "Coding Ninjas at 19.5% is your most expensive debt" | Simulate a prepayment | **Gap** |
| EMI release | Loan payoff dates (derived) | Freed cash-flow calendar | "₹5,000/month available from May 2027" (surfaced ~2 cycles ahead) | Allocate to goal / prepay / invest (pre-fills a bill) | **Gap** |
| Credit card | Limit, statement day, due day, owed | Unbilled, next statement estimate, due status, utilisation, EMIs on card | "Statement due in 3 days, ₹X left to pay" · "Utilisation above 30% for 2 statements" | Pay bill (pre-filled transfer) | **Have** (partly) · Gap A/B |
| Bills | Name, amount or "varies", day, account, category | Occurrences, status, variance, cover (balance after) | "Won't be enough in IDBI on 5 Oct unless you move ₹X" · "TV+WiFi rose ₹100" | Transfer (pre-filled) · update amount | **Have** (cover) · Gap (price change, transfer pre-fill) |
| Recurring detection | (none) — Ledger history | Same merchant/description ±10% in ≥3 of last 4 cycles | "₹649 to Spotify appeared 4 months running" | **Add as bill** (pre-filled) / not recurring | **Gap** |
| Transactions | Amount, description | Category/account from description memory; link to an open bill | (none, it's a form suggestion) | Accept chip | **Gap** (auto-match exists for expenses only) |
| Flexible spending | (none) | Pace (cycles 1–2); baseline median (cycle 3+) | "₹3,200 above your usual on Food" (never "overspent") | Open category | **Gap** |
| Savings / emergency fund | Target (suggested), account, monthly transfer (a bill) | Months of must-pay covered · ETA at current contribution | "Emergency fund covers 1.4 months of must-pay bills; ₹10,000/mo reaches 6 months in Feb 2028" | Change contribution | **Gap** (B2.2, B1.1) |
| Goals | Name, target, date, funding source | Progress, required/month, pace (time) · ETA (contribution) | "Wedding goal ₹X short at current contribution" | Raise contribution / move date | **Have** (time pace) · Gap (contribution) |
| Investments | Type, monthly amount, day, value check-ins | Invested, gain, valuation age, contribution consistency | "Value not updated in 90 days" · "SIP not seen this month" | Update value / link entry | **Have** (partly) |
| Balances | Update balance (reconcile) | Confidence, staleness, drift vs Ledger | "HDFC last matched 34 days ago" | Check balance | **Gap** (staleness insight) |
| Cash-flow shortfall | (derived) | Per-account projection with running balance | "IDBI short on 5 Oct" | Transfer | **Have** |
| Idle cash | (derived) | Spendable held above N× monthly obligations for 2+ cycles | "₹1.2L has sat in HDFC Salary for 3 months" | Open goals | **Gap** (P2) |
| Insurance | Policy, premium, renewal date (a bill: annual) | Renewal in window | "Health insurance ₹18,000 renews next month" | Reserve monthly | **Gap** (annual bill exists; reserve-ahead doesn't) |

---

## 3. Deliverable 3: domain model review

**Keep:** Account (typed, opening anchor, confidence), Transaction + Posting (double
entry), Category (groups incl. INCOME, one-level parents), Commitment → CommitmentInstance
(rule/occurrence), Cycle + CycleSnapshot, Loan (current-position model), CreditCardTerms +
CardStatement, Investment, Goal, Reservation. These are right and should not be rewritten.

### 3.1 The one structural change: obligation sources

```
Commitment (rule)                       CommitmentInstance (per cycle)
  + source_type  MANUAL | LOAN | INVESTMENT | GOAL | INCOME
  + source_id    → loans.id / investments.id / goals.id
  + direction    OUT | IN                          settles with EXPENSE | TRANSFER |
  + settle_as    EXPENSE | TRANSFER | INVESTMENT      INVESTMENT | INCOME
               | INCOME
```

- **Loan → bill.** Creating a loan offers "Add its EMI to the plan". The generated rule (source LOAN) takes its amount, day and last payment *from the loan*: it isn't copied, and changing the loan changes the bill. Timeline and Coming up show it once (fixes B1.2, B1.3). A card-paid loan's rule leaves from the card (fixes B3.1).
- **Investment → bill.** A SIP or RD with a monthly amount generates a rule settled as INVESTMENT (fixes the display-only contribution).
- **Goal → bill.** "Put ₹10,000/month towards Emergency fund" generates a rule settled as a TRANSFER into the goal's account (fixes B1.1). The goal's ETA then comes from contribution, not only from time.
- **Income rule.** Direction IN, settled by an INCOME entry, auto-matched like bills. Standing and Snapshot use expected income until the actual arrives, then actual instead (never both) (fixes B2.4).
- **Manual** bills are unchanged.

Schema cost: **one migration** (four nullable/defaulted columns on `commitments`), plus
extending `CommitmentAutoMatcher` and `settle` to the other transaction types.
Rule-level derivation stays at read time (ADR-0011): a LOAN-sourced rule stores no amount
of its own.

### 3.2 Smaller model gaps

| Gap | Fix | P |
|---|---|---|
| Account type decides nothing about usage | `AccountType.canFundSpending()`; LOAN/INVESTMENT can't be the source of an EXPENSE; CARD/LOAN stay valid transfer destinations | P0 |
| Loan payments not individual | Use the existing `LoanPayment` table: a settled LOAN-sourced instance writes one row, so paid periods become fact, not "the date passed" (B4.3) | P1 |
| Loan account balance static | Derive it from the loan's outstanding today in the balance calculator (B1.5) | P0 |
| Goal funding single-link | `linked_investment_id`, or better, fund through §3.1 GOAL rules and holdings | P1 |
| Merchant never captured | Fill `merchant` from a normalised description; add a `description_memory` lookup (derived from the Ledger at read time, no table needed at this scale) | P1 |
| Insight dismissals | New table `insight_state(user_id, insight_key, status DISMISSED/SNOOZED, until)` — user state, not a derived value | P1 |
| Value provenance | Shared `Provenance` enum: `USER · CALCULATED · ESTIMATED · IMPORTED · VERIFIED`, used on the response fields that matter (loan terms, balances, goal targets, bill amounts). `BalanceConfidence` and `LoanConfidence` map onto it; no migration for existing columns | P1 |
| Percent convention | All percentages as fractions in the API (`0.4164`), formatted client-side; migrate `progressPercent` behind a new field name, then retire the old one | P1 |
| Auth / tenancy | Security in `CurrentUserProvider` (ADR-0005 seam) | P3 (launch gate) |

---

## 4. Deliverable 4: screen-by-screen redesign

Rule applied throughout: **one job per screen; the insight engine does the ranking; details open on a click.**

### Today — "Can I spend today, and is anything about to go wrong?"

| | |
|---|---|
| **5-second read** | Room left today, and whether anything needs you |
| **Visible** | Room left (hero) · Real Balance with its derivation one line down · Needs you (max 3) · Next 7 days |
| **Hidden (one click)** | Full derivation · all insights · 30-day timeline |
| **Calculated** | Room, cover per bill, tightest day, goal pace |
| **Remove** | Goal card as a separate block. It becomes one Needs-you item when it's the top insight, so there aren't two "attention" blocks |
| **Add** | "Salary ₹57,700 lands in 3 days" line when the cycle ends within 5 days |
| **Primary CTA** | Add transaction |

### This Month — "What is happening with my money this month?"

```
SNAPSHOT     (illustrative figures)
             Expected in ₹57,700 · Committed ₹43,435 · Planned savings ₹12,500 · Flexible ₹1,765
             Spent so far ₹X of flexible · cycle 45% gone          (pace, never "over budget")
ATTENTION    ≤ 5 insights for MONTH, ranked       (overdue · shortfall · large payment next week)
OPPORTUNITIES ≤ 3                                  (EMI ends in Dec · goal ahead · surplus)
PLAN         By category / by when  (as built)
SPENDING     Flexible by category, vs your usual from cycle 3
[Close cycle] when ended
```

| | |
|---|---|
| **5-second read** | The month's structure, and whether it's holding |
| **Remove** | The separate "Needs you" zone (becomes Attention); the overview's four equal stat blocks (becomes the one Snapshot line) |
| **Primary CTA** | + Add a bill · Settle (per row) |

### Ledger — "What actually happened, and is it all recorded?"

| | |
|---|---|
| **5-second read** | Today's and this week's entries; anything unlinked |
| **Visible** | Day groups · filters · Add · Import |
| **Add** | Import screen (upload → review with duplicates flagged → commit); in-form chips for category, account and "link to bill"; "Looks recurring → add as bill" row insight |
| **Primary CTA** | Add transaction |

### Money (Accounts · Cards · Debts · Investments as tabs) — "What do I own and owe, and is it right?"

| | |
|---|---|
| **5-second read** | Net worth with confidence; which balance needs checking |
| **Visible** | Net worth + direction · Needs a look · each register as a ruled list |
| **Debts tab lead** | Debt-free date · next EMI to end and ₹/month it frees · costliest debt |
| **Cards tab lead** | Next bill amount and due date per card |
| **Investments tab lead** | Invested · value · monthly contribution (from rules) |
| **Primary CTA** | Check balances (reconcile) |

### Goals — "Am I on course for what I'm saving towards?"

| | |
|---|---|
| **5-second read** | Each goal: amount / target · ETA at current contribution |
| **Add** | "Fund it monthly" in the goal form (creates the GOAL rule) · suggested emergency-fund target (6 × must-pay) |
| **Primary CTA** | Add goal |

### Onboarding — "Show me my month in two minutes"

1. Salary amount + pay day + account.
2. Main bank balance (others optional).
3. "What leaves every month?" as chips (Rent, EMI, Credit card, SIP, Family, Insurance), each opening the real form.

Then show the **Snapshot line** immediately, followed by a checklist ("Add your credit card", "Add loan details for a debt-free date").

---

## 5. Deliverable 5: intelligent form design

Pattern for every form:
- **Essential inputs** (3–5 fields).
- A **live "what we worked out"** block with a provenance tag on each value: `calculated` / `estimated` / `yours`.
- **"Add more details"**, collapsed.
- A typed value is **never overwritten**. When the calculation disagrees, show "Use ours / Keep yours" (already built for loans; generalise it).

| Form | Essential | Optional (more details) | Calculated / suggested | Validation | Override behaviour |
|---|---|---|---|---|---|
| **Add loan** | Lender, outstanding, EMI, EMI day, pay-from | Rate, original amount, tenure, disbursed on, first EMI, rate type, note | EMIs left (from rate) or rate (from EMIs left) · payoff date · remaining interest · "add EMI to plan" (default on) | EMI > monthly interest; outstanding ≤ original; day 1–28 | Built (Use these / Keep mine); extend to remaining interest |
| **Add bill** | Name, amount (or varies), day, leaves from | Category (suggested from name), must pay, why, if skipped, start, last payment, frequency | Category from name memory; last payment from linked loan; "looks like a card payment" warning (B3.3) | Card-payment guard; day 1–28 | Sourced fields show "from Bike loan" and are read-only unless unlinked |
| **Add transaction** | Amount, description | Account, category, date, note, merchant | Account + category from description memory; type from account/category; "pays Electricity bill?" link chip | Account usage (P0); date not in future beyond today+30 | Chips never auto-apply below high confidence (seen ≥3 times, same result each time) |
| **Add credit card** | Name, limit, statement day, due day, owed today | Network, last four, pay-from | Next statement and due date; utilisation | Owed ≥ 0; days 1–28 | n/a |
| **Add investment** | Type, name, monthly amount + day (if SIP/RD) *or* value | Account, pay-from, invested so far, liquid | Contribution rule (default on); valuation age | Amount > 0 | n/a |
| **Add goal** | Name, target, date | Priority, funding account, monthly contribution | Suggested emergency-fund target; required/month; ETA at chosen contribution | Date in future | Target suggestion is only a pre-fill |
| **Income (new)** | Amount, day, account | Other income lines, variable flag | Expected per cycle | Amount > 0 | Actual replaces expected |
| **Update balance** | Balance / owed now, as of | Confidence | Difference vs Kosh ("₹1,240 missing, add as entry?") | Not future | n/a |

---

## 6. Deliverable 6: insight engine

A backend package `insight`. It is derived at read time (ADR-0011); only the user's
dismiss/snooze state is stored.

```java
record Insight(
    String key,              // stable: "shortfall:account:4:cycle:3" - de-dup + snooze
    InsightType type,        // SHORTFALL, OVERDUE, LARGE_PAYMENT_SOON, EMI_ENDING, GOAL_BEHIND,
                             // RECURRING_CANDIDATE, SPEND_ABOVE_USUAL, STALE_BALANCE, IDLE_CASH,
                             // CARD_BILL_DUE, INCOME_LATE, EMERGENCY_FUND_LOW ...
    Severity severity,       // CRITICAL (money bounces/fees) · ATTENTION · OPPORTUNITY · INFO
    Confidence confidence,   // HIGH (from facts) · MEDIUM (from estimates) · LOW → never shown
    String title,            // what is happening      "IDBI won't cover 5 Oct"
    String explanation,      // why it matters + basis  "₹17,290 leaves; it holds ₹709 (matched 27 Sep)"
    Money impact,            // rupee size, for ranking
    LocalDate when,          // urgency, for ranking
    List<EntityRef> refs,    // account:4, commitmentInstance:31
    SuggestedAction action,  // TRANSFER(prefill) · SETTLE(id) · ADD_BILL(prefill) · OPEN(route)
    Set<Surface> surfaces    // TODAY, MONTH, LEDGER, MONEY, GOALS, CLOSE
) {}

interface InsightRule { List<Insight> evaluate(FinancialContext ctx); }
// FinancialContext: built once per request - position, cycle, instances, projections,
// loans, cards, goals, history aggregates. Rules never query on their own.
```

- **Ranking:** score = severity weight × urgency (days to `when`) × impact (log rupees). LOW confidence is dropped. Each surface has a cap (Today 3, Month 5 + 3 opportunities).
- **Noise control:**
  - One insight per `key`.
  - Snooze (7 days / until next cycle) and dismiss (until the facts change: the key includes a hash of the triggering values).
  - No insight without a basis sentence.
- **API:** `GET /insights?surface=TODAY` and `POST /insights/{key}/snooze|dismiss`.
- **Frontend:** one `InsightList` component. NeedsYouCard, NeedsALookZone, DebtsNeedsALook and GoalPaceCard become renderers of it, not rule owners.
- **Tests:** one test per rule on a hand-built `FinancialContext` (pure, fast), plus one integration test for ranking and snooze.
- **Voice:** facts and consequences, never verdicts ("₹3,200 above your usual", never "you overspent").

---

## 7. Deliverable 7: roadmap

| Phase | Feature | User value | Business value | Complexity | Depends on | Tier | Why this phase |
|---|---|---|---|---|---|---|---|
| **1 · Trust** | Obligation sources (loan/investment/goal → bill; settle by transfer/investment) | Enter once; Free is right | Fewer abandoned setups | M | none | Free | Every later insight reads obligations |
| 1 | Expected income | Month structure from day 1 | Onboarding "aha" | S–M | Obligation sources (same rule shape) | Free | Snapshot needs it |
| 1 | Account usage rules, optional-bill decision, loan balance derived, percent convention, 404 mapping | Numbers are right | Trust | S each | none | Free | Correctness before polish |
| 1 | Browser smoke tests (Playwright) for the core paths; runnable Postman on an isolated DB | No silent regressions | Velocity | S–M | none | n/a | Fundamentals |
| **2 · Intelligence** | Insight engine + migrate the four hand-built warnings | Fewer, better alerts | Core of retention | M | Phase 1 | Free (basic rules) | The reusable layer |
| 2 | Description → category/account memory; link-to-bill chips | Faster entry | Daily habit | S | none | Free | Reduces effort |
| 2 | Import screen (CSV backend exists) | Hours saved | Activation | M | none | **Premium** (Free: 1 import/month) | Big effort saver |
| 2 | Recurring detection → "add as bill" | Bills set up for you | Retention | M | Import or 3 cycles of data | Premium | Needs history |
| 2 | Pace, then baseline ("above your usual") | Understands normal | Year-two value | M | History | Pace Free · Baseline Premium | Compounds with time |
| **3 · Planning** | Debt intelligence: remaining interest, costliest-first, prepay simulator, EMI-release calendar and opportunities | Decisions with numbers | Differentiator | M | Phase 1 | Premium | Rung 4 (Decide) |
| 3 | Emergency fund: months covered, suggested target, contribution ETA | Clear safety picture | Trust | S | Obligation sources | Free | Basic financial hygiene |
| 3 | Decide (what-if) simulator — `PRODUCT_STRATEGY` §4 | "Can I afford X?" | Strongest paid reason | L | Insight engine + forecast | **Premium** | Needs everything below it |
| 3 | Cycle-end forecast and tightest day | Early warning | Retention | M | Income + obligations | Free | Anticipate rung |
| **4 · SaaS** | Auth, tenancy enforcement, billing, export, account deletion, backups, privacy policy | Safe to trust with data | Can charge | L | none | n/a | Launch gate |
| 4 | Reports (yearly, tax-season summary of EMIs/insurance/investments) | Paperwork done | Paid value | M | History | Premium | Uses accumulated data |
| 4 | Household (two cycles, shared goals) | Couples | Higher tier | L | Auth | Household tier | `BUSINESS_MODEL` §3 |
| **5 · Automation** | Email statement parsing, SMS (Android) import, Account Aggregator (RBI AA) | Near-zero entry | Scale | L–XL | Import pipeline, compliance | Premium | Needs trust + legal |
| 5 | Reminders (email/push) for bills, statements, stale balances | Nothing missed | Re-engagement | M | Insight engine | Free (basic) | Channels on top of insights |

**Free vs premium principle:** Free makes the user's own money *correct and legible*
(Real Balance, bills, basic insights). Premium *saves time and answers decisions*
(import, recurring detection, baselines, debt planning, Decide, reports). No correctness
feature is ever paywalled.

---

## 8. Deliverable 8: implementation plan (small, safe increments)

Each increment ships on its own with:
- tests;
- `tsc`, the build, and the Postman update;
- a live check on ZZ records;
- a handoff update.

Increments that touch real data first take a `mysqldump` of the affected tables.

**Status (2026-09-17):** 1-6 done and verified (✓). Actual migrations: V16 (source columns +
`settle_as`) and V17 (`to_account_id`), so every later V-number below is one higher than
planned. Progress is tracked in `docs/CONTINUE_HERE.md`.

| # | Increment | Backend | DB | API | Frontend | Tests | Regression risk |
|---|---|---|---|---|---|---|---|
| **1** ✓ | Account usage rules (**already enforced** by `TransactionType.acceptsSource`; no `canFundSpending` or new error code was needed) | `AccountType.canFundSpending()`; checks in `TransactionServiceImpl` + import commit | none | 422 `ACCOUNT_CANNOT_FUND_SPENDING` | Hide LOAN/INVESTMENT as source in the transaction form | Unit + integration; existing money tests | Existing bad rows: report only, don't mutate |
| **2** ✓ | Decide optional bills | If "include": `PositionServiceImpl` subtracts all open instances; breakdown lists optional separately | none | `PositionBreakdown.optionalCommitted` | Today derivation line "of which optional ₹X" | Position tests | Free drops by the optional total. Needs your decision |
| **3** ✓ | Obligation sources, part A: loans | `Commitment.sourceType/sourceId`; LOAN-sourced amount/day/end read from the loan; timeline skips a loan's own EMI when a linked rule exists; card-paid loan rule leaves from the card | V16: 3 nullable columns | Create/Update commitment accept source; loan create `addToPlan` | Add loan: "Add EMI to plan" (on); bill row shows source | Generation, timeline de-dup, card case | Your 3 EMI bills already exist: offer "link to Bike loan" instead of auto-linking |
| **4** ✓ | Obligation sources, part B: settle by TRANSFER / INVESTMENT; goal and investment sources | `settle` + `CommitmentAutoMatcher` by type; `settle_as` | V17: `settle_as` | Settle request `type` | Settle sheet "Moved to an account" / "Invested" | Must-have: counted once; invested not spent | Emergency fund and SIP bills: link, don't recreate |
| **5** ✓ | Expected income (no migration needed: `settle_as = INCOME` from V16) | Income rule (direction IN) + matcher for INCOME; `CycleStanding` uses expected until actual | V18: `direction` | Settings or bill form with direction | Onboarding step + Snapshot line | Expected replaced by actual, never added | Salary auto-match window |
| **6** ✓ | Month Snapshot (built as `GET /cycles/{id}/shape` + `MonthShape` strip: "snapshot" already names the frozen record Month close takes) | Snapshot DTO (expected in, committed, planned savings, flexible, spent, pace) | none | `GET /cycles/{id}/snapshot-live` | This Month header replaced | Snapshot maths | Visual only |
| **7** ✓ (2026-09-18, without insight_state) | Insight engine core + 4 rules (shortfall, overdue, card bill due, goal behind) | `insight` package, `FinancialContext` | V19: `insight_state` | `GET /insights`, snooze, dismiss | `InsightList`; Today and Month use it; old components become renderers | Per-rule units; ranking | Behaviour parity with today's warnings first |
| **8** | Loan intelligence | Remaining interest, costliest order, freed-cash calendar; EMI_ENDING and OPPORTUNITY rules | none | Loan response + `GET /loans/releases` | Debts lead block; Month opportunities | Amortisation to the paisa | Rate-unknown loans show "needs a rate" (INCOMPLETE) |
| **9** | Entry memory + link chips | Description memory query | none | `GET /transactions/suggest?description=` | Chips in Add | Confidence threshold | None: suggestions only |
| **10** | Import screen | Existing `/imports` | none | (exists) | Upload → review → commit | Duplicate detection (existing) | Real-data import: dry run first |
| **11** | Recurring detection | RECURRING_CANDIDATE rule | none | via insights | "Add as bill" pre-filled | Detection on seeded history | False positives, so MEDIUM confidence at most |
| **12** | Emergency fund + goal contribution ETA | `mandatoryTotal`; ETA from GOAL rule | none | Goal response `eta`, `monthsCovered` | Goals rows; suggested target | ETA maths | Depends on increment 4 |

Later (Phase 3+): Decide simulator, forecast/tightest day, baselines, reports, then the SaaS launch gate.

---

## 9. Decisions needed from you

1. **Optional bills and Free.** Should a planned bill marked "Must pay = No" reduce Free until it's paid or skipped?
   - **Recommended: yes.** The derivation line shows "₹X of this is optional", and the user can skip an optional bill for the month to release the money.
2. **Obligation sources before insights.** Do increments 3–5 (enter-once) first, before any new visible intelligence?
   - **Recommended: yes.** Every insight in the brief reads those relations, and your 28 Sep start benefits most from correct Free.
3. **Your existing duplicate bills** (Bike, Education and Coding Ninjas EMIs; SIP; Emergency fund). Once increment 3 lands, how should they be joined to their loans and holdings?
   - **Recommended: link them** through a one-click "this is the Bike loan's EMI" prompt, not by recreating them, so history is kept.
4. **Navigation consolidation to five items** (P2). Now, or after Phase 2?
   - **Recommended: after.** It's cosmetic next to the engine work.
5. **SaaS gate timing.** Auth and billing are only needed once a second user exists.
   - **Recommended:** keep them in Phase 4 and keep ADR-0005's seam.
