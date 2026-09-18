# Continue here (rewritten 2026-09-17, end of day)

Read this first, then `SESSION_HANDOFF.md`, then `CLAUDE.md`.

## If you were given the usual start prompt
That prompt says "finish step 4 … then steps 5-12". **It is out of date:**
- Step 4 and steps 1-6 of `product/PRODUCT_AUDIT.md` §8 are **done**.
- So are the extra pieces built the same day, listed below.

**New on 2026-09-18: `product/STRATEGY_DEEP_DIVE.md`**, the product strategy, UX and backend deep-dive the user asked for.
- It holds the diagnosis, competitive gap, USP direction ("the months ahead, with everything promised accounted for"), IA, Today/Month design, loop, roadmap, domain changes, flows, magic moments, metrics, thesis and KEEP/CHANGE/REMOVE/ADD/DEFER.
- **Decisions S1-S7 (§P) await the user.** Don't build any of it until they agree a direction.

**Parked by the user on 2026-09-18:** the discipline plan and decisions D1-D8 wait until they bring it back up. Don't start it unasked; ask what they want to work on instead.

**When it's picked up again:**
1. **Present the decisions** in `product/DISCIPLINE_AND_TRUST.md` §10 (D1-D8) to the user and get answers.
   - That doc is the discipline / behavioural-finance / trust-layer design the user asked for on 2026-09-17.
   - It holds the editability audit, truth model, discipline loop, get-back-on-track design, differentiation and a P0-P4 plan.
2. **Then build in the agreed order.** Recommended: P0 (integrity) → audit step 7 (insight engine, with drift folded in) → P1 → steps 8, 12 → recovery → steps 9-11 → P3 → P4.
3. **Keep this file current** after every finished piece, so a session cut off by the usage limit can resume.

Still open on audit steps: 7 insight engine · 8 loan intelligence · 9 entry memory · 10 import screen · 11 recurring detection · 12 emergency fund / goal ETA (details in `product/PRODUCT_AUDIT.md` §8).

## Decisions the user has already made
- **Audit §9:**
  - Optional bills reduce Free until paid or skipped.
  - Obligation sources come before insights.
  - Existing bills are linked, not recreated.
  - Menu consolidation comes later.
  - Logins and billing are Phase 4.
- **2026-09-17:**
  - Planned changes were built before step 7.
  - The ₹17k emergency cash sits in a not-spendable account.
  - The page is renamed "Months".
  - No new tests or SQL until the end (see below).

## Standing rules from the user
- **Current model:** end every reply with it.
- **No new tests and no SQL** (migrations, cleanup or seed scripts) until the end of the product.
  - The discipline plan needs schema, so that's decision D1: ask before writing any migration.
  - **Since 2026-09-18: don't run the test suite either.** Verify with `tsc` + build, read-only API checks and headless screenshots.
  - Still update Postman and the docs.
  - Live checks are read-only API calls plus headless screenshots. No ZZ rows, since removing them would need SQL.
- **Real data:** never modify the user's data unless they ask; guide them step by step instead.
- **Before any migration:** `mysqldump` the affected tables.
- **Scope:** smallest correct change.
  - Log new gaps in `product/FIX_BACKLOG.md` and tell the user.
  - Act as an expert financial planner and UI/UX designer, and say where you'd differ from the literal ask.
- **Patch scripts:** check whether an edit already applied before re-running a script. A partial re-run once duplicated code.

## Deferred SQL (for the end, or for D1)
- `insight_state` (dismiss/snooze).
- An "amount overridden" flag on `commitment_instances` (backlog 2.9).
- The discipline layer: M1-M10 in `DISCIPLINE_AND_TRUST.md` §2.1.
  - Plan lock, planned amount, plan revisions, change log.
  - Balance and loan checkpoints, goal revisions, recovery plans, month reviews, snapshot plan totals.

