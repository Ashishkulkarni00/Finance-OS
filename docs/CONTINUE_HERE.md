# Continue here (rewritten 2026-09-17; updated 2026-09-18)

Read this first, then `SESSION_HANDOFF.md`, then `CLAUDE.md`.

## NOW (2026-09-18): implementing STRATEGY_DEEP_DIVE Phase 1
- The user said "let's start implementation". This was taken as accepting the recommendations for S1-S9 in `product/STRATEGY_DEEP_DIVE.md` §P (tell them so; adjust if they object).
- **Phase 1 order:** (1) insight engine → (2) one hero number on Today → (3) 5-item nav (Today · Month · Ahead · Money · Activity + Add) → (4) month review → (5) import screen.
- **Phase 1 is DONE (2026-09-18).** Next: Phase 2 per `STRATEGY_DEEP_DIVE.md` §H. Recommended start: the forecast service (§I1) + Ahead's 12-month view and money-unlock calendar. Ask the user before starting.
- **Watch the usage limit:** update this section after every finished piece.

### Progress log
- **(1) Insight engine: DONE 2026-09-18.** Verified with the backend compile, tsc + build, a read-only `GET /insights` (real data: 0 items, correct - nothing due in September), a Today screenshot and Postman `node --check`.
  - Backend package `com.finance.insight`:
    - `Insight`, `InsightType`, `InsightAction`, `Wording` (₹ Indian grouping, "5 Oct", "in 3 days"), `FinancialContext` (built once per request), `InsightService` (rank: severity → date → rupees; caps Today 3 / Month 5), `InsightController` (`GET /api/v1/insights?surface=TODAY|MONTH`), `dto/InsightListResponse`.
    - Rules in `insight/rules`:
      - `PlanItemRule`: Tier 1 plan rows, worded per kind: OVERDUE, DUE_SOON, NEEDS_AMOUNT, NEEDS_REVIEW, UNVERIFIED, INCOME_LATE, PLANNED_ITEM_MISSED.
      - `ShortfallRule`: per spending account, from its projection.
      - `CardBillRule`: due within 5 days, or overdue (backlog 3.2).
      - `GoalBehindRule`: the top goal only.
  - Frontend:
    - `components/InsightList.tsx` (one renderer; actions map to Settle sheet / instance page / confirm / pre-filled transfer / route), `services/insightService.ts`, `types/insight.ts`.
    - Today uses `InsightList` (Needs you + goal card replaced). Months (current month) uses it with a "Next: …" calm note.
    - **Deleted:** `NeedsYouCard.tsx`, `GoalPaceCard.tsx`, `NeedsYouZone.tsx`.
  - Not built: dismiss/snooze (deferred table). Accounts "Needs a look" and Debts "Needs a look" still invent their own checks; fold them in when those pages become Money tabs (piece 3).
  - Postman folder **Insights** (illustrative examples).
  - **Not seen with real items yet:** they'll appear from 28 Sep. Check the Today list then.
