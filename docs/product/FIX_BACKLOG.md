# Fix backlog

Known problems and missing pieces found while setting up real data for October 2026, parked
until the base is stable. Each entry says what's wrong, what it costs the user, and the
proposed fix, so it can be picked up cold.

Started 2026-09-14. When you fix one, delete it here (the code and git history record the
fix) or move it to **Done** with the date.

**This file is for defects and missing capability.** A problem where the product behaved
*correctly* but the experience was wrong — a step easy to miss, a warning that fires for a
legitimate case — belongs in [`USAGE_ISSUES.md`](USAGE_ISSUES.md), which is collected in
real use and solved as one pass. Cross-reference between the two; never copy an entry.

---

## 1. Correctness: numbers the user sees are wrong

### 1.20 An auto-matched EMI never reached its loan — 🔨 **fixed forward 2026-11-09; backfill needs the user**

**Seen** on `/momentum` 2026-11-09: *"8 EMIs have fallen due with nothing recorded"* - while the
user had paid every one. Bike, Education and Coding Ninjas each showed 2 unrecorded EMIs
(Oct + Nov); only the card EMIs (settled through the Settle sheet) had reached their loans.

**Cause.** `CommitmentAutoMatcher.link` - the path taken when a bank debit is recorded as an
expense and matched to the bill - set the instance PAID and stopped. The manual path,
`CommitmentInstanceServiceImpl.settle`, also writes a `CommitmentInstancePayment` row and calls
`LoanPaymentRecorder.record` (ROADMAP 1.2). So every bank-paid EMI marked the bill paid while
the loan's outstanding, net worth, the debt-free curve and Momentum all believed it unpaid.

**Fix (forward).** `link` now writes both records under the same conditions as `settle`.

**Backfill.** `POST /loans/{id}/reconcile-payments` (`commitment/LoanPaymentReconciler`) rebuilds
loan payments from PAID instances of the loan's EMI commitment and their linked transactions.
Idempotent. **Not yet run - it writes real data, so the user approves it.** Expect net worth
and each loan's outstanding to drop by the principal part of six bank EMIs.

**Not backfilled:** `commitment_instance_payments` rows for old auto-matched instances. Only
part-payment history reads them; old auto-matches were full payments, so nothing visible.

### 1.17 "Free this month" shows an income figure the user will not recognise

Found 2026-11-01 while rebuilding Today. The note under "Free this month" reads
*"₹1,05,733 in · ₹50,391 committed · ₹42,500 set aside"*, and the first figure is not
anything the user thinks of as their income. It is `CycleShape.expectedIn`, which sums
**every** INCOME transaction in the cycle: salary ₹57,700 + Diwali bonus ₹46,000 + a
₹1,736 withdrawal from an NJE-wealth SIP + ₹297 recorded as "Unexplained part of the
credit".

The arithmetic is right (105,733 − 50,391 − 42,500 = 12,842) and so is counting a bonus
as income. Two things are not:

- **A SIP withdrawal is not income.** Moving money out of a holding into a bank account is
  a transfer between two things the user already owns; recorded as INCOME it inflates both
  "what came in" and "free this month", and double-counts against the investment's own
  fall in value. Worth checking whether the *transaction* is miscategorised or whether the
  shape calculator should exclude income whose counterparty is the user's own holding.
- **A single unlabelled total cannot be checked.** Four sources behind one number with no
  way to see them is exactly the thing the Pulse was rebuilt to stop doing. It wants the
  same `Provenance` treatment `runway` and `debt` already have, so the row can show its
  own working.

**Cost:** low and contained while it sits inside Today's collapsed *Standing* section, which
is where it moved on 2026-11-01. It is the lead figure on **Months**, though, where the same
note is unexplained and far more prominent.

---

### 1.18 A credit card can sit in credit, and nothing anywhere says so — 🔨 **built 2026-11-05, not yet observed firing**

**Found 2026-11-04**, from a real correction that went wrong in the user's own data. It is
the clearest defect this product has shipped, because the app held an **impossible figure**
for hours and every screen reported it calmly.

What happened: the card bill (₹21,430) was paid as a transfer from HDFC Salary, but only
₹9,019 of the charges behind it had been recorded. The card's balance went **positive — a
credit of ₹12,411**. Money, Cards and the Pulse all displayed it without comment. Net worth
counted it as an asset.

A credit card cannot owe you money. Where the balance is positive, exactly one of two things
is true and both are worth saying:

- a charge is missing — the bill covered purchases never entered, or
- the payment was larger than the card's recorded debt.

**Built 2026-11-05:** `insight/rules/CardCreditBalanceRule.java`, plus
`InsightType.CARD_IN_CREDIT` and the matching member of the frontend's `InsightType` union.
`CreditCardView.outstanding()` is already `-balance(card)`, so the whole test is
`outstanding().signum() < 0`. No schema, no new query, no new endpoint — it joins the
existing `/insights` payload. Severity ATTENTION, undated, ranked by the size of the credit;
action opens the card. Backend `test-compile` and frontend `tsc` + `vite build` all clean.

**Not yet observed firing.** The user's card was corrected to ₹0 before the rule existed, so
there is no credit balance left to raise it, and manufacturing one means writing a bad row to
real data. It needs a backend restart, and then either the next real occurrence or a
deliberate ₹1 overpayment that is deleted straight after.

**Wording is "nearly always", not "impossible", on purpose.** A card really can sit in credit
— overpay, or take a refund after paying — so the insight names both causes and leads with
the likelier one. Telling someone their refund is an error is how a warning gets dismissed,
and the dismissal would carry to the case that matters.

**Why this one first.** It is not a better warning about a known risk; it is a **class of
check the product does not have** — *this figure is impossible*, as distinct from *this
figure is concerning*. Others in the same family, worth following it: a bank account below
zero that is not an overdraft, a commitment settled for many times its planned amount, a
goal holding more than its target, a loan whose outstanding rises without a new drawdown.
Each one catches a data-entry mistake at the moment it is made, which is the only moment it
is cheap to fix.

---

### 1.19 Archiving a goal leaves its reservation holding money — 🔨 **built 2026-11-08**

**Found 2026-11-01.** The goal *Bangalore trip tickets booking* was archived on 18 Oct with
a target date of 31 Oct. Both passed. Its ₹3,226 reservation on HDFC Salary stayed live and
kept reducing Real Balance for two weeks — ₹3,226 of ₹6,876, so the day rate read ₹135
instead of ₹255. The user found it by asking why the Add form said money was held back, not
because anything told them.

Archiving a goal is a statement that it is over. Nothing in the write path releases, or even
mentions, the reservation funding it.

**Fix, in order of preference:**

1. **An insight** — *"₹3,226 is still set aside for Bangalore trip, a goal you archived on
   18 Oct."* Derived, no schema, reversible, and it respects the user's own judgement rather
   than deciding for them. `FinancialContext` already carries goals and accounts.
2. Prompting at the moment of archiving — better UX, but it is a write-path change and only
   helps from then on; it does nothing for money already stranded.

Not auto-release: money set aside is the user's statement of intent, and silently undoing it
is the kind of plan rewrite ADR-0015 exists to prevent.

---

**Built 2026-11-08** — option 1, the insight.

- `reservation/StrandedReservation.java` — the finding, carrying a `Reason` because the two
  cases read very differently: a goal **archived** can be named and dated so the reader can
  judge it; a goal **deleted** leaves a reservation pointing at nothing, and the only honest
  thing to say is that nothing explains what the money is for any more.
- `reservation/StrandedReservationCalculator.java` — `@Component`, two user-filtered
  queries: every live reservation, and every goal *including archived* (`findAllForUser`
  with `includeArchived = true`, which is precisely what this needs and what
  `FinancialContext.goals` deliberately excludes). Deleted goals stay out of that query, and
  their absence **is** the `GOAL_GONE` signal rather than a lookup failure to paper over.
- `insight/rules/StrandedReservationRule.java` — ATTENTION, undated, ranked by amount. A
  past archive date in `when` would rank it above every bill still to come, which it should
  never outrank.
