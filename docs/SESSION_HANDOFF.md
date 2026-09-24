# Kosh: session handoff

Rewritten from scratch 2026-09-17; stack, feature map and data snapshot refreshed 2026-09-23.

**Reading order:**
1. `CONTINUE_HERE.md`: what to do next, the user's rules, open to-dos.
2. This file: how to work, the stack, what exists.
3. `CLAUDE.md`.
4. `product/FIX_BACKLOG.md`.

**Current design work:**
- `ROADMAP.md` Phase 2 — `GET /financial-state` + the Pulse. Not started.
- `product/DISCIPLINE_AND_TRUST.md` (parked by the user 2026-09-18).
- `product/STRATEGY_DEEP_DIVE.md` is **superseded** (`DOC_INDEX.md` §2) — history, not a brief.

---

## 1. The user, and how to work with them
- **Who it's for:** Kosh is a personal financial operating system for one real user.
  - Salary is ₹57,700 on the 28th, so each month runs from the 28th to the 27th.
  - They use it with real data from **28 Sep 2026**.
- **Your role:** act as an **expert financial planner and UI/UX designer**.
  - The user's words are the problem statement.
  - Recommend, and say where you'd differ.
  - When asked "what do I do", give step-by-step clicks that match the actual UI.
- **Every reply ends with the current model.**
- **Scope:**
  - Smallest correct change.
  - Don't fake in the frontend what needs the backend, and don't touch the backend when the API already covers it.
  - Log new gaps in `FIX_BACKLOG.md` and tell the user.
- **Real data lives in the dev DB.**
  - Read it freely (GET); don't change it unless asked.
  - Since 2026-09-17: no test records, no SQL, no new tests (see CONTINUE_HERE).
- **Help text:**
  - An ⓘ tooltip is one sentence saying what to fill in.
  - Explain on the page and in the form, not in a separate guide.
  - Pre-fill what can be calculated; never overwrite what the user typed.
- **Excel `G:\Finance\Finance.xlsx`:** reference only. Never edit it or shape code around it.
- **Git:** not a repo. Commit or push only if asked.

## 2. Stack and commands
- **Backend:** `webapp/backend/finance`
  - Spring Boot 4.1.1, Hibernate 7, Jackson 3 (`tools.jackson.*`), Flyway, MySQL 8.
  - The latest migration is **V20** (`insight_state`). V18 plan revisions · V19 insurance
    policies · V20 notification state — each asked for explicitly; the freeze is back on.
  - Tests: `JAVA_HOME=C:/Users/DELL/.jdks/corretto-21.0.4 MAVEN_OPTS="-Xmx512m" ./mvnw.cmd -B -o test`. Last known **125/125**, but **frozen since 2026-09-17** and not run since; Phase 1.1-1.4 added none. Treat that number as history, not as a current pass. Use `test-compile` — compiling is not running.
  - Dev server: `:8080` with devtools; it reloads on compile.
    - A test build can trigger a restart. Wait with an until-loop on `/api/v1/health`, not `sleep`.
  - MySQL client: `/c/Program Files/MySQL/MySQL Server 8.0/bin/`. Credentials: `src/main/resources/application-local.properties`.
  - JSON omits nulls (`non_null`).
- **Frontend:** `webapp/frontend/finance-ui`
  - React, Vite, TypeScript, RTK Query, Tailwind v4. The dev server is on `:5173`.
  - Verify with `npx tsc -b --noEmit && npx vite build`.
  - No money arithmetic in the browser; date maths and comparisons are fine.
  - No frontend test runner. Pure `.ts` helpers can be run with `node --experimental-strip-types`.
- **Postman:** `webapp/postman/Financial-Operating-System.postman_collection.json`
  - Tab-indented, no trailing newline.
  - Update it for every API change and check its scripts with `node --check`.
- **Project rules (CLAUDE.md):**
  - Money is BigDecimal / DECIMAL(15,2) / a string in JSON.
  - Derived values are never stored.
  - Soft delete only; `user_id` on every query.
  - Never log amounts.
  - Missing data → INCOMPLETE, never a guess.
  - Money is never counted twice; the user is never judged.

