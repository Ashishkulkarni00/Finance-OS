# Kosh: session handoff

Rewritten from scratch 2026-09-17 (end of day).

**Reading order:**
1. `CONTINUE_HERE.md`: what to do next, the user's rules, open to-dos.
2. This file: how to work, the stack, what exists.
3. `CLAUDE.md`.
4. `product/FIX_BACKLOG.md`.

**Current design work:**
- `product/STRATEGY_DEEP_DIVE.md` (2026-09-18; decisions S1-S7 pending).
- `product/DISCIPLINE_AND_TRUST.md` (parked).

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
  - The latest migration is **V17**.
  - Tests: `JAVA_HOME=C:/Users/DELL/.jdks/corretto-21.0.4 MAVEN_OPTS="-Xmx512m" ./mvnw.cmd -B -o test`, **125/125**.
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
- **Accounts:**
  - Typed accounts (bank, cash, card, loan, investment); "spending money?" decides what counts as held.
  - "Update balance" re-bases the opening anchor. This is design hole H6.
  - Net worth has a confidence label.
- **Ledger:** double-entry transactions (income, expense, transfer, investment, refund), categories with Income/Fixed/Flexible groups, an import backend with no screen yet.
- **Months** (`/month`, was "This Month"), for any salary month:
  - **MonthShape line:** comes in − committed − set aside = flexible, then spent and pace.
  - **Overview:** free this cycle, money in and out.
  - **Needs you.**
  - **Plan:**
    - What's different this month, and a Coming-in block (salary).
    - Bills grouped **by date (default)** or by category, with Settle / Record it / Received / Skip.
  - Day-to-day spending, and Month close (freezes a snapshot of actual totals).
- **Bills (commitments):**
  - Rule → monthly rows.
  - Paid as expense / transfer / investment / income, and may follow a loan, holding or goal.
  - One-offs, apply-from, month pickers, optional + skip, auto-matching, reminders.
  - Edit reconciles unpaid rows; paid rows never change.
- **Today:** Room, Real Balance derivation, Needs you (with cover per account), Coming up (incl. expected income), goal to push.
- **Cards:** credit cards (terms, statements with remaining/status, unbilled, EMIs on card) and debit cards. Owed on cards is subtracted from Real Balance.
- **Debts:** current-position loan model (V13), an estimator, Use these / Keep mine, link / add EMI bill, prepayment planning.
- **Investments:** holdings, value check-ins, monthly instalment → bill.
- **Goals:** tracked in an account or reservation, pace, "Funded by" (monthly and one-off top-ups).
- **Onboarding:** pay day → accounts → what comes in → what leaves → reservations.
- **Design docs** in `docs/product/`:
  - `PRODUCT_AUDIT.md`: 12 steps, 1-6 done.
  - `PLANNED_CHANGES.md`: built.
  - `DISCIPLINE_AND_TRUST.md`: next.
  - `FIX_BACKLOG.md`, `DOMAIN_MODEL.md`: kept current.

## 4. The user's data (read-only snapshot, end of 2026-09-17)
- **Accounts:**
  - HDFC Salary ₹8,788 (spending), IDBI Saving ₹709 (spending).
  - HDFC Premium ₹33,000: the emergency fund, not spending money.
  - Cash wallet ₹17,000: bank type, not spending money; to be deposited into the EF.
  - HDFC Money back credit card.
  - SIP - Zerodha (investment).
  - Loan accounts for 5 loans.
- **Loans:**
  - Bank-paid: HDFC bike ₹6,145 (to Oct 2029), IDBI education ₹3,417 (to Nov 2027), Fibe "Coding ninjas" ₹4,983 (to Dec 2027). All three are **linked** to their bills.
  - Card-paid on HDFC Money back: Mobile Mom ₹2,648 (to Feb 2027) and Health Insurance ₹3,998 (to Sep 2027). **No bills yet.**
- **Holdings:** SIP - Zerodha ₹2,500/month and RD - Mom ₹1,000/month. **Neither is in the plan as a following bill.** A hand-typed "SIP Zerodha" bill exists.
- **Goal:** Emergency fund, ₹33,000 of ₹2,00,000 by 31 Aug 2027, kept in HDFC Premium.
- **Plan from October:**
  - Salary ₹57,700 on the 28th into HDFC Salary (Salary category exists).
  - EF contribution ₹10,000 (transfer to HDFC Premium).
  - One-offs: EF top-up ₹17,000 from Cash wallet (2 Oct) and EF top-up ₹30,000 (3 Nov). Diwali Bonus ₹46,000 (2 Nov, still *every year*).
  - Bills: the 3 EMIs, Electricity (varies), Home Support ₹10,000, TV+WiFi ₹1,000, Mobile recharges (varies), Hair cut ₹500, Petrol ₹2,500, SIP Zerodha ₹2,500, Spotify ₹139, Anthropic subscription ₹2,373 (on the card).
- **October shape:** comes in ₹57,700 · committed ₹35,947 · set aside ₹10,000 · flexible ₹11,753.
- **Today's Real Balance:** ₹9,497.
- **Open questions and clean-ups:** see CONTINUE_HERE → "The user's open to-dos".

## 5. Open backlog (full detail in FIX_BACKLOG.md)
- **1.5:** Net worth doesn't move as EMIs pass.
- **2.1:** A goal can't track an investment.
- **2.2:** No must-pay total or suggested EF target.
- **2.6:** Month close counts an early salary by date.
- **2.8:** A prepayment doesn't update the loan.
- **2.9:** A one-month amount change on a fixed bill doesn't stick (deferred SQL).
- **2.11:** An expense bill from a non-spendable bank still reduces Free.
- **3.2:** Card bills are missing from Needs you.
- **3.3:** A manual card-bill plan item would double count.
- **4.1-4.6:** Rough edges (settings 500, devtools restart, loan payments, varies keeps amount, Postman gaps, two orphan postings).