- `InsightType.RESERVATION_STRANDED` + the frontend union member;
  `FinancialContext.strandedReservations` wired in `buildContext`.
- Reservations with **no** goal are skipped: "rent I'm holding for a flatmate" answers for
  itself and has no goal to outlive.

**It states the effect and opens the account; it does not offer to release.** The user may
still be saving for the thing and have simply tidied the goal away. The sentence says what
the money is doing — *"it is coming off what's free until salary and off the daily figure.
Release it and it counts again — it stays in the account either way"* — and the action opens
the account where **Set aside → Release** lives.

**Not yet observed firing.** The Bangalore trip reservation that prompted this was released
by the user on 2026-11-01, and the one live reservation today (₹10,001, parked from HDFC
Premium to avoid minimum-balance charges) has no goal attached — so there is nothing stranded
to find. Goal 6 is still archived, so a ₹1 reservation against it would raise the insight and
can be deleted straight after.

---

### 1.15 `PlanAdherence` counts income as a commitment — ✅ **fixed 2026-11-07**

- **Found 2026-10-24**, building Summary, on the real October cycle. `GET /review/months`
  first reported **16 of 17 commitments kept** and a "planned cost" of **₹1,24,722** against
  an income of ₹59,200.
- **Cause:** `PlanAdherence.from` walks *every* `CommitmentInstance` in the cycle and skips
  only `SKIPPED` ones. An income commitment has occurrences like any other, so the salary
  (₹57,700) and the Diwali bonus are counted among "commitments planned", counted again as
  "kept" when they arrive, and their amounts added into `plannedCommittedTotal`.
  ₹1,24,722 = committed ₹39,522 + set aside ₹27,500 + income ₹57,700, exactly.
- **What it costs:** the North Star — *commitments kept* — is inflated by the one thing that
  was never a promise the user makes. A salary arriving is not an act of discipline.
