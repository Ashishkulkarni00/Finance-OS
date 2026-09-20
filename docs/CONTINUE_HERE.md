# Continue here (rewritten 2026-09-17; updated 2026-09-19 — round 6)

**This top block is the whole handoff contract: a session started with the single word
"continue" must be able to act on it with no other input.** Read `SESSION_HANDOFF.md` next
for how-to-work-with-the-user context, then `CLAUDE.md`'s rules. Everything below this
block is history/detail — useful, but not required to know what to do next.

## NEXT ACTION
1. **Goal payments are built and click-verified (2026-09-19)** - see section below. What's
   left needs the user: ask them to add the real October bookings payment on "Bangalore trip"
   (goal 6) from its page, then read `GET /api/v1/goals/6` and check `schedule` /
   `spentAmount` / `requiredPerMonth` against the hand-worked expectation: target ₹12,000 by
   31 Oct, ₹8,000 on 5 Oct, nothing saved → bookings SHORT by ₹8,000; "The rest" ₹4,000 on
   31 Oct, neededByThen ₹12,000, SHORT by ₹12,000; requiredPerMonth ₹12,000 (both dates are
   within a month). If it differs, the bug is in `GoalServiceImpl.schedule`/`requiredByTightestDeadline`.
   Then save that real response as the Postman example on "Plan a goal payment" and
   "Get goal with payments (schedule)" (currently no-payment example only).
2. Still unconfirmed by the user: one real save on a commitment edit (rounds 4-5).
3. Then Phase 2 of `product/STRATEGY_DEEP_DIVE.md`, one item at a time: **(4) reserve-ahead**
   needs a schema change - **ask first** - or skip to (5) what-if / (6) get back on track /
   (7) month-end surplus suggestion (no schema).

## WAITING ON THE USER
- One real save on a commitment edit (rounds 4-5), and trying goal payments on the trip.
- Phase 2 item (4): allow the one-column `reservations` migration now, or skip to (5)-(7)?
- The parked discipline/trust plan (`DISCIPLINE_AND_TRUST.md`, D1-D8) waits until they raise it.

## Goal payments + goal edit/archive/delete, 2026-09-19 (round 6)
User: goals had no edit/update/delete; and "a Bangalore trip in December, but bookings must
be made in October - partial amount early, the rest when planned. How do we manage that?"
**Design (no schema change):** a goal-linked commitment *paid as an expense* is a **goal
payment** - money the goal pays out on a date (bookings 5 Oct); a goal-linked Saving/transfer
still *funds* the goal. Whatever part of the target no payment covers is "The rest", due on the
goal date. Each payment is an ordinary one-off commitment, so it shows on Months in its month,
reduces Free there, appears in Ahead's forecast, and is settled normally.
- **Backend (Java only, compiled, not tested - no-tests rule):**
  - `SourceBillSync.applyGoal`: EXPENSE + GOAL is left as entered (no forced transfer, no
    goal-account requirement); still ended when the goal is archived/deleted.
  - `GoalServiceImpl.toView`: reads the goal's EXPENSE-linked bills (optional setter-injected
    `CommitmentRepository` + `CommitmentInstanceRepository`, so the old constructor still works),
    one dated payment each (first occurrence, else first due date; SKIPPED excluded); `spent` =
    confirmed amounts; progress = (saved + spent)/target; new `schedule` lines walked in date
    order with cumulative `neededByThen` vs saved → PAID / COVERED / SHORT / AMOUNT_UNKNOWN;
    `requiredPerMonth` = max over SHORT lines of shortBy ÷ max(1, months to that date) (no
    payments → old formula unchanged). New `GoalScheduleLine`; `GoalView`/`GoalResponse`/
    `GoalMapper` carry `spentAmount` + `schedule`.
  - **FIX_BACKLOG 2.11 fixed** in `PositionServiceImpl.leavesHeldMoney`: an EXPENSE only
    reduces Free when paid from a spendable account or a credit card (a booking paid from a
    trip savings account was already counted when moved there). Checked: none of the user's
    current expense bills leave from a non-spendable account, so today's figure is unchanged.