## 3. What exists (feature map)
- **Navigation:** Today · Months · Ahead · Money (tabs: Overview · Cards · Debts · Investments · **Cover**) · Ledger, plus Add. Cover added 2026-09-21 (ADR-0016).
- **Needs you** (`/needs-you`, 2026-09-23): every insight, uncapped, grouped by what it costs to ignore. Reached from the "See all" on Today's and Months' own lists, which are unchanged. A **drill-down of Today, not a sixth tab** — Today's job is already "where do I stand now". Polls every 30s; a row opens what it is about.
- **The app speaks on write** (ROADMAP 1.4, ADR-0017): recording or settling closes the sheet and reports what it did in a toast, bottom-right — what is left to spend today before → after, free until salary, and anything that just crossed a line. `QUIET` expires in 10s and is held while hovered; `HELD` waits. A warning is announced **once, when it becomes true**, and once again when it stops; `insight_state` is the memory.
- **Ahead (since 2026-09-19):** a 12-month forecast (`GET /forecast`, a pure rule projection - not blended with actuals) with a money-unlock calendar, above the Goals section. Reserve-ahead, what-if and Get back on track are next.
- **Accounts:**
  - Typed accounts (bank, cash, card, loan, investment); "spending money?" decides what counts as held.
  - "Update balance" re-bases the opening anchor. This is design hole H6.
  - Net worth has a confidence label.
- **Ledger:** double-entry transactions (income, expense, transfer, investment, refund), categories with Income/Fixed/Flexible groups, and **Import statement** (`/ledger/import`: bank/card CSV → review → import, categories remembered from past entries).
- **Months** (`/month`, was "This Month"), for any salary month:
  - **MonthShape line:** comes in − committed − set aside = flexible, then spent and pace.
  - **Overview:** free this cycle, money in and out.
  - **Needs you.**
  - **Plan:**
    - What's different this month, and a Coming-in block (salary).
    - Bills grouped **by date (default)** or by category, with Settle / Record it / Received / Skip.
  - Day-to-day spending, and Month close (steps: confirm balances → resolve → **review against the plan** → what moved → close, which freezes a snapshot of actual totals).
- **Bills (commitments):**
  - Rule → monthly rows.
  - Paid as expense / transfer / investment / income, and may follow a loan, holding or goal.
  - One-offs, apply-from, month pickers, optional + skip, auto-matching, reminders.
  - Edit reconciles unpaid rows; paid rows never change.
- **Today:** Room, Real Balance derivation, Needs you (with cover per account), Coming up (incl. expected income), goal to push.
- **Cards:** credit cards (terms, statements with remaining/status, unbilled, EMIs on card) and debit cards. Owed on cards is subtracted from Real Balance.
- **Debts:** current-position loan model (V13), an estimator, Use these / Keep mine, link / add EMI bill, prepayment planning. **Outstanding derives from recorded payments, not the calendar** (ADR-0018); an unrecorded EMI is flagged rather than assumed.
- **Investments:** holdings, value check-ins, monthly instalment → bill.
- **Cover:** insurance policies — what you're covered for, what it costs, when it renews. **Cover is never an asset and never touches net worth** (ADR-0016). No policy recorded yet.
- **Goals:** tracked in an account or reservation, pace, "Funded by" (monthly and one-off top-ups).
- **Onboarding:** pay day → accounts → what comes in → what leaves → reservations.
- **Docs:** read `DOC_INDEX.md` before citing anything. Living set is ~12 files; everything in
  `docs/product/` except `FIX_BACKLOG.md` is history (`PRODUCT_AUDIT.md`, `PLANNED_CHANGES.md`,
  `INFORMATION_ARCHITECTURE.md` and the rest carry supersession banners).
  `DISCIPLINE_AND_TRUST.md` is parked, not next.

## 4. The user's data (read-only snapshot, refreshed 2026-09-23)

> **₹1,597 of today's spending is six test rows** (ids 66-71, all described "test", dated
> 2026-09-23) the user created while checking the write-effect toast. They sit in the
> 28 Aug - 27 Sep cycle, which is **not** a month being used for real, and the user has been
> asked to delete them. Subtract them before reading anything into Real Balance or net worth.
> Figures below that depend on them are marked.
- **Accounts:**
  - HDFC Salary ₹8,788 (spending), IDBI Saving ₹709 (spending).
  - HDFC Premium ₹33,000: the emergency fund, not spending money.
  - Cash wallet ₹17,000: bank type, not spending money; to be deposited into the EF.
  - HDFC Money back credit card.
  - SIP - Zerodha (investment).
  - Loan accounts for 5 loans.
