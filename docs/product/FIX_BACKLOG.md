# Fix backlog

Known problems and missing pieces found while setting up real data for October 2026, parked
until the base is stable. Each entry says what's wrong, what it costs the user, and the
proposed fix, so it can be picked up cold.

Started 2026-09-14. When you fix one, delete it here (the code and git history record the
fix) or move it to **Done** with the date.

---

## 1. Correctness: numbers the user sees are wrong

### 1.5 Net worth doesn't move as loan EMIs pass
- **Problem.** Total debt uses the LOAN account balance, which only changes when the loan's
  outstanding principal is edited (V13 re-bases the account then). The loan page's
  "Outstanding today" is derived and does fall with each EMI.
- **Cost.** Net worth reads more pessimistic every month until the user edits the loan.
- **Fix.** Derive the loan account's balance from the loan (outstanding today) in the net
  worth / account balance calculation instead of the opening balance. Nothing stored (ADR-0011).

---

## 2. Missing capability, requested or implied

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

### 2.9 A one-month amount change on a fixed bill doesn't stick
- Changing one month's amount on a fixed bill is reset to the rule's amount the next time
  the month loads (`reconcileWithRule`). Extras are planned as one-off items instead.
- **Fix.** An "overridden" flag on the row → **Deferred SQL** (CONTINUE_HERE).

### 2.11 An expense bill paid from a non-spendable bank account still reduces Free
- Transfers and investments leaving a non-spendable account no longer count (fixed
  2026-09-17), but an EXPENSE bill from, say, HDFC Premium still does. Card expenses must
  keep counting, so the rule needs the account type.
- **Fix.** In `PositionServiceImpl.leavesHeldMoney`, count an expense when its account is
  spendable or a credit card.

## 3. Cards follow-ups

### 3.3 A manual "credit card bill" commitment would now double count
- What's owed on cards is subtracted from Real Balance, so a plan bill for the card's payment
  subtracts the same money again. Nothing prevents creating one.
- **Fix.** Hide credit cards from a bill's "Leaves from" list, or warn when a bill's name or
  category looks like a card payment. Card EMI bills leaving from the card are fine: settling
  one moves it from committed into owed on the card.

---

## 4. Rough edges

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

### 4.3 Loan payments aren't recorded one by one (by design, for now)
- An EMI counts as paid once its due date passes; a missed or extra payment is corrected by
  editing the loan's outstanding principal. If this proves too loose, link a Ledger EMI
  expense to the loan period (a LoanPayment write path exists in the schema, not in the API).

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

---

## Data to check (not code)

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