## Built on 2026-09-16/17 (verified: tests, tsc/build, API checks, screenshots)
- **Audit step 1:** account usage was already enforced; a refund may go to a card.
- **Audit step 2:** optional bills reduce Free until paid or skipped (Skip / Undo).
- **Audit steps 3-4:** bills follow what they pay.
  - A bill can follow a loan, a holding or a goal.
  - It can be paid as an expense, a transfer, an investment or income.
  - Settle and auto-match accept only the matching type (V16/V17).
  - One-click Link / Add appears on Debts, Investments and the goal page.
  - Link suggestions need a matching amount **and** name (`features/plan/billMatch.ts`).
- **Audit step 5: expected income.**
  - Salary is a rule with `settleAs = INCOME`, shown in Months' "Coming in" block.
  - Standing = received + still expected, never both.
  - The matcher allows ±5 days (across the cycle boundary) and ±20% of the amount.
  - Onboarding has a "What comes in?" step.
- **Audit step 6: the month in one line.**
  - `GET /cycles/{id}/shape`: comes in − committed − set aside = flexible, plus spent outside the plan and pace.
  - Shown as `MonthShape` at the top of Months.
  - Named "shape" because a "snapshot" is the record Month close freezes.
- **Planned changes** (`product/PLANNED_CHANGES.md`):
  - one-offs ("Just once"), with a goal top-up, extra income and loan prepayment;
  - `applyFrom` rule split;
  - stopping a SIP/RD;
  - "What's different this month";
  - reminder wording (Received / Record it); a late salary now shows on Today.
- **UI:**
  - "This Month" is renamed **Months** (route still `/month`).
  - "‹ Back to September · the current month" sits under the switcher.
  - Frequency labels are clearer ("Every year – repeats each year" / "Just once – only this month, never again").
  - Edit can turn a bill into a one-off.
  - Month + year pickers for Starts / In (`SalaryMonthPicker`, backlog 2.3 done).
- **2026-09-18: Months' plan is grouped by date by default.**
  - The toggle reads "By date" / "By category" and the choice is remembered per browser.
  - One band per due date, with planned and still-to-pay figures from `plan-progress.byDueDate` (new).
  - Tests 125/125, build clean, screenshot checked.
- **Fix:** a transfer or investment leaving a non-spendable account no longer reduces Free or counts as set aside.
- **Postman folders added:** Bill sources & settlement (live), Expected income (live), Month shape (live), Planned changes (illustrative).

## Not verified by a person in a browser
- Add/Edit bill: Once, In, Starts, Apply from, Last instalment.
- Received / Record it.
- The onboarding income step.
- Only headless screenshots were taken.
- To take one: `chrome --headless=new --window-size=1440,2600 --virtual-time-budget=10000 --screenshot=<file> http://localhost:5173/<route>`.

## The user's open to-dos in the app (end of 2026-09-17)
- **Diwali Bonus ₹46,000:** still *Every year*. Suggest Just once.
- **Links still to make:**
  - SIP Zerodha bill → SIP holding (Investments).
  - Mobile Mom / Health Insurance → **Add EMI to plan** (Debts).
  - RD - Mom → Add instalment to plan, then Last instalment October 2026.
- **Emergency fund contribution:** raise the amount with **Apply from November**, if still wanted.
- **Ledger:** 6 Sep, *Expense* ₹8,000 "Cash transfer from cash only" from HDFC Premium. Asked what it was; it may need to be a Transfer.
- **Cash wallet:** it's a BANK-type account (works; could be Cash).
- **Plan clean-ups flagged earlier:**
  - Hair cut should be optional.
  - Petrol doesn't fit a single bill.
  - "Home Support" is filed under Utilities.
  - The "Emergenecy" category name has a typo.
- **On 28 Sep:**
  - Record the salary (or press Received).
  - Record the ₹17k deposit as a Transfer from Cash wallet to HDFC Premium (the top-up is planned for 2 Oct).
  - Do each account's Update balance, dated 27 Sep.