- **(2) One hero number: DONE 2026-09-18.** Verified with tsc + build and Today screenshots.
  - Today's hero is now **"Free until salary · <date>"** (`FreeUntilSalaryHero.tsx`; the server's realBalance, amber if negative).
    - Beneath: "₹X a day until salary · spent today · ₹Y left today".
    - Then "Then salary: +₹57,700 expected on <date> - not counted until it arrives" (next cycle's `incomeExpectedTotal`).
    - "How is this worked out?" opens `PositionStatement` (its total row is renamed "Free until salary").
  - `RoomLeftHero.tsx` deleted. Today's columns are equal width, so Coming up no longer truncates.
  - Months' crux is renamed "Free until salary" (same figure as Today).
  - Future months: the big "Planned for this cycle" total is removed (it disagreed with the outline); `PlannedAhead` now shows only the payment count and "needs an amount".
  - Guides, primer and account form use the new names (no more "Room left" / "Real balance" on screen).
- **(3) 5-item nav: DONE 2026-09-18.** Verified with tsc + build and screenshots (/money, /debts redirect, /ahead).
  - The rail is now **Today · Months · Ahead · Money · Ledger** plus the Add button.
    - Kept "Ledger" rather than "Activity": the rename was optional, and the user knows it as Ledger.
    - Each item lights up for its detail pages too (`owns` prefixes in `NavRail.tsx`).
  - **Money** (`routes/MoneyLayout.tsx`): tabs **Overview** (the old accounts page: net worth + every register) · Cards · Debts · Investments, at `/money/accounts|cards|debts|investments`.
  - **Ahead** is at `/ahead` (goals page, eyebrow "Ahead · Goals"). The 12-month view joins it in Phase 2.
  - Old paths `/accounts`, `/cards`, `/debts`, `/investments`, `/goals`, `/plan` redirect. Detail pages (`/accounts/:id`, `/cards/:id`, `/loans/:id`, `/goals/:id`) are unchanged.
  - `addTarget.ts` maps `/money/<tab>` and `/ahead` so Add adds what the tab lists.
  - Not done: Accounts/Debts "Needs a look" zones still have their own checks; fold them into the insight engine later.
- **(4) Month review (read-only): DONE 2026-09-18.** Verified with the backend compile, tsc + build, and a read-only `GET /cycles/1/review` and `/cycles/3/review` on real data.
  - Backend:
    - `CycleReview` + `dto/CycleReviewResponse`, `CommitmentInstanceServiceImpl.review`, `GET /api/v1/cycles/{id}/review`.
    - A shared `bucketOf` (INCOME / PAYMENT / SET_ASIDE / NEITHER) now used by both the shape and the review.
    - `repository.findLargestUnlinked`.
  - Frontend:
    - `features/monthClose/components/ReviewStep.tsx`: Came in / Payments / Set aside / Everything else as Planned vs Happened; Didn't happen; Skipped; Cost more or less; Largest spending outside the plan; "What's different in <next month>" (`PlanChanges` gained a `title` prop).
    - Month close steps are now confirm → resolve → **review** → moved → close.
    - Deleted `WhatHappenedStep.tsx` and `InsufficientHistoryStep.tsx`.
  - "Planned" = the plan as it stands now (no plan lock yet), and the step says so.
  - Postman: Month shape folder → "Month review (against its plan)" (illustrative example, no real personal data).
  - **Not seen in a browser:** Month close opens only after a month ends (September ends 27 Sep).
  - Real-data findings told to the user:
    - The ₹8,000 "Cash transfer" on 6 Sep is filed as Family Support, so probably a genuine expense.
    - "Credit card bill - Aug Statement" ₹6,375 was recorded as an Expense. Card bills should be Transfers from now on, or they're counted twice.
- **(5) Import screen: DONE 2026-09-18.** Verified with the backend compile, tsc + build, a jshell run of the parser on a sample HDFC-style CSV and a card CSV, and an import-page screenshot. **Nothing was uploaded to real data.**
  - Backend:
    - `importing/BankStatementParser.java`:
      - finds the header row itself;
      - reads date + narration + withdrawal/deposit, debit/credit, or amount (+ Dr/Cr);
      - handles 12 date formats, and ₹/commas/brackets in amounts;
      - skips balance/footer lines;
      - keeps an amount with an unreadable date as an error;
      - leaves card credits out with a reason.
    - `POST /imports/statement?accountId=` (multipart); `PATCH /imports/{id}/rows/{rowId}` (`UpdateImportRowRequest`: type, category, clearCategory, toAccountId, description).
    - Commit: `CommitImportRequest.excludeRowIds` (new), and a pre-check that returns 422 IMPORT_ROW_INVALID "N entries need a category…" before creating anything.
    - Categories are pre-filled from the user's last entry with the same description (`TransactionRepository.findFirstBy…DescriptionIgnoreCase…`).
    - The old fixed-format CSV upload (`POST /imports`) still exists.
  - Frontend:
    - `routes/ImportPage.tsx` at `/ledger/import` (the Ledger header has "Import statement"): choose account + CSV → review (tick/untick, type, category or destination, duplicates off by default) → import.
    - `services/importService.ts`, `types/import.ts`.
    - `baseQuery` no longer forces a JSON Content-Type on FormData uploads.
  - Postman folder **Imports** (illustrative).
  - **Not tried with a real bank file yet.** The first real upload may reveal header names the parser doesn't know; extend `columnsOf`.
- **Incident, 2026-09-18:** this file was accidentally emptied by a failed Python rewrite (it opened the file for writing, then errored before writing). It was rebuilt from the session's own record.
  - Lesson: build the new text first; write only once it's complete.

## If you were given the usual start prompt
That prompt says "finish step 4 … then steps 5-12". **It is out of date:**
- Step 4 and steps 1-6 of `product/PRODUCT_AUDIT.md` §8 are **done**, and step 7 (insight engine) was built as Phase 1 piece (1) above.
- Follow the NOW section above.

## Strategy (2026-09-18)
- `product/STRATEGY_DEEP_DIVE.md` is the product strategy, UX and backend deep-dive the user asked for.
  - It holds the diagnosis, competitive gap, USP direction ("the months ahead, with everything promised accounted for"), IA, Today/Month design, loop, roadmap, domain changes, flows, magic moments, metrics, thesis and KEEP/CHANGE/REMOVE/ADD/DEFER.
- Decisions S1-S9 (§P) were taken as accepted when the user said "let's start implementation".
- It was revised the same day with fresh market research:
  - No single feature is unique (Monarch Plus what-if, YNAB Loan Planner and true expenses, Simplifi spending plan, debt apps' freed cash).
  - The edge is the combination + India fit + independence.
  - Manual entry is the biggest risk, so import moves earlier.

## Parked by the user (2026-09-18)
- The discipline/trust plan (`product/DISCIPLINE_AND_TRUST.md`) and its decisions D1-D8 wait until the user brings them up. Don't start it unasked.
- **When it's picked up again:**
  1. Present §10 (D1-D8) and get answers.
  2. Build in the agreed order (recommended: P0 integrity first).
  3. Keep this file current.

## Decisions the user has already made
- **Audit §9:**
  - Optional bills reduce Free until paid or skipped.
  - Obligation sources come before insights.
  - Existing bills are linked, not recreated.
  - Menu consolidation comes later (now happening as Phase 1 piece 3).
  - Logins and billing are Phase 4.
- **2026-09-17:**
  - Planned changes were built before step 7.
  - The ₹17k emergency cash sits in a not-spendable account.
  - The page is renamed "Months".
  - No new tests or SQL until the end (see below).
- **2026-09-18:**
  - Months' plan is grouped by date by default.
  - No test runs either.
  - Start Phase 1 of the strategy.

## Standing rules from the user
- **Current model:** end every reply with it.
- **No new tests and no SQL** (migrations, cleanup or seed scripts) until the end of the product.
  - The discipline plan needs schema, so that's decision D1: ask before writing any migration.
  - **Since 2026-09-18: don't run the test suite either.** Verify with `tsc` + build, the backend compile (`./mvnw.cmd -B -o -q compile`), read-only API checks and headless screenshots.
  - Still update Postman and the docs.
  - No ZZ test rows, since removing them would need SQL.
- **Real data:** never modify the user's data unless they ask; guide them step by step instead.
- **Before any migration:** `mysqldump` the affected tables.
- **Scope:** smallest correct change.
  - Log new gaps in `product/FIX_BACKLOG.md` and tell the user.
  - Act as an expert financial planner and UI/UX designer, and say where you'd differ from the literal ask.
- **Patch scripts:** check whether an edit already applied before re-running a script. A partial re-run once duplicated code, and a failed rewrite once emptied a file.
- **Shell heredocs** containing apostrophes sometimes break in this environment. Write files with the Write tool, or write a script file first.

## Deferred SQL (for the end, or for D1)
- `insight_state` (dismiss/snooze for the insight engine).
- An "amount overridden" flag on `commitment_instances` (backlog 2.9).
- The discipline layer: M1-M10 in `DISCIPLINE_AND_TRUST.md` §2.1.
  - Plan lock, planned amount, plan revisions, change log.
  - Balance and loan checkpoints, goal revisions, recovery plans, month reviews, snapshot plan totals.

## Built on 2026-09-16/17/18 (verified: tests up to 2026-09-17, tsc/build, API checks, screenshots)
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
- **Fix:** a transfer or investment leaving a non-spendable account no longer reduces Free or counts as set aside.
- **Postman folders added:** Bill sources & settlement (live), Expected income (live), Month shape (live), Planned changes (illustrative), Insights (illustrative); plan-progress has a `byDueDate` check.

## Not verified by a person in a browser
- Add/Edit bill: Once, In, Starts, Apply from, Last instalment.
- Received / Record it.
- The onboarding income step.
- The insight list with real items (none exist until 28 Sep).
- Only headless screenshots were taken.
- To take one: `chrome --headless=new --window-size=1440,2600 --virtual-time-budget=10000 --screenshot=<file> http://localhost:5173/<route>`.
- The Vite dev server may need starting: `npx vite --port 5173` in `webapp/frontend/finance-ui`, run in the background.

## The user's open to-dos in the app (as of 2026-09-18)
- **Diwali Bonus ₹46,000:** still *Every year*. Suggest Just once.
- **Links still to make:**
  - SIP Zerodha bill → SIP holding (Investments).
  - Mobile Mom / Health Insurance → **Add EMI to plan** (Debts).
  - RD - Mom → Add instalment to plan, then Last instalment October 2026.
- **Emergency fund contribution:** raise the amount with **Apply from November**, if still wanted.
- **Bike Servicing (28 Sep):** a must-pay bill with no amount. Give it an estimate.
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