- **Where it leaks:** `CycleServiceImpl.close` writes both figures into `CycleSnapshot`,
  which is **immutable by design** (ADR-0011's one exception). Every month closed before this
  is fixed records the wrong count permanently.
- **Not fixed here, deliberately.** Summary filters income occurrences out for itself
  (`ReviewServiceImpl.billsOnly`, on `settleAs == INCOME` alone, so it needs no account lookup
  and stays clear of 1.11's open question). Changing what `close` *stores* is a decision about
  a historical row, not a side effect of building a report.
- **Fixed 2026-11-07, before any cycle was closed** — so there is nothing to restate, which
  was the whole reason this had a deadline.
  - `PlanAdherence.billsOnly(instances, commitments)` is now the one implementation, and
    `PlanAdherence.from` **requires** the commitments. There is no overload that skips the
    filter, so the unfiltered call does not compile and a later caller cannot reintroduce
    the bug by forgetting it. The divergence was possible because the filter lived in the
    caller; it now lives where the arithmetic does.
  - `CycleServiceImpl.close` gained `CommitmentRepository` (a repository, not a service —
    no bean cycle through `PositionService`) and passes the rules behind the cycle's
    occurrences.
  - `ReviewServiceImpl.billsOnly` now delegates rather than duplicating; its local
    income-id set is gone, along with the `java.util.Set` import.
  - `MonthReview`'s javadoc no longer describes the defect as open.
  - Backend `test-compile` clean. **Behaviour on the Summary path must not change** — it was
    already filtered — so `/review/months` reading identically after a restart is the
    regression check, not a non-result.

### 1.16 `formatPercent` prints a hyphen, not a true minus — ✅ **fixed 2026-11-08**

- **Found 2026-10-24** on Summary: a negative savings rate renders **`-10%`** with
  `U+002D`, beside figures that correctly use `U+2212` (`Amount` via `splitMoney`).
  `DESIGN_SYSTEM.md` §3 "Number craft" requires the true minus.
- `Intl.NumberFormat`'s percent style emits the hyphen; `formatMoney` already replaces it
  and `formatPercent` does not.
- **One line in `lib/money.ts`**, but it changes output on six existing call sites
  (Investments ×3, Months ×2, Summary), so it is logged rather than slipped into an
  unrelated change.

### 1.14 A settled card bill kept nagging in Needs you — ✅ **fixed 2026-10-08**
- **Found by the user**, 2026-10-08: *"from months I have already settled the credit card bill
  or emi's of it but on months under needs you it appears again"*. They were right, and the
  settlements were not at fault.
- **All four card items were correctly `PAID`** — Antropic ₹2,373 · MOM - Mobile ₹2,648 ·
  Health Insurance ₹3,998 · EMI - Processing fees ₹1,548 = **₹10,567**, the statement to the
  rupee.
- **Cause — `CardBillRule` silenced itself on one condition only:** `statement.status == PAID`.
  A statement reaches `PAID` when money arrives **in the card account**. The user settles the
  card's items individually from their bank (the model agreed 2026-10-04), so nothing ever lands
  on the card, `remaining` stayed ₹10,567, and the rule warned daily — and would have escalated
  to `CARD_BILL_OVERDUE` / **CRITICAL** on the 10th.
- **The contradiction that names the bug:** the statement claimed ₹10,567 owed while the card's
  own ledger balance was **₹0** (`cardDues 0.00`). Kosh was warning about a debt its own
  postings said did not exist.
- **Fix:** the rule now also requires `card.outstanding() > 0` — `-balance(card)`, what the card
  owes according to its postings. Both sources must agree before it speaks.
- **The trade-off, taken deliberately.** Someone who records statements but never records the
  charges behind them now gets **no** warning. That was the long-open *"an unbacked card
  statement"* question in `CONTINUE_HERE`; it is answered the same way ADR-0018 and ADR-0020
  answer theirs — a figure is true because an entry says so, not because it was typed into a
  form. **An unbacked statement is not evidence of a debt**, and warning on one trains the
  reader to dismiss the warning that matters.
- **Verified on live data:** insights **9 → 8**, no `CARD_*` rule fires, and the shortfall and
  due-soon rules are untouched. **Not verified:** the positive case (a card with charges
  recorded still warns) — no such data exists and writes are not run from here.

### 1.12 Every relative date ran a day fast after 17:30 IST — ✅ **fixed 2026-10-03**
- **Found by the user**, 2026-10-03 at ~21:20: *"I think our application is running 1 day
  further … it says tomorrow but tomorrow is 4 and its sunday"*, on the Months plan band
  **"Tomorrow · Mon, 5 Oct · 3"**.
- **Cause — `lib/dates.ts` `daysBetween`:** it compared a **date** with an **instant**.
  `new Date('2026-10-05')` is **UTC** midnight, the default `toIso` was
  `new Date().toISOString()` (a wall-clock time), and the fractional difference was then
  `Math.round`ed. So the answer drifted with the time of day. In IST (UTC+5:30) it tipped at
  **17:30 local**: before that 5 Oct was 2 days away, after it 1.
- **It was not one label.** Every caller passes a date-only string and takes the default, so at
  21:23 on Sat 3 Oct: 4 Oct read *"Today"*, 5 Oct read *"Tomorrow"*, `ComingUpList`'s "in N
  days" was short by one, and - worst - `PlanZone` uses `daysBetween(...) < 0` for **late** and
  **passed**, so **a bill due that very day was drawn as overdue**, every evening.
- **Fix:** both sides are flattened to **local midnight** before subtracting, so the result is a
  whole number of calendar days in the viewer's timezone. A bare `YYYY-MM-DD` is taken
  literally; a full timestamp resolves to the calendar day that instant falls on for the viewer.
  `localIsoDay` already existed in the same file and did exactly this - `daysBetween` simply
  never used it.
- **Verified:** stable at 06:00, 17:29, 17:31 and 23:59 IST; the band now reads
  **"MON, 5 OCT · 3"** with no "Tomorrow", and every weekday label is right.

### 1.13 "Days to salary" meant two different things on two screens — ✅ **fixed 2026-10-03**
- **Found while verifying 1.12.** Months' cycle band read **"24 days to salary"** while Today
  read **"25 days to salary"**, on the same data. Today's came from the server; the band
  computed its own.
- **The server is right.** `daysToSalary` counts **today**, because it is the divisor behind
  `perDay = realBalance / daysToSalary` (₹3,867 ÷ 25 = ₹154.68). The band used
  `cycleProgress.daysRemaining`, which counts to `endDate` - but **salary lands the day after
  the cycle's last day**, so on 3 Oct with salary on the 28th, "24 days to salary" was simply
  wrong about its own label.
- **Fix:** `CycleProgress` gained `daysToSalary` (`daysRemaining + 1`) with the server's
  meaning, used by `CycleBand` and `MonthCrux`. The amber tone still turns on `daysRemaining`,
  so it starts warning on exactly the day it always did.
- **Verified on screen:** band *"day 6 of 30 · 25 days to salary"*, crux *"On track for the
  next 25 days."*, Today *"Spread evenly over the 25 days to salary."* - all three agree.

### 1.11 Making Cash wallet spendable silently moved ₹15,000 into "set aside"
- **Found by the user 2026-10-03**, hours after they flipped Cash wallet to *"Yes - day to
  day"* on Claude's advice (U4): *"the set aside this month figure is 27500, I think its
  considering 15k top up too. this month we actually parked 12500 right"*. They are right, and
  the flip is what changed it.
- **Cause — `CommitmentBucketClassifier.classify`:**
  ```java
  if ((kind == INVESTMENT || kind == TRANSFER)
          && !accountService.getByIdIncludingDeleted(commitment.getAccountId()).countsAsSpendable()) {
      return CommitmentBucket.NEITHER;
  }
  ```
  The Emergency fund top-up's planned account **is Cash wallet**. While that account was not
  spendable the guard fired and the bill was `NEITHER` — outside `plannedSavings`. Now that it
  is spendable the guard does not fire, the TRANSFER branch sees a non-spendable **destination**
  (HDFC Premium), and it becomes `SET_ASIDE`.
- **The composition, which confirms it exactly:** ₹10,000 Emergency fund contribution +
  ₹2,500 SIP Zerodha + **₹15,000 top-up** = ₹27,500. Without the top-up: ₹12,500, the user's
  figure.
- **It is the same defect as 1.8 and 1.9, in a third place:** a derived figure reading
  `commitment.getAccountId()` — the **plan** — as though it were a fact.
- **And a new one worth naming on its own: an account setting silently rewrites history.**
  `countsAsSpendable()` is read live, so changing one checkbox restates `plannedSavings`,
  `committed` and `flexible` for **every cycle, including closed ones**. Nothing warned, and
  nothing records that the figure changed or why.
- **Neither ₹12,500 nor ₹27,500 is actually right, and that is the real finding.** The equation
  is `expected in − committed − set aside = flexible` — income is a **flow**, but ₹9,500 of the
  top-up was a transfer of **stock** (cash already in hand, deposited 30 Sept), and only
  ₹5,500 came from this month's salary. Subtracting a stock movement from a flow gives a number
  that is neither; it is what drives *Free this month* to −₹9,436 and overstates the squeeze.
- **Confirmed against live data 2026-10-03** (`GET /cycles/3/shape` → `plannedSavings 27500.00`,
  `flexible -9436.00`), and the three SET_ASIDE bills reproduce it exactly: EF contribution
  ₹10,000 (HDFC Salary→Premium) · SIP ₹2,500 (IDBI, INVESTMENT) · **EF top-up ₹15,000
  (Cash wallet→Premium)**. Only the third depends on the flipped flag.
- **⚠ The ₹18,000 figure below was wrong, corrected 2026-10-03.** It assumed the ₹9,500 cash
  leg could be treated as "already set aside", but that depends on Cash wallet's spendability
  **at the time of the transfer**, and nothing stores historical spendability. Under what is true
  now - the user has declared that cash to be spending money - moving ₹9,500 of it into the
  emergency fund **is** setting money aside. **₹27,500 is arithmetically correct**, and fixing the
  classifier to read evidence instead of plan would return ₹27,500 too. The remaining defect is
  narrower than first written: not that the figure is wrong, but that **it moved retroactively
  when a checkbox changed, with no warning and no record**.
- **The split, kept for reference:** the top-up's ₹15,000 was
  **₹9,500 stock** (txn 85, from Cash wallet, 30 Sept — cash held before the cycle began) and
  **₹5,500 flow** (txns 88, 94, 96, all HDFC Salary). So set-aside *out of this month's income*
  is ₹10,000 + ₹2,500 + ₹5,500 = **₹18,000**, and flexible would be **−₹3,936**, not −₹9,436.
  The user's ₹12,500 understates it; the current ₹27,500 overstates it by the whole stock leg.
- **Not fixed — needs a decision**, and it touches Months and the forecast, not only Today.
  Options: (a) classify from the **account actually paid from**, consistent with ADR-0020 —
  makes this case ₹27,500, so it does not give the user what they expect; (b) treat a transfer
  whose source is a holding of pre-existing cash as `NEITHER` regardless of spendability —
  needs a way to say which money is stock — **V23's payments table now supplies it**, so this
  is implementable: classify each *payment* by the account it actually left, falling back to the
  plan for the unpaid remainder, exactly the ADR-0020 pattern; (c) accept ₹27,500 as correct now
  that the cash is declared spendable, and explain the equation. **Ask before building any.**
- **The catch with (b):** `CommitmentBucketClassifier` is deliberately shared by `CycleShape`,
  `CycleReview` and `ForecastService` — *"one rule engine, not three that could drift apart"*.
  For the forecast it is a no-op (future instances have no payments). For `CycleReview` it would
  **restate closed cycles**, which is the same history-rewriting problem this entry opens with.
  Decide what a closed cycle is allowed to do before changing the shared classifier.

### 1.10 A monthly contribution cannot be stopped by clearing the field — and the hint tells you to
- **Found 2026-10-03**, when the user said they will stop the ₹1,000/month into **RD - Mom**
  (investment 5).
- `EditInvestmentSheet.tsx:97` builds the body as
  `...(values.monthlyContribution ? { monthlyContribution: values.monthlyContribution } : {})`.
  An emptied field is falsy, so **the key is omitted**, and `UpdateInvestmentRequest`'s contract
  is *"`null` means leave unchanged"* — so the old ₹1,000 survives a save that reported success.
- **The form instructs the failing action.** The row's hint reads *"What goes in each month, if
  it's a SIP or an RD. **Leave it empty for a one-off holding.**"*
- **Workaround that does work: type `0`.** `'0'` is a truthy string so the key is sent, `AMOUNT`
  (`/^\d+(\.\d{1,2})?$/`) accepts it, and the server's `@PositiveOrZero` allows it.
- **Fix needs a decision, not just a line.** "Leave unchanged" and "clear this" cannot both be
  `null` in a partial update. Either send `0` from the form when the field is emptied (smallest),
  or give the DTO an explicit way to say *clear* — the same question will arrive for
  `contributionDay`, `payFromAccountId` and `statedInvested`, which all have the identical
  pattern on lines 96-99.
- **Also check the display side:** `monthlyContribution: 0` should read as *nothing goes in*, not
  *"₹0 a month"*.

### 1.8 `committed` read the *planned* "Paid from", not the account actually paid — ✅ **fixed 2026-10-03 (ADR-0020)**
- **Found 2026-10-03**, one day after U3 shipped, by asking what the Emergency fund top-up
  had actually done to Real Balance.
- **Cause.** `PositionServiceImpl.leavesHeldMoney` decided whether a bill's outstanding
  belongs in `committed` from `commitment.getAccountId()` — the **plan**. U3 had just stopped
  settlement from enforcing that account, so the plan became a claim nothing checked.
- **Effect on real data.** The top-up plans **Cash wallet → HDFC Premium**, neither spendable,
  so all ₹15,000 stayed out of `committed`. But ₹500 on 1 Oct and ₹500 on 2 Oct were paid from
  **HDFC Salary**, which *is* spendable. ₹1,000 left spending money having never been counted
  as promised: `held` fell, `committed` did not. Real Balance had called that ₹1,000 free.
- **Fix.** Resolve each open instance's source account from its **latest recorded payment**
  (V23's table), falling back to the planned account when there are none. The destination
  stays read from the plan, because `settle` enforces it. Self-correcting: pay the remainder
  from cash and the bill leaves `committed` again.
- **Verified on live data.** `committed` ₹31,523 → ₹36,023, Real Balance ₹3,627 → **−₹873**,
  and `Emergency fund top-up ₹4,500` now appears as a named row in the breakdown. Exactly one
  row was added and none removed, so no other bill's inclusion flipped.
- **Knowingly left inconsistent:** the shortfall insight and `GET /forecast` still project
  from the planned account. See **1.9**.

### 1.9 The shortfall insight projected from the planned "Paid from" — ✅ **fixed 2026-10-03 (M1)**
- **Opened 2026-10-03**, alongside 1.8, which fixed the same disagreement in `committed` only.
- For *which account will run short*, the planned account is arguably the right input — it is
  a statement of intent about a payment that has not happened. But when a bill has been paid
  from somewhere else three times running, projecting the plan warns about the wrong account.
- Live example of the tension: the CRITICAL insight says **IDBI Saving** is ₹14,376 short before
  28 Oct. Two of its three triggering EMIs are planned on IDBI; if the user keeps paying them
  from HDFC Salary, the warning names an account that is never actually used.
- **Fixed for the projection, 2026-10-03.** `ProjectionServiceImpl` no longer asks the database
  for `c.accountId = :accountId`. It takes the cycle's open bills once and groups them by their
  **effective source** — the account of the latest recorded payment, else the plan — through the
  new shared `CommitmentSourceResolver`. Same status filter as the old per-account query, so the
  bill set is unchanged; only the attribution can differ.
- **The forecast was audited and deliberately left on the plan.** It is a *rule* projection by
  design, not blended with actuals, and future instances have no payments to read anyway.
  Recorded in ADR-0020's register.
- **Verified, with an honest caveat:** `GET /accounts/{id}/projection` groups correctly through
  the new path (IDBI 8 bills, HDFC Salary 2, Cash wallet none) and `/position` is unchanged at
  ₹3,867 / ₹31,523. **But no open bill currently has evidence that disagrees with its plan** —
  the two part-paid ones were both paid from the account they plan on — so the live figures are
  identical before and after. The change is right by construction and verified not to regress;
  the case it fixes does not exist in today's data.

### 1.7 Settle → "Already in the Ledger" offers an entry that already settles that same bill
- **Found by the user 2026-10-02**, on the Emergency fund top-up: the ₹9,500 that already
  part-pays the bill is still listed as a linkable entry when settling it again.
- **It is not cosmetic - it double-counts.** `SettleCommitmentSheet` filters candidates by
  account, type, destination and a ±15-day window (`SettleCommitmentSheet.tsx:97-104`) and
  **never excludes entries that are already linked**. The server's guard is
  `existsByLinkedTransactionIdAndIdNot(transactionId, id)` - "does this entry pay a
  *different* bill" - so an entry already linked to *this* instance passes it. Settling with
  it a second time adds the amount again: `confirmedAmount` would go ₹9,500 → ₹19,000 on a
  ₹15,000 bill. **Rule 4, money counted twice.**
- **Fix.** Exclude already-linked entries from the candidate list, *and* tighten the server
  guard to reject a transaction already linked to the instance being settled - the UI filter
  alone is not a rule. The list should also say when it is hiding entries for that reason,
  or an entry the user can see in the Ledger will silently not be offered.
- **Checked 2026-10-02: no bill is over-settled.** The user was offered it and did not take it.
- **Fixed 2026-10-02, but only partly, and the gap is structural.** The server now rejects a
  transaction already linked to the instance being settled, and the Settle sheet drops it
  from the list (saying so, rather than silently shortening it).
  **It cannot be closed completely while `linkedTransactionId` is one column.** An instance
  remembers only its *most recent* link, so after settling with A then B, entry A is
  forgotten and could be offered and re-used again. Closing that needs the join table
  described in `USAGE_ISSUES` **U2** - the same schema change, so do them together.


### 1.6 "Left today" counted a settled bill as day-to-day spending — ✅ **fixed 2026-09-29**
- **Found in real use on the user's second day.** Settling an ₹8,000 Home Support bill made
  Today read **₹462 a day · −₹7,800 left today**, on a day whose only discretionary spending
  was ₹262 of Drinks. The user's first instinct was that their entries were wrong. They
  weren't — every entry was correct and the override worked exactly as designed.
- **Cause.** `PositionServiceImpl.spentOn` summed *every* expense dated today
  (`sumAmountByTypeInRange`), with no regard for whether it settled a planned commitment.
  Room divides Real Balance — which already has every open commitment subtracted — by the
  days left, so a bill paid today was charged **twice**: once when it was planned, once when
  it was paid.
- **It also contradicted the app's own definition.** Months already reports *"spent so far
  outside the plan"* and its flexible-spending figure filters to `FLEXIBLE` categories. Today
  was the one surface counting plan payments as day-to-day spending, so the two screens
  described the same day as ₹262 and ₹8,262.
- **Fixed by** `TransactionRepository.sumUnplannedByTypeInRange`, which excludes any
  transaction an instance links to, and `spentOn` now calls it for both expenses and refunds.
- **Excluded by the link, not by category** — deliberately. Filtering to `FLEXIBLE` would also
  drop a fixed-category expense that no commitment covers, and that one genuinely does come
  out of the day's room. The transactions to exclude are exactly the ones already inside
  `committed`, and the link is what says so.
- `CycleServiceImpl` keeps the old unfiltered sum: its "money out" is every expense, bills
  included, which is what that figure is for.

### 1.5 Net worth doesn't move as loan EMIs are paid — 🔨 **built 2026-11-08**
- **Problem.** Total debt uses the LOAN account balance, which only changes when the loan's
  outstanding principal is edited (V13 re-bases the account then). The loan page's
  "Outstanding today" is derived and does fall as payments are recorded.
- **Cost.** Net worth reads more pessimistic every month until the user edits the loan.
- **Fix.** Derive the loan account's balance from the loan's outstanding in the net worth /
  account balance calculation instead of the opening balance. Nothing stored (ADR-0011).
- **Changed by ADR-0018 (2026-09-21).** The loan's own figure is no longer a calendar guess —
  it now falls only when a payment is *recorded*, which made this fix both safer and more
  valuable: net worth moves on evidence rather than on a date.

**The divergence, measured 2026-11-08 before fixing:**

| Loan | Account balance | Loan's outstanding | Apart |
|---|---:|---:|---:|
| Mobile Mom | 12,600.98 | 10,163.00 | 2,437.98 |
| Health Insurance | 42,701.00 | 39,488.70 | 3,212.30 |
| **Total debt** | **3,40,091.98** | **3,34,441.70** | **5,650.28** |

Both figures print on Today, in the *Standing* panel: *Owed ₹3,34,442* and *Net worth …
₹3,40,092 owed*. Only the two card-paid loans had drifted, because only their EMIs had been
recorded as payments; the bank-paid three will join them as their EMIs land.

**Built 2026-11-08.**

- `loan/LoanOutstandingIndex.java` — `@Component`, loan-account id to what that loan still
  owes. Two queries for every loan, not two per loan: the loans, then
  `findPaidAmountsForUser` batched and grouped here. **Repositories and a stateless
  calculator only** — `PositionService` is reachable from `CycleServiceImpl.close`, so
  anything it depends on must stay clear of the services that depend back on it (CLAUDE.md
  bean-cycle traps). That is also why the arithmetic is duplicated from
  `LoanServiceImpl.toView` rather than called through `LoanService`.
- `PositionServiceImpl.currentNetWorth` reads it for LOAN accounts. **Credit cards keep the
  posted balance** — a card's balance *is* its debt, since every charge posts to it. A LOAN
  account with no loan behind it falls back to the posted balance, which is the old
  behaviour.
- Nothing stored (ADR-0011). No schema. `CycleServiceImpl.close` writes `netWorth` and
  `totalDebt` into the snapshot through the same path, so a closed cycle now records the
  derived figure too.
- **Where it cannot be derived, the stated balance stands** — no rate, or a loan whose own
  figures don't support derived ones. That overstates by whatever principal has been repaid,
  but it is the *same* overstatement as before rather than a new one, and net worth going
  unknown over one unpriced loan would be a worse answer. `loansWithoutTerms` on
  `/financial-state` already exposes the condition; it is 0 for this user.

**Expected after restart:** `netWorth.totalLiabilities` 3,40,091.98 → **3,34,441.70**,
matching `debt.totalOutstanding` exactly; `netWorth.netWorth` −2,42,363.08 → **−2,36,712.80**.
Assets must not move.

---

## 2. Missing capability, requested or implied

### 2.16 A bill's "Paid from" never learns from where the money actually comes — 🔨 **built 2026-11-07**

**Found 2026-11-04**, after the same mistake was made twice a month apart.

*Clothes shopping* (₹12,000, Myntra) and *Credit card remaining* (₹411) are both set to pay
from **HDFC Salary**. Both are actually put on the **HDFC Money back** card. So every month:
the projection holds ₹12,000 aside out of the salary account for a payment that never leaves
it, *Before payday* names the wrong account, and settling books card spending against the
bank. The same three charges were mis-booked in October and again in November.

The app allows settling from an account other than the plan's on purpose —
`SettleCommitmentSheet` says so: *"Paid from is the plan, not a record"*. That is right. What
is missing is that **nothing notices when the plan and the record keep disagreeing.**

**The data is already there.** `CommitmentInstanceView.settledFromAccount` is documented as
*"where the money actually left from, when that is not the bill's own account; null when they
agree"* — computed today, used for display, and never reasoned about.

**Fix:** a rule that reads it. When a bill's last two or more settlements came from the same
account, and it is not the planned one, say so and offer to update the rule:

> *Clothes shopping is planned from HDFC Salary, but the last 2 payments came from HDFC Money
> back. Update the plan?* — **[Change to HDFC Money back]**

**Why this is the intelligent one.** Every other warning in the engine fires on a threshold
someone chose. This one learns the user's actual behaviour and offers to correct the plan to
match it — the plan stops being something you maintain and starts being something that keeps
itself honest. It is also the only fix here that would have prevented the November repeat of
the October mistake.

**Related, same cause, cheaper:** warn in the Settle sheet when the chosen *From* account is a
different **kind** from the plan's — a bank where the plan says a card, or the reverse. That
catches the first occurrence; the rule above catches the pattern. **Not built.**

---

**Built 2026-11-07.**

- `commitment/PlanAccountDrift.java` — the finding: the bill, both accounts, how many
  payments in a row, and when the last one was.
- `commitment/PlanAccountDriftCalculator.java` — a `@Component` in the
  `GoalWithdrawalCalculator` mould, so rules stay pure and never query. One
  `findTop6ByCommitmentIdAndUserIdOrderByDueDateDesc` per bill (an existing finder, bounded
  by the cycle's own commitments) and **one** batched `settlementFactsByIds` for every
  payment behind them.
- `insight/rules/PlanAccountDriftRule.java` — ATTENTION, undated, no rupee impact, so it can
  never outrank a bill about to bounce. The action **opens the plan** rather than rewriting
  it: changing where a bill is paid from is a plan revision (ADR-0015) and belongs to the
  user on the page that records it, not to a button inside a warning.
- `InsightType.PLAN_ACCOUNT_DRIFT` and the frontend union member.
- `FinancialContext.planAccountDrifts`. While wiring it, `buildContext` was reading
  `instanceService.listForCycle` twice — the cycle's whole worklist, the most expensive read
  in the context. Now read once and shared.

**Two in a row, never one.** The Settle sheet allows any account deliberately, and a bill
paid from elsewhere once is ordinary. A warning on a one-off is noise, and noise is how a
reader learns to skip the warning that matters. Paying from the planned account breaks the
run, so correcting course clears the finding rather than leaving a standing accusation —
the same principle `GoalWithdrawalCalculator` applies by netting deposits against
withdrawals.

**Verified silent on real data, which is the result the threshold predicts.** Replaying the
rule's own logic over every cycle found exactly two bills with a single off-plan payment —
*Home Support* (planned HDFC Salary, paid from Cash wallet, 29 Oct) and *Emergency fund
top-up* (planned Cash wallet, paid from HDFC Salary, 3 Oct) — and none with two. Both look
like a plan that wants correcting; both are correctly below the floor until it happens
again.

**Not yet observed firing**, for that same reason: no bill in this data has drifted twice
yet. *Clothes shopping* will be the first if November repeats in December. The firing path
can be proved without touching data by lowering `MIN_CONSECUTIVE` to 1 for one restart —
both bills above should then appear — and putting it back.

---

### 2.15 Taking money back out of a goal was a silent plan rewrite — ✅ **built 2026-10-09**
- **Found by the user**: *"today is now green but it should not … what is planned and what is
  owed today should demonstrate exactly according to plan"*. The cycle's plan put ₹15,000 into
  the emergency fund; on 9 Oct **₹11,000 came back out** (txn 126, HDFC Premium → HDFC Salary);
  Real Balance rose by ₹11,000 and Today went green.
- **Every figure was correct** — that money genuinely is spendable again. What was missing is
  that **nothing said the plan and reality had parted company**. ADR-0015: a plan change records
  what changed, when and why, and *"a silent plan rewrite is a defect"*.
- **`GoalBehindRule` could not catch it.** The goal is **23.5% funded against 7.12% of its time
  elapsed**, so by pace it is comfortably ahead and stays quiet. Being ahead of schedule and
  having just undone three quarters of this month's contribution are both true at once.
- **Built:** `GoalWithdrawalCalculator` + `GoalRaidedRule` + `GOAL_RAIDED`, with
  `FinancialContext` carrying the result — rules never query, so the work is done once in the
  context build. **No schema change. No figure changes**; Real Balance still counts the money,
  because the money is there.
- **Three judgement calls worth keeping:**
  - **Transfers only.** An expense straight out of a goal's account is often the goal *working*
    (a trip paid from the trip's own account), so counting it would fire on success.
  - **Nothing a bill paid for.** A commitment settled from a goal's account is the plan running.
    V23's payments table is what makes that answerable at all.
  - **Net, and in date order.** The first version netted the cycle's ins against its outs and
    reported **₹1,000** where ₹11,000 had left — two *contributions* from 30 Sept and 2 Oct had
    cancelled a withdrawal made on the 9th. Money paid in nine days before a raid did not put
    that raid back. The running total is now walked chronologically and never goes below zero.
- **Tone:** ATTENTION, never CRITICAL, no verdict (rule 8). Taking your own money out of your
  own emergency fund is often the right call — it is what the fund is for. The sentence states
  what happened and offers the two honest next steps: move it back, or change the plan.
- **Verified live:** fires as *"₹11,000 came back out of Emergency fund"* with a **Move it back**
  action, renders on Today, and `/position` is unchanged at ₹7,671. Backend `compile` and
  `test-compile` clean; frontend `tsc` + `vite build` clean.
- **Not verified:** that it clears when the money goes back. By construction a later deposit
  reduces the outstanding figure to zero and the insight disappears — no write was run from here.

### 2.14 A holding has no maturity date, so "reachable from Jan 2029" has nowhere to live
- **Asked for 2026-10-03.** The user is stopping contributions to **RD - Mom** but keeping the
  ₹9,000, *"withdrawable after 3 years — that means Jan 2029"*.
- **Nothing in the backend models a date on which money becomes reachable.** `grep` for
  `maturity|maturesOn|unlockDate|lockedUntil` across `src/main/java` returns **nothing**. The
  only place to put it today is the holding's free-text `note`.
- **`liquid` is the nearest thing and it is a boolean, not a date.** It answers *"could you reach
  this if you had to?"* and feeds `illiquidTotal`/`liquidTotal`, which `FinancialStateMapper`
  uses for the emergency-runway figure. Setting it to `false` is correct and sufficient for
  **today's** numbers — it just cannot say *when that changes*.
- **This is well-shaped, because the destination already exists.** Ahead has a money-unlock
  calendar, but `ForecastUnlock` is built **only** from commitments whose last occurrence has
  passed (`ForecastServiceImpl.unlocksFrom`). *"₹9,000 becomes reachable in Jan 2029"* is the
  same species of fact as *"₹6,145 a month frees up in March 2027"* and belongs on the same
  calendar. A maturing RD, an FD, a lock-in ending on an ELSS — all of it.
- **Needs a column** — `investments.matures_on DATE NULL`. Recorded under **DEFERRED SCHEMA** in
  `CONTINUE_HERE`; the migration freeze is on, so **ask before writing it**, and note that adding
  the `@Column` without the DDL stops the backend booting (`ddl-auto=validate`).
- **Not a defect:** that the ₹9,000 is outside net worth is **disclosed**, not hidden —
  `InvestmentsRegister` says *"₹9,000 of this is held outside your accounts, so it isn't in net
  worth."* A holding with no ledger account is invisible to net worth by design. If the user
  wants it counted, the holding needs an INVESTMENT account, and `accountId` is **not updatable**
  (`InvestmentServiceImpl.update`), so that means recreating it — their call, not a bug.

### 2.12 Does a goal's own arithmetic read rules or occurrences? — **unanswered, and it matters**
- Found 2026-09-30 while fixing the goal's *Funded by* list, which was showing a one-off's
  **rule** amount (₹17,000) after the user had set that month's **occurrence** to ₹15,000.
  The display is fixed; the arithmetic was never checked.
- **The question.** "Set aside a month ₹13,409" and `requiredPerMonth` / `fundedPerMonth` -
  are they built from commitment *rules* or from the generated *occurrences*? If rules, a goal
  plans against money that is not coming, and V22's per-month override makes that divergence
  easy to create by accident.
- **Cost.** A goal that quietly believes it is being funded ₹2,000 a month more than it is.
  Worse than a stale label, because the pace verdict is built on it.
- **Where to look.** `GoalServiceImpl` / whatever computes `GoalView.fundedPerMonth`.

### 2.13 Petrol, Mobile recharges and Hair cut are not really bills
- A commitment is one payment on one date. Petrol is ₹2,500 across five fills; the plan says
  it is due on the 27th. That is why `CommitmentAutoMatcher` can never help them - it needs
  the amount to the paisa and the due date within three days.
- **Made workable, not right.** 2026-09-30's "Towards a bill?" row on the Add sheet lets a
  ₹500 fill part-pay the ₹2,500 bill in one action, and part payments now show progress. The
  modelling question is untouched.
- **Decide with the user:** keep them as commitments and part-settle as you go, or move them
  to flexible categories and let them come out of day-to-day spending. The second loses the
  money being held back in advance, which may be the whole reason they are bills.


### 2.1 Goals can't track an investment
- **Problem.** A goal links to an account or a reservation only (`CreateGoalRequest`).
- **Cost.** An emergency fund held partly in FDs shows progress from the bank balance alone.
- **Fix.** Add `linkedInvestmentId` (at most one link), and use the investment's current value
  as progress. Possibly allow several links summed.

### 2.2 No must-pay total, and no emergency fund target suggestion
- **Problem.** The plan shows the total of everything planned, not the must-pay part.
- **Fix.** Add `mandatoryTotal` to plan progress / cycle standing (server-computed). On Add
  goal, offer "6 × your must-pay bills" as the emergency fund target, labelled as excluding
  day-to-day spending.

### 2.6 Month close counts income by date, This Month by the salary it belongs to
- Found 2026-09-17 (step 5). Standing counts a salary through the income row it settles, so
  a salary that lands on the 26th counts in the cycle starting the 28th. The cycle summary
  (Month close "What happened", This Month's "Money in", snapshots, savings rate) still sums
  income by date, so the same salary shows in the previous cycle there.
- **Cost.** Only when salary lands early; the two screens then disagree by one salary.
- **Fix.** Make `CycleServiceImpl`'s income total use the same rule as `standing`
  (linked income by its row's cycle + unlinked income by date). Snapshots already taken
  keep their stored figures.

### 2.8 A loan prepayment doesn't update the loan
- Found 2026-09-17 (planned changes). "Plan a prepayment" plans a transfer into the loan
  account, and recording it moves that account's balance, but the loan's own outstanding
  figure (V13) and payoff date don't change until the loan is edited. The page says so.
- **Fix.** Step 8 (loan intelligence): offer "Update the loan" after a recorded prepayment,
  with the new outstanding pre-filled.

### 2.9 A one-month amount change on a fixed bill doesn't stick — ✅ **fixed 2026-09-28 (V22)**
- Changing one month's amount on a fixed bill was reset to the rule's amount the next time
  the month loaded (`reconcileWithRule`). It saved, appeared to work, then undid itself.
- **Fixed by** `commitment_instances.amount_overridden` (V22). `setExpectedAmount` sets it;
  `reconcileWithRule` skips the amount sync when it is set. The due date still follows the
  rule — an override is about the figure only.
- **`POST /commitment-instances/{id}/use-bill-amount`** is the way back. Without it the
  override is a one-way door: typing the usual figure back in leaves the flag set, and the
  month silently stops following the bill from then on.
- **The UI change is the point, not the flag.** The real defect was that changing one month
  looked identical to changing the bill and behaved like neither. It lives in **Edit**, behind
  the pencil that already means "change this": a fixed bill now shows **How much** *(every
  month, until you change it)* and **This time** *(just the one due 1 Oct — leave it blank and
  this month uses the amount above)* one above the other. Two labelled fields, adjacent, both
  visible. The row shows `this month · usually ₹10,000`, and Edit offers *Use the usual amount
  for this month too*.
- **A first attempt was built and thrown away, and the reason is worth keeping.** It put a
  *Just this month / From now on* radio behind a new **Amount** button on the plan row. The
  user's verdict, and it was right: *"User will not be able to guess the amount is clickable
  and doing it what will happen."* A button labelled with a noun says nothing about what it
  does, the choice was invisible until pressed, and it made a third control compete on a row
  that already had two — which also broke the layout (`₹10,000Amount` printed across the
  figure, the same collision `InvestmentRow` hit; the column had to go `7.5rem → 11rem` to
  hold it, and is now back at `7.5rem`). **Two labelled fields side by side beat a hidden
  choice.**
- `instanceAmountEligible` in `EditCommitmentSheet` no longer requires `VARIABLE` — that gate
  was what made the new field render and do nothing. Still excluded for a terms-locked bill: a
  loan's EMI is the loan's to say. Unchanged means not sent, so saving a bill without touching
  *This time* never marks the month overridden.

## 3. Cards follow-ups

### 3.3 A manual "credit card bill" commitment would now double count
- What's owed on cards is subtracted from Real Balance, so a plan bill for the card's payment
  subtracts the same money again. Nothing prevents creating one.
- **Fix.** Hide credit cards from a bill's "Leaves from" list, or warn when a bill's name or
  category looks like a card payment. Card EMI bills leaving from the card are fine: settling
  one moves it from committed into owed on the card.

---

## 4. Rough edges

### 4.8 The sidebar never collapses, so the app is unusable below ~700px
- **Found 2026-10-03** while checking the rebuilt Today block at a narrow viewport. At 430px
  the fixed sidebar keeps its full width and the content column is squeezed to roughly 130px —
  every heading wraps one word per line.
- **Not caused by the Today work:** the hero, the primer and the nav squeeze identically, and
  none of them was touched. It is the app shell.
- Low priority while this is a desktop-first product for one user, but it is the reason no
  narrow-width check can say anything useful about a component until the shell responds.


### 4.1 `GET /api/v1/settings` returns 500
- Seen while checking data on 2026-09-14. Either the route doesn't exist (should be 404, not
  500, so `GlobalExceptionHandler` needs a `NoResourceFoundException` mapping) or the settings
  endpoint lives elsewhere and fails. Check which.

### 4.2 Dev server crashes on devtools restart after a test build
- Running `mvnw test` while `spring-boot:run` is up recompiles classes under it; the restart
  fails with `ClassNotFoundException: com.finance.common.audit.AuditableEntity`, and a second
  start then hits "port 8080 in use". It recovered on its own each time, but unreliably.
  Consider excluding `target/test-classes` from the restart trigger, or running tests with a
  separate build directory.

### 4.4 Switching a bill from fixed to "varies" keeps the old amount on unpaid months
- Deliberate: that figure is the best estimate available. Revisit if users expect those months
  to show "needs an amount" instead.

### 4.5 Postman coverage for Loans and Commitments is partial
- Loans folder has only `POST /loans/estimate`; Commitments has create/update/delete. The
  **Bill sources & settlement** folder (2026-09-17) adds loan create, from-loan/from-investment,
  link/unlink, skip/unskip and settle-by-type. Still missing: loan list/get/schedule/summary,
  commitment archive/unarchive.
- The collection has never been run end to end (no newman; the only server holds real data).
  Each new request was run once against the dev server on ZZ records before being saved.

### 4.6 Two old deleted transactions have postings on a deleted test account
- Found 2026-09-17 while cleaning up ZZ records. Transactions 1 ("Drinks", ₹745) and 2
  ("Salary Income", ₹57,700), both soft-deleted on 12 Sep, have postings on account 14
  ("ZZ Temp Card", soft-deleted 14 Sep), while their own `account_id` is 3 and 1. Probably
  left by an earlier test cleanup. Nothing visible uses them (all three rows are deleted), so
  nothing was changed.
- **Fix, if wanted.** Hard-delete the three rows and their postings after a `mysqldump`;
  harmless either way.

### 4.7 A nested `<button>` on Needs you logs a React hydration error — ✅ **fixed 2026-11-08**
- Found 2026-09-25 in the headless console while screenshotting `/needs-you`:
  *"In HTML, `<button>` cannot be a descendant of `<button>`"*, traced through `AppShell` →
  `Outlet`. `InsightRow` renders the whole row as a button when `navigable` (the dedicated
  page passes it), and the row's own **"I know"** and action buttons sit inside it.
- **Cost.** Nothing visibly broken — the click handlers work, because `stopPropagation` was
  added for exactly this. But nested interactive elements are invalid HTML: screen readers
  announce one control, and the inner button is not reliably reachable by keyboard.
- **Fix.** Make the row a `<div>` with an overlaid stretched link or an `onClick` plus
  `role="link"`/`tabIndex`, so the action buttons are siblings rather than descendants.
  **`LedgerRow` already solved exactly this** with `div[role=button]` plus a real sibling
  that stops propagation, and says so in its class comment; `InsightRow` should follow it.
- **Still present 2026-11-01**, re-observed on `/needs-you` while checking other screens
  after the Today rebuild. Logged a second time as 4.9 in error and merged back here.

---

## Data to check (not code)

### Three mandatory monthly commitments all fund the emergency fund (found 2026-10-03)
All three are `sourceType GOAL`, `sourceId 1`, `settleAs TRANSFER`, `toAccountId 3`
(HDFC Premium), **mandatory**, with no `endsOn`:

| id | name | due day | amount |
|---|---|---|---|
| 10 | Emergency fund contribution | 28 | **VARIABLE** (October's instance: ₹10,000) |
| 41 | Emergency fund **top-up** | 2 | **₹15,000** — October's instance is `PAID` |
| 43 | Emergency fund **top-up** | 3 | **₹30,000** — one instance only, **3 Nov, PENDING** |

**41 and 43 have the identical name.** That alone will make the plan unreadable on Months.

**43 may well be deliberate and should be asked about, not "fixed".** November's cycle carries
the ₹46,000 Diwali Bonus (income ₹1,03,700), and the forecast shows that month at
`setAside 42500 · flexible 23497` — so parking ₹30,000 of the bonus is affordable and sensible.
**But it is modelled `MONTHLY`, not as a one-off**, which is the same mis-modelling the goal
funders work hit on 2026-09-30.

**Why October reads −₹9,436 is now plain, and it is not a display bug:** ₹39,636 of bills plus
₹27,500 set aside is ₹67,136 against a ₹57,700 salary. The plan does not fit the month.

**Worth asking as well:** 10 is VARIABLE with no fixed amount, so what it will claim each month
is unknown until someone types it — and it is `mandatory`.


- **No "Salary" income category.** Income categories are Freelance, Interest and Other
  Income. Add a "Salary" category (group: Income) before adding the salary rule, so the
  onboarding step and "Received" pick it automatically.

- **IDBI education loan:** ₹1,29,000 at 9.35% over 60 months works out to ₹2,700 a month,
  but the EMI entered is ₹3,417. One of amount, rate, tenure or EMI is off; check the
  sanction letter.
- **HDFC bike loan:** "Disbursed on" is 5 Nov 2025, which is probably the first EMI date. If
  the money was released in October, set Disbursed on = 5 Oct 2025 and First EMI = 5 Nov 2025.
- **Card EMIs (HDFC credit card ₹2,648 and ₹3,998):** "From" is still HDFC Salary. Once the
  card is added, set each loan's paying account to the card, then "Add EMI to plan" so the
  charge leaves from the card.

---

## Done

- **2026-09-23 - 4.3 closed by ROADMAP 1.2 / ADR-0018.** A settled EMI now files a
  `LoanPayment` against its period (`LoanPaymentRecorder`), and outstanding, EMIs left and
  repaid all derive from recorded payments rather than elapsed dates. An unrecorded EMI is
  **flagged** (`unrecordedEmis`, `DebtsNeedsALook`) rather than assumed paid. The user's
  decision, 2026-09-21: record *and* flag, and an overpayment counts against principal.
  **Not yet exercised** - no EMI has fallen due; first real test is 5 October.

- **2026-09-22 - card available credit ignored EMI principal.** HDFC Money back read
  ₹1,31,000 available and 0% used while carrying ₹55,302 of EMI principal converted onto that
  same card. EMIs on a card are modelled as separate LOAN accounts, so their balances never
  touched the card's own. Now `limit - outstanding - emiPrincipalBlocked`, derived from the
  same recorded payments as the loan page so the two cannot disagree, shown as its own
  deduction and deliberately **not floored at zero** - over the limit is a real state.

- **2026-09-19 - 2.11 fixed:** an expense bill only reduces Free when it leaves a spendable
  account or a credit card (`PositionServiceImpl.leavesHeldMoney`). Needed for goal payments
  paid from a goal's own savings account. Also: goals got edit/archive/delete and dated
  payments (CONTINUE_HERE "Goal payments").

- **2026-09-19 - Edit's Save did nothing for every Payment and Income commitment.** The API
  omits null fields, so `toAccountId` arrived undefined and failed the form schema on a hidden
  row, silently. Fixed with `?? null`, the response type made optional, and an `onInvalid`
  banner so a failed check is always named. Also: "Changes start" no longer offers dates on or
  before the commitment's own start. Reproduced and verified in headless Chrome with all writes
  intercepted (CONTINUE_HERE "Edit Save fix").

- **2026-09-19 - Edit bill: silent save failure + no way to give a "Varies" bill's current
  month an amount.** Two rounds - the first fix (below) was incomplete; a second, confirmed
  root cause followed once the user reported the actual symptom (a full page reload).
  - **Gap (fixed).** A bill set to "Varies - a bill I read each month" had no way, from Edit,
    to give *this* occurrence a known amount - only "Estimate" on the Months row could. Fixed:
    Edit bill shows a "This occurrence's amount" box (reuses the existing per-instance
    `PATCH /commitment-instances/{id}` endpoint - no API change) whenever it's opened with an
    occurrence in view (Months' pencil, or a bill's own detail page) and the bill is Varies.
    A bill's rule-only detail page (no specific occurrence) doesn't show it.
  - **Real bug, round 1 (fixed, but not the main cause).** Two `if (...) return;` early-exits
    in `EditCommitmentSheet`'s submit (a "Last payment"/"Last instalment" validation problem)
    had no visible feedback - clicking Save could silently do nothing. Fixed: every rejected
    save now also shows a message right above the Save button, not only next to one field
    that might be scrolled out of view.
  - **Real bug, round 2 (the actual cause of "clicking it refreshes the page").** Building the
    box above put `InstanceAmountForm`'s own `<form>` *inside* `EditCommitmentSheet`'s outer
    `<form>` - an HTML `<form>` nested in another `<form>` is invalid, and here it caused a
    genuine full browser page reload on click (wiping all in-progress edits), and left the
    outer "Save changes" button unresponsive. Fixed properly, not by relying on nesting
    quirks: `InstanceAmountForm` no longer renders a `<form>` at all - a plain container, an
    explicit button `onClick`, and an `Enter`-key handler on the input that stops the keypress
    from reaching the outer form (so Enter sets the amount, never triggers "Save changes" for
    the whole bill). Safe in all three places it's used (Months' inline Estimate, the
    Today/Month "needs an amount" blockers, and this new Edit-bill box).
  - No backend/API change; frontend only (`InstanceAmountForm.tsx`, `EditCommitmentSheet.tsx`,
    `PlanZone.tsx`, `CommitmentDetailPage.tsx`). Verified with `tsc -b --noEmit` + `vite build`
    both rounds, and a static screenshot of Months after round 2 (dev server was up by then).
    **The interactive click-path itself (open Edit → type an amount → Save, and the inline
    box) has still never been clicked through by anyone but the user who found the bug** - no
    browser-automation tool was available in this session to script it. Ask the user to
    confirm before treating this as closed.
  - **Round 3, 2026-09-19 - redesign, not a bug fix.** After round 2, the user reported Save
    changes still not doing what they expected, and named the real complaint: having a
    separate "Set amount" button next to "Save changes" was redundant - typing an amount and
    clicking Save should just save it, no second click. Fixed by removing the standalone
    `InstanceAmountForm` from Edit bill entirely: the "This occurrence's amount" box in Edit
    is now a plain input holding local state, prefilled from the instance's current
    `expectedAmount` (a new `instanceAmount` prop, threaded through from `PlanZone.tsx` and
    `CommitmentDetailPage.tsx`, which both already had the instance in hand). `onSubmit` now
    does both in one click: updates the rule via `updateRule`, then - only if the amount field
    changed and is non-empty - calls `setCommitmentInstanceAmount` before closing. An emptied
    field is treated as "leave it as it is" (the endpoint can only set an amount, not unset
    one). If the rule save fails, nothing else runs. If the rule saves but the amount save
    fails, the sheet stays open with "The bill saved, but this occurrence's amount didn't: …"
    so a partial success is never silent.
    `InstanceAmountForm` itself is untouched and still used standalone in two places where a
    single small save genuinely is the whole action: Months' inline "Estimate" row and the
    Today/Month "needs an amount" blockers - both correctly keep their own button.
  - **Also added, same request** - Add a commitment had no way to give a new Varies bill's
    first occurrence an amount at all ("same thing should go when we add new bill"). Since the
    occurrence doesn't exist until the rule is created (the server generates it), this can't
    be folded into one submit the way Edit's now is - so the *existing* success screen
    (`added ? (...)` in `AddCommitmentSheet.tsx`, which already looks up `inThisCycle` via
    `useGetCommitmentInstancesForCycleQuery`) now shows the same box, using the untouched
    standalone `InstanceAmountForm`, when the new bill is VARIABLE, not income, has an
    occurrence in this cycle, and that occurrence doesn't have an amount yet.
  - Verified with `tsc -b --noEmit` + `vite build` only (both clean) - not yet clicked
    through by the user.
  - **Round 4, 2026-09-19 - the whole commitment form reworked for plain language.** The user
    couldn't add a commitment without guessing: "Paid as" didn't say what to pick, "Varies" had
    no amount field when adding, "Starts: October 2026" read as a Sep-Oct range, Edit's
    "Follows" was meaningless (and listed loans for a salary), "Apply from" unclear, "How it
    works" didn't help. Reworked: Type (Payment/Saving/Investing/Income) with a which-to-pick
    hint on every non-obvious row; First payment as a calendar month with the real date shown;
    optional First amount for a changing one, saved in the same Save; Edit's "This time" row
    under Amount (round 3's separate box removed); "Linked to" moved down and hidden for income;
    "Changes start" with dated options; "Add a bill" → "Add a commitment"; Months guide and
    primer rewritten. Frontend only. Verified by `tsc -b --noEmit` + `vite build`; not yet
    clicked through - see CONTINUE_HERE.md.

- **2026-09-18 - Insight engine** (`GET /insights`, Today and Months use it). Covers overdue card bills in Needs you (was 3.2) and a late salary on Today (was 2.7), plus shortfalls, planned moves not recorded, bills due or needing an amount, and a goal behind.

- **2026-09-17 - Month pickers (was 2.3).** Add and Edit bill pick "Starts" / "In" with a month + year picker (`SalaryMonthPicker`, any month ±10 years, cycle dates shown); Edit can move a bill's start.
- **2026-09-17 - A one-off's month can be changed in Edit bill** ("In" picker; was 2.10).
- **2026-09-17 - Money moved out of a non-spendable account no longer reduces Free.** A
  planned ₹17,000 deposit from cash (not spendable) into the emergency fund made Free read
  −₹7,503; position and the month's outline now skip transfer/investment bills whose source
  isn't spending money.
- **2026-09-17 - Planned changes (PLANNED_CHANGES.md).** One-off items, "apply from a month",
  stopping a SIP/RD, "What's different this month", and reminder wording for planned moves and
  income. A late salary now shows in Today's Needs you (was 2.7).
- **2026-09-17 - Expected income (audit step 5, was 2.4).**
  - Salary is a rule with "Paid as: money coming in" (`settleAs = INCOME`): This Month's
    "Coming in" block, Coming up, onboarding "What comes in?".
  - Standing = received + still expected; what arrived replaces the estimate, never both.
    Never counted in Real Balance before it lands.
  - Matching allows ±5 days (across the cycle boundary) and ±20% of the amount; a received
    salary is received, never "part-paid".

- **2026-09-17 - Bills that follow what they pay (audit steps 1-4).**
  - A bill can be paid by a transfer (to your own account) or an investment, not only an
    expense. Settle and the auto-matcher accept only the bill's own type and destination (was 1.1).
  - A bill can follow a loan, a holding or a goal. A loan's or holding's bill takes its
    amount, day and account from it and changes with it; Debts, Investments and the goal page
    offer one-click Link / Add (was 1.2).
  - Coming up lists a loan's EMI once when a bill follows the loan (was 1.3).
  - A card-paid loan's bill leaves from the card, so its charge is committed until recorded
    (was 3.1, once the loan's paying account is the card).
  - Update balance on a card or loan takes "Owed now" as a positive amount (was 3.4).
  - Optional bills reduce Free until paid or skipped; Skip / Undo on This Month and the bill page.

- **2026-09-14 - Cards section.**
  - Credit cards are their own accounts with limit, statement and due day, created in one step.
  - Statements are pre-filled from card entries and correctable, with paid-since, remaining and status.
  - Pay bill is pre-filled as a transfer, and card EMIs are listed on their card.
  - Debit cards are attached to a bank account.
  - What's owed on credit cards is now subtracted from Real Balance.
  - Coming up shows a card bill's remaining amount and no longer lists card EMIs as separate payments (was 1.4).