- **Loans:**
  - Bank-paid: HDFC bike ₹6,145 (to Oct 2029), IDBI education ₹3,417 (to Nov 2027), Fibe "Coding ninjas" ₹4,983 (to Dec 2027). All three are **linked** to their bills.
  - Card-paid on HDFC Money back: Mobile Mom ₹2,648 (to Feb 2027) and Health Insurance ₹3,998 (to Sep 2027). Both **now have bills** (added 21 Sept).
- **Holdings:** SIP - Zerodha ₹2,500/month (ledger-tracked) and RD - Mom ₹1,000/month.
  **The RD's bill was deleted by the user on 2026-09-22**, so October carries no RD at all.
  The RD is tracked *outside the ledger*, which is why its bill could only ever settle as
  `EXPENSE` (`SourceBillSync.java:149`) and why its ₹9,000 is invisible to net worth. It
  cannot be fixed by editing — see CONTINUE_HERE's parked withdrawal design.
- **Goals:** Emergency fund ₹33,000 of ₹2,00,000 by 31 Aug 2027, kept in HDFC Premium · Bangalore trip ₹0 of ₹12,000 by 31 Oct 2026, unfunded. **Both read `ON_TRACK`, and both are wrong** — see CONTINUE_HERE.
- **Card:** HDFC Money back, limit ₹1,31,000, statement 21st, due 10th. ₹55,302 of EMI principal is blocked against the limit, so ₹75,698 is actually available.
- **Plan from October:**
  - Salary ₹57,700 on the 28th into HDFC Salary (Salary category exists).
  - EF contribution ₹10,000 (transfer to HDFC Premium).
  - One-offs: EF top-up ₹17,000 from Cash wallet (2 Oct) and EF top-up ₹30,000 (3 Nov). Diwali Bonus ₹46,000 (2 Nov, still *every year*).
  - Bills: **all 5 EMIs** (the 3 bank ones plus Mobile Mom ₹2,648 and Health Insurance ₹3,998, both billed to the card — added 21 Sept), Electricity (varies), Home Support ₹10,000, TV+WiFi ₹1,000, Mobile recharges (varies), Hair cut ₹500, Petrol ₹2,500, SIP Zerodha ₹2,500, RD – Mom ₹1,000, Spotify ₹139, Anthropic subscription ₹2,373 (on the card, **currently archived**).
- **October shape (2026-09-23):** comes in ₹57,700 · committed ₹41,616 · set aside ₹12,500 ·
  **flexible ₹3,584** · 0 unknown amounts. Ahead's forecast reports the same figures as
  Months for any month that has occurrences.
- **Today's Real Balance:** ₹8,000 *(₹9,597 less the ₹1,597 of test rows)*. Room ₹1,919.40 a
  day with 5 days to salary; ₹322.40 left today. **Net worth −₹2,77,192** — assets ₹62,900,
  liabilities ₹3,40,092 *(also test-row affected; it was −₹2,75,595 before them)*.
- **Open questions and clean-ups:** see CONTINUE_HERE → "The user's open to-dos".

## 5. Open backlog (full detail in FIX_BACKLOG.md)
- **1.5:** Net worth doesn't move as EMIs are paid — becomes visible **5 Oct**.
- **2.1:** A goal can't track an investment.
- **2.2:** No must-pay total or suggested EF target.
- **2.6:** Month close counts an early salary by date.
- **2.8:** A prepayment doesn't update the loan.
- **2.9:** A one-month amount change on a fixed bill doesn't stick (deferred SQL).
- **2.11:** An expense bill from a non-spendable bank still reduces Free.
- **3.2:** Card bills are missing from Needs you.
- **3.3:** A manual card-bill plan item would double count.
- **4.1-4.6:** Rough edges (settings 500, devtools restart, varies keeps amount, Postman gaps, two orphan postings). *4.3 closed by ADR-0018.*