- **Frontend:** `goalService` + update/archive/unarchive/delete mutations and wider cache tags;
  `types/goal.ts` (`spentAmount`, `schedule`, `UpdateGoalRequest`); `AddGoalSheet` has an edit
  mode (`goal` prop; "Tracked in" → "Saved in"; can't unlink - API has no clear); new
  `GoalPayments.tsx` (schedule list, "+ Add a payment", "Plan it as a payment too" for The
  rest); `GoalDetailPage` rewritten (Edit/Archive/Delete, Saved / Already paid / Target / Set
  aside a month); `AddCommitmentSheet` preset `kind: 'GOAL_PAYMENT'`; `GoalFunding` excludes
  EXPENSE-linked bills; `EditCommitmentSheet` keeps a goal-linked Payment as a payment (only
  non-expense links become transfers); goal rows on Ahead show "Next: 5 Oct · ₹8,000";
  Goals guide has the trip case.
- **Click-verified 2026-09-19** in headless Chrome with every write blocked (CDP method): goal
  page renders (Edit / Archive / Delete, Payments empty-state, Saved in); Delete shows its
  confirm; Edit goal sends `PATCH /goals/6 {name,targetAmount,targetDate}`; "+ Add a payment"
  sends `POST /commitments` with `settleAs:"EXPENSE"`, `sourceType:"GOAL"`, `sourceId:6`,
  `activeFrom 2026-09-28`, `activeTo 2026-10-27` for a 5 Oct payment.
- **Bug found by that check and fixed:** Edit goal's Save did nothing for a goal with no
  account - the API omits null `linkedAccountId`, the schema needs null (same class as the
  commitment `toAccountId` bug). `?? null` in `AddGoalSheet`; `GoalResponse.linked*` typed optional.
- Postman: Goals → "Get goal with payments (schedule)" (real example, no payments yet) and
  "Update goal"; Bill sources → "Plan a goal payment (expense linked to a goal)"; variable
  `tripGoalId=6`. The last two have assertions but no example response (not sent).

## Edit Save fix, 2026-09-19 (round 5) - reproduced in a real browser, then fixed
User: "edit on income, the save button is not working … maybe when I change Changes start".
**Reproduced** by driving the live Months page in headless Chrome over the DevTools protocol
(Node 22's built-in WebSocket + `chrome.exe --remote-debugging-port`, no installs), with every
non-GET `/api/*` request intercepted and *failed* in the browser - so nothing was written.
- **Root cause:** the API leaves null fields out of the JSON, so a commitment with no "Into"
  account (every Payment and Income - all but Saving/Investing) arrived with `toAccountId`
  *undefined*; the form's schema (`z.number().nullable()`) rejects undefined, on a row that is
  hidden for those types - so Save silently did nothing. Not income-specific: Home Support
  failed the same way. Transfers (Emergency fund) worked, which is why "other places" did.
- **Fixed:** `toAccountId: rule.toAccountId ?? null` in Edit's defaults; `CommitmentResponse.toAccountId`
  typed optional so the compiler now catches this (it flagged two more harmless spots, normalised).
- **Never silent again:** Edit's `handleSubmit(onSubmit, onInvalid)` names the field and the
  problem above Save for any failed check.
- **"Changes start"** only offers dates after the commitment's own start (was offering
  "Payments from 28 Sep 2026" for commitments starting 28 Sep - same as "Now").
- Category picker in the commitment form now creates Income categories for income.
- Verified: after the fix the browser sends the PATCH for Salary credit and Home Support, with
  and without "Changes start" (then blocked). The real save still needs the user's click.

## Commitment form rework, 2026-09-19 (round 4 - see FIX_BACKLOG.md "Done")
User: "Add bill" should be "Add commitment"; the ⓘ texts didn't say what to pick ("Paid as");
"Varies" had no amount input when adding; "Starts: October 2026" read as "Sep to Oct?";
Edit's "Follows" meant nothing (and offered loans/goals for a salary); "Apply from" unclear;
"How it works" didn't make sense. Frontend only, no API/schema change:
- **Words:** "Add a bill" → "+ Add a commitment" / "Edit bill" → "Edit" (also the left rail's
  Add button on Months, `addTarget.ts`, and Today's "Coming up" tag, both 2026-09-19); "Paid as" → **Type**
  (Payment / Saving / Investing / Income, with a hint saying which to pick when); Amount is
  "Fixed" / "Changes each month"; "Leaves from" → "Paid from"; "Why" → "Note". Every row that
  isn't self-explanatory has an ⓘ written as "pick X when…" (`CommitmentFields.tsx`).
- **First payment** (was "Starts"): a *calendar* month + year with the real date beside it
  (`PaymentMonthPicker.tsx`). The salary month is derived from that date
  (`salaryMonthContaining` in `lib/dates.ts`), never shown as "28 Sep – 27 Oct". Same for a
  one-off's "When", in Add and Edit. `SalaryMonthPicker.tsx` is now unused by these forms.
- **First amount** (Add, "Changes each month" only): optional; same Save creates the rule, finds
  its first occurrence (`/cycles/for-date` → `/cycles/{id}/commitment-instances`) and PATCHes
  its amount. Rule saved but amount failed → the success screen says so.
- **This time** (Edit): the occurrence's own amount, now a row under Amount (was a separate box).
- **Linked to** (was "Follows"): moved to the bottom, hidden for income, plain hint.
- **Changes start** (was "Apply from"): "Now - this one and every one after" / "Payments from
  28 Oct 2026".
- **How Months works** + the primer rewritten: what the page answers, words you'll see, what
  each Add field means, six real questions. Removed stale references ("Runs until",
  "Needs you" tiers, "Starts").

## Bug fix, 2026-09-19, rounds 1-3 (see FIX_BACKLOG.md "Done" for full detail)
User reported: on Months, editing a bill with an unknown amount and clicking Save appeared
to do nothing, and there was no way to give a "Varies" bill's *current* occurrence a known
amount while keeping it Varies for future months.
- **Round 1 fix:** two validation early-exits in `EditCommitmentSheet`'s submit handler
  returned silently with zero visible feedback - fixed by showing a message above the Save
  button on any rejected save. Also added the "This occurrence's amount" inline box to Edit
  bill (reuses the existing per-instance amount endpoint, no API change). Real fix, but not
  what the user was actually hitting.
- **User retested and reported the real symptom:** "clicking it refreshes page and save
  changes does nothing" - a full page reload, which round 1 could not explain.
- **Round 2 root cause:** the box added in round 1 put `InstanceAmountForm`'s own `<form>`
  inside `EditCommitmentSheet`'s outer `<form>`. Nested `<form>` elements are invalid HTML;
  here it made the browser's native submit take over on click, causing the reload and
  leaving the outer Save button unresponsive.
- **Round 2 fix:** rewrote `InstanceAmountForm.tsx` to never render a `<form>` - explicit
  button `onClick`, and an `onKeyDown` handler that calls `preventDefault`/`stopPropagation`
  on Enter so it can never bubble up and trigger the outer form. Confirmed by grep that its
  other two call sites (Months' inline Estimate row, Today/Month's "needs an amount"
  blockers) don't depend on it being a literal `<form>`.
- **User retested round 2 and named the real complaint**: a redundant separate "Set amount"
  button next to "Save changes" - typing an amount and clicking Save changes should just
  save it ("save the delta"), with no second button. Also asked for the same ability when
  adding a brand-new bill.
- **Round 3 fix:** removed `InstanceAmountForm` from Edit bill entirely - the box is now a
  plain input holding local state (prefilled from a new `instanceAmount` prop, threaded from
  `PlanZone.tsx`/`CommitmentDetailPage.tsx`, both of which already have the instance in
  hand). `onSubmit` now updates the rule, then - only if the amount changed and is non-empty
  - saves the amount too, before closing; a second-step failure keeps the sheet open with
  "The bill saved, but this occurrence's amount didn't: …" rather than closing silently.
  `InstanceAmountForm` itself is untouched and still correct as a standalone component for
  Months' inline "Estimate" row and the Today/Month "needs an amount" blockers, where a
  single small save genuinely is the whole action.
- **Also added:** the same box on Add-a-commitment's post-save success screen for a new
  Varies bill, using the untouched standalone `InstanceAmountForm` (can't be one submit
  there - the occurrence doesn't exist until the rule is created server-side).
- Verified all three rounds with `tsc -b --noEmit` + `vite build` only (both clean), plus a
  static headless-Chrome screenshot of `/month` after round 2 (page renders correctly, but a
  screenshot cannot verify click behavior). **No interactive browser-automation tool is
  available in this session** - despite `chrome-browser`/`built-in-browser`/`computer-use`
  skills being listed, their underlying tools didn't surface via ToolSearch. This is why every
  round so far has needed the user's own hands to actually confirm.

## DON'T DO
- Don't write or run tests. Don't write SQL/migrations without asking (see Deferred SQL).
- Don't modify the user's real data. Test only via read-only GET calls on real data, or
  reason about it — no ZZ/test rows (no SQL to clean them up).
- Don't restart the Vite dev server (`:5173`) proactively — it was killed once this session
  by the harness for low memory, and the harness explicitly said not to restart it
  unless asked. Verify with `tsc -b --noEmit` + `vite build` + backend compile + curl
  against the running `:8080` API instead of screenshots, unless the user asks for one.
- Don't re-litigate S1-S9 or the Phase 1 recommendations — already accepted.

## Model note
The user switched the default model to **Sonnet 5** via `/model` on 2026-09-19 (was Opus 5
for all of 2026-09-17/18's work). No behavior change implied by this beyond the standing
"state the current model at the end of every reply" rule.

## Surplus suggestion (new idea, 2026-09-18, not yet in STRATEGY_DEEP_DIVE.md)
User asked (open-ended): does/should the engine catch month-end **surplus** — money left
over after a month closes — and push it toward the current top-priority goal (e.g.
"aggressive emergency-fund pile-up")? Answer given: not built yet, but designed inline:
- Trigger at month end / cycle close, never mid-month.
- Surplus = spendable balance − what must leave before next salary − a buffer (account
  minimum, or user-set) — not just "bank balance on the 27th".
- Suggest moving it to the top-priority goal (today: Emergency fund), showing the goal-date
  effect ("brings Feb 2028 → Jan 2028"); user confirms, it's a one-off transfer, never
  automatic; goal chains (§I8) let the suggested target advance once EF is full.
- Should NOT change the recurring monthly plan amount — it's an extra, not a revised
  commitment (ties into the parked integrity model's PLAN vs COMMITMENT distinction).
- Proposed home: Phase 2, next to Get back on track, as a new insight-engine rule
  (`SurplusAvailable` or similar) — reuses `CycleReview`/`CycleShape` figures + goal
  priority; needs no schema change unless a custom buffer amount must be saved (then:
  deferred SQL, a column on `User` or `Account`).
- **Not yet formally added to `STRATEGY_DEEP_DIVE.md` §H/§Q** — do that when it's actually
  built, or if the user asks to see it in the doc first.

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
- **Reserve-ahead (§I7, Phase 2 item 4):** one nullable column linking a `Reservation` to
  the `Commitment` it's earmarking for (e.g. `reservation.commitment_id`), so "Reserve
  monthly" on an annual bill can find/update its own reservation. Small and additive, but
  it's a migration — **ask the user first**, per the standing no-SQL rule.
- The discipline layer: M1-M10 in `DISCIPLINE_AND_TRUST.md` §2.1.
  - Plan lock, planned amount, plan revisions, change log.
  - Balance and loan checkpoints, goal revisions, recovery plans, month reviews, snapshot plan totals.

## Phase 2 progress (2026-09-19)
- **(1) Forecast service — DONE.** `GET /api/v1/forecast?months=` (default 12, capped 24).
  - New package `com.finance.forecast`: `ForecastMonth`/`ForecastUnlock`/`ForecastAnnualItem`/
    `ForecastResult` (pure records) → `ForecastServiceImpl` → `ForecastMapper` →
    `dto/ForecastResponse` → `ForecastController`.
  - **Reuses, doesn't duplicate:** walks forward from `cycleService.resolveCurrent()` one
    calendar month at a time, using `CommitmentRepository.findActiveForCycle` +
    `CommitmentInstanceGenerator.occursIn/dueDateWithin` against a **transient, unpersisted**
    `Cycle` (no id, never saved) — the exact same rule engine real cycles use, just never
    written to the DB.
  - **Extracted `CommitmentBucketClassifier`** (was a private `bucketOf`/`Bucket` enum inside
    `CommitmentInstanceServiceImpl`) into its own component + public `CommitmentBucket` enum,
    so the live month's shape/review and the forward forecast share one classification. This
    is a refactor of existing behaviour, not a change to it — re-verify shape/review figures
    haven't shifted if you touch this again.
  - **Important, documented limitation:** the forecast is a *pure rule projection* — it never
    reads `CommitmentInstance` rows, so it doesn't know about a variable bill's per-month
    estimate (set via "Estimate" on the live plan). Even month 0 (the current cycle) can
    disagree with the live `GET /cycles/{id}/shape` for this reason. This is intentional
    (labelled as an assumption, not blended with actuals — STRATEGY_DEEP_DIVE §V) but worth
    remembering if a user reports "the numbers don't match Today's".
  - **Bug found and fixed during verification:** a one-off item's own end (e.g. a single
    month's ₹30,000 top-up) was showing up as a false "money freeing up" unlock. Fixed with
    an `isOneOff` check mirroring the frontend's own heuristic (MONTHLY frequency, activeTo −
    activeFrom ≤ 31 days) — only a genuinely recurring bill ending counts as an unlock now.
  - Verified: backend compile, live `curl` against real data (12 months), Postman
    (`Forecast` folder, real response saved as the example, re-captured after the fix).
- **(2) Ahead's 12-month view — DONE.** `features/ahead/components/AheadForecast.tsx`,
  wired into `routes/PlanPage.tsx` above the Goals section (page still titled "Ahead" in the
  nav; the Goals sub-header stays "Ahead · Goals"). Shows 3 months collapsed, "Show all 12".
  Each month: flexible (hero-ish figure), in/committed/set aside, unknown-amount count,
  annual/quarterly items due that month. States its own limitation on-screen ("what your
  plan says would happen if nothing changes... this month's real figure is on Today").
- **(3) Money-unlock calendar — DONE, folded into (2).** `UnlockCalendar` inside the same
  `AheadForecast.tsx` — a top summary line ("₹X/month becomes free over the next 12 months")
  plus a dated list, built entirely from `forecast.months[].unlocks` (no separate endpoint).
  Renders nothing when there are nothing to show (quiet-by-default, matches the `empty:hidden`
  pattern used elsewhere) rather than a placeholder.
- Verified together: `tsc -b --noEmit` clean, `vite build` clean. **Not screenshotted** — the
  Vite dev server was killed by the harness for low memory and the harness said not to
  restart it; verification relied on tsc/build/curl instead (see DON'T DO above).
- New types/service: `types/forecast.ts`, `services/forecastService.ts` (tags: Commitment,
  CommitmentInstance, Loan, Goal, Cycle — anything that can change the projection).

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
