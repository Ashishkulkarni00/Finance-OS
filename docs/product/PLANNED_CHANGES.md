# Planned changes: one-offs, changes from a month, and reminders

Status: **built 2026-09-17** (user approved: build before audit step 7; the ₹17k cash is a not-spendable account).
Parts 1-3 are done. Part 4 (reminders) is done for Today and This Month's Needs You wording; the
"planned change coming next month" *notice on Today* waits for the step-7 insight engine.

Built as:
- **Once:** "How often → Just once" in Add bill (`frequency: 'ONCE'` is form-only → a MONTHLY
  rule with `activeTo` = the chosen cycle's end); `isOneOff()` in `commitmentForm.ts`.
  - Entry points: goal page "+ One-off top-up", This Month → Coming in "+ Extra income this
    month", loan page "Plan a prepayment" (`AddBillPreset` kinds GOAL / INCOME / TRANSFER, `once`).
- **Apply from:** `PATCH /commitments/{id}` `applyFrom` → `CommitmentServiceImpl.update` ends
  the rule the day before and saves a copy (`copyStartingOn`) with the changes. Refused (400)
  for loan/holding bills. Edit bill → "Apply from".
- **Stop a holding's instalment:** Edit bill → "Last instalment" (sends `activeTo`).
- **What's different this month:** `PlanChanges.tsx` on This Month's plan (one-offs, changes,
  last payments, stopped bills; the first planned month collapses to one line).
- **Reminders:** Needs you (Today and This Month) says "Expected … not recorded yet" / "Planned for
  … not recorded yet" and offers Received / Record it; a late salary now shows on Today.

**Not built yet:** the cross-month "Planned changes" list (every one-off and dated change in
one place) and the "changes from <month>" note on the bill page. For now each month shows
its own "What's different this month".


## 1. The problem, in the user's words, as situations

| Situation (Sept 2026) | What it really is |
|---|---|
| "In November I get a Diwali bonus of about ₹46k; ₹16k I'll use, ₹30k goes to the Emergency fund on top of the usual ₹10k." | A **one-off income** in November, plus a **one-off transfer** of ₹30k into HDFC Premium in the same month. The regular ₹10k bill is unchanged. The ₹16k is simply what's left: Flexible shows it. |
| "₹17k of the emergency fund is in cash; I'll deposit it after salary on the 28th." | A **one-off transfer** Cash → HDFC Premium, due around 28 Sep. The cash has to exist in Kosh first (a Cash account), or the ₹17k is invisible. |
| "From next month I stop the RD and increase the EF contribution." | Two **changes from a month**: the RD instalment's last payment is October; the EF bill's amount changes from November. October and earlier keep what they were. |
| "If it isn't done in the planned month, remind me." | Every planned item is a dated row; once its date passes unpaid it must surface where the user looks (Today, This Month), not only on its own page. |
| "Not only goals - everywhere it applies." | The same three tools on every kind of plan row: bills, income, savings/goal transfers, SIP/RD, loan prepayments, planned card purchases. |

## 2. The design: three tools on the plan, not a new module

The plan (rules → monthly rows) already carries settlement, reminders (attention tiers) and
the month's outline. Adjustments are more plan rows, not a parallel "adjustments" ledger - so
they're counted in Free, settled by the real entry, and reminded like any bill.

### 2.1 "Just once" - a one-off plan item
- **Add a bill → How often: Once, in <month>.** Works for every "Paid as": spent, moved to
  my own account, invested, money coming in.
- Stored as today's rule with `activeFrom` and `activeTo` in the same month: **no schema change**.
- Entry points where the situation arises:
  - Goal page → Funded by → **"+ One-off top-up"** (pre-filled transfer into the goal's account).
  - This Month → Coming in → **"+ Extra income this month"** (bonus, arrears, refund of a deposit).
  - Loan page → **"Plan a prepayment"** (a transfer into the loan account).
- An extra is **added to** the regular item, never replaces it ("₹30k + the usual ₹10k"). That
  keeps the regular rule untouched and the month's picture honest.

### 2.2 "From <month>" - a change that starts later
- **Edit bill → "Apply from": This month and later / From <month>.**
  - "This month and later" is today's behaviour.
  - "From November" ends the current rule after October and starts a copy with the new
    figures in November, keeping the link to the goal / loan / holding. History and
    October stay as they were. **No schema change** (two rules, one ended).
- **Stop from <month>** on any bill, including a holding's instalment (RD): sets the last
  payment. For a holding's bill this is currently locked; it will be allowed, since stopping
  an RD is exactly the user's decision to make.
- This Month (for a future month) and the bill page show **"Changes from November"**: what
  starts, stops or changes, so a planned change is visible before it happens.

### 2.3 Reminders - one place that catches everything not done
- Every one-off and every changed row is an ordinary plan row, so it already gets a due date
  and the attention tiers. Missing pieces to close:
  - Transfers, investments and income past their date must show in **Today → Needs you**,
    phrased for what they are ("₹17,000 cash → HDFC Premium was planned for 28 Sep - done?
    Record the transfer"), not as "a bill to pay".
  - Before the month: "Next month: RD stops, EF contribution becomes ₹X" (a planned-change
    notice), and "Diwali bonus expected in November, with ₹30k of it planned for the
    Emergency fund".
- These become rules in the step-7 insight engine (PLANNED_ITEM_MISSED,
  PLANNED_CHANGE_SOON, INCOME_LATE). Until the dismiss/snooze table exists (Deferred SQL),
  a reminder stays until the row is settled, skipped (optional ones) or edited.

## 3. What the user does (their examples)

1. **Cash ₹17k:** Accounts → add "Cash in hand" (cash, ₹17,000, **not spendable** - it's
   already emergency money). Goal page → **One-off top-up**: ₹17,000 from Cash in hand, due
   28 Sep. On the 28th record the transfer; the goal's progress then reads ₹50,000.
2. **Diwali bonus:** This Month → November → **Extra income**: ₹46,000, expected (date).
   Goal page → **One-off top-up** ₹30,000 in November from HDFC Salary. November's outline:
   comes in ₹57,700 + ₹46,000; set aside includes ₹10k + ₹30k.
3. **RD stops, EF goes up:** RD instalment → **Stop after October**. EF contribution → Edit →
   amount ₹X, **Apply from November**.
4. **Miss one:** the day after its date it appears in Today → Needs you and This Month until
   recorded.

## 4. Where I'd differ from the literal ask
- **No separate "adjustments" area.** A separate list would duplicate the plan and drift from
  it - the spreadsheet failure again. Adjustments live in the plan; a filtered view "Planned
  changes" (one-offs and dated changes across months) gives the one place to catch them.
- **A bonus split is not a feature of its own.** "₹16k to use" is exactly Flexible once the
  bonus and the top-up are planned; a split form would store a number the plan already derives.
- **Cash must be an account.** Without it, ₹17k of the emergency fund can't be counted,
  moved or reminded about.

## 5. Build order (no tests, no SQL - per the 2026-09-17 rule)
1. "Once" frequency in Add bill + the three entry points (goal top-up, extra income, loan prepayment).
2. "Apply from <month>" and "Stop after <month>" (server-side rule split; holding bills allowed an end).
3. "Changes from <month>" notice on This Month and the bill page; "Planned changes" filter.
4. Reminder rules in the step-7 insight engine, with Today phrasing per payment kind.

Known limit: a per-month amount change on a fixed bill (instead of an extra item) is reset
by the rule on the next load; it needs an "overridden" flag on the row → **Deferred SQL**.
The one-off-extra approach above avoids needing it.
