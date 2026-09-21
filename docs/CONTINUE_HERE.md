# Continue here (rewritten 2026-09-20 after the Financial OS reassessment)

**This top block is the whole handoff contract: a session started with the single word
"continue" must be able to act on it with no other input.**

Read next: `FINANCIAL_OS.md` (what we're building), `ROADMAP.md` (what's next and why),
`SESSION_HANDOFF.md` (how to work with the user), `DOC_INDEX.md` (which docs are true).
Everything else under `docs/` is history unless `DOC_INDEX.md` lists it as living.

---

## NEXT ACTION

**Phase 0.1 - plan revisions + change log** (`ROADMAP.md` build order step 2). This is the
foundation the rest waits on: today a commitment edit silently clones the rule
(`CommitmentServiceImpl.update` -> `copyStartingOn`), and a closed cycle stores actuals with no
planned totals, so "did I keep to my plan?" cannot be answered.

Before writing code:
1. **Ask the user which branch** (their standing rule - ask before touching any file).
2. **This needs migrations**, frozen since 2026-09-17. `ROADMAP.md` lifts the freeze for
   Phase 0, but *confirm with the user* before writing the first Flyway file.
3. Write an ADR for D2 (plan versioning) before implementing - it changes a core invariant.

Shape of the work: `plan_revision` (what changed, when, why, effect) + change log; the cycle
snapshot gains planned totals; commitment/goal update paths record a revision instead of
silently splitting the rule; a small "what changed this month" surface reads it.

If the user would rather see value sooner than foundations, the honest alternatives need no
migration: build order step 6 (**0.4 reactive write path** - every write returns what it just
cost) or step 7 (**1.1 `GET /financial-state`**). Offer the choice.

## WAITING ON THE USER

- **Migration freeze**: confirm it is lifted for Phase 0 (0.1, 0.2, 0.3 and 2.2 need schema).
- **Test freeze**: `ROADMAP.md` 0.5 proposes invariant tests before the engines multiply.
- **Phase 0.2 direction**: loan outstanding derived from recorded payments rather than elapsed
  calendar periods (this was "item 5" on the previous branch).
- **Never clicked in a browser**: everything on `feature/partial-implementations-completion`
  (Set aside section, account archive/delete, edit holding, stop/start a commitment). It
  compiles and type-checks; the dev server was down when it was written.
- **Never exercised on real data**: goal payment schedules (`GET /goals` shows `schedule: []`),
  bank statement import, and a full month close.

## DON'T DO

- **Don't run git.** The user runs every git command themselves (they are learning). Claude
  tracks state and *reminds*: uncommitted work, unpushed branch, unmerged branch, pending pull.
  Flow: `feature/<name>` or `bug/<name>` off `uat-release` -> merge to `uat-release` (UAT) ->
  merge to `main` (production).
- **Ask before touching any file** - same branch or a new one.
- Don't modify the user's real data. Read-only GETs against `:8080` are fine; never create
  test rows (no SQL to clean them up).
- Don't restart the Vite dev server unless asked (`npm run dev` in `frontend/finance-ui`).
- Don't cite superseded docs as truth (`DOC_INDEX.md`).
- Don't build anything on the "not yet" list in `ROADMAP.md`.

---

## Git state at handoff (2026-09-20)

- Branch: `feature/financial-os-reassessment`, created from `uat-release` by the user.
- `feature/partial-implementations-completion` was pushed and merged to `uat-release` -> `main`
  by the user before this branch was cut.
- **Uncommitted on this branch:** the documentation set below. The user commits.

## What this session produced

- **`FINANCIAL_OS.md`** - definition (an OS arbitrates scarce resources between competing
  processes; the resource is monthly cash flow), the seven-step product loop, the engines
  including the **reactive layer** (the system speaks at the moment of the write, not on a
  dashboard visit), differentiation ranked, behavioural evidence, traps, AI strictly as an
  interface, North Star (trajectory improvement per quarter; operational metric = commitments
  kept), 12 principles, decisions **D1-D9**, and the seven-question test.
- **`FINANCIAL_STATE.md`** - the canonical `FinancialState` shape, derived-vs-stored, the
  **missing primitives** (protection/insurance, plan revision, decision, commitment-promise,
  allocation, runway, baseline, loan payments), what a transaction must mean, state
  transitions, and the threshold table that makes the engine react.
- **`ROADMAP.md`** - honest state table, Phases 0-7 with impact assessment, the explicit
  not-building list, and a ten-step build order.
- **`DOC_INDEX.md`** - living vs superseded; 62 docs reduced to a living set of about 12.
- Supersession banners added to `design/PRODUCT_STRATEGY.md`, `product/STRATEGY_DEEP_DIVE.md`,
  `product/MVP_DEFINITION.md`.

**Highest-value doc fix still outstanding:** `G:\FinanceOS\CLAUDE.md` is the first file a new
session reads and still asserts "frontend - empty (not started)", "Nothing exists yet for:
cycles, commitments, Real Balance, cards, loans, goals, or any frontend", "do not start
frontend work", "M2 status: done. Next: M3", and stale test counts (77/77, 23; actual 22 test
files). Correct it early next session.

## Evidence behind the reassessment (do not redo this research)

- **Competitive (2026-09-20):** every mainstream product (Monarch, Copilot, YNAB, Empower,
  Rocket Money, Simplifi, Origin, Cleo) stops at *interpretation*; none carries a commitment
  through time. India: Fi wound down banking (Mar 2026), Jupiter pivoted to lending - PFM was
  customer acquisition for credit. Account Aggregator is real but ~60% of FY25 consents served
  NBFC underwriting, not the citizen. "Financial OS" is claimed in B2B (Flex), unclaimed in
  consumer.
- **Behavioural:** commitment devices +81% savings after a year (SEED, QJE 2006); reminders
  work only when they name a *specific* future expense (+3% attainment / +6% saved, Management
  Science 2016); ~70% abandonment within 100 days is the category base rate.
- **Codebase audit:** strengths are the rule/occurrence split, the salary-cycle model,
  derived-not-stored, the INCOMPLETE contract, double-entry invariants and the `user_id` seam.
  Weaknesses: no canonical state object; plans not versioned; loan outstanding from elapsed
  periods while `loan_payments` sits unused; insurance absent; attention single-cycle and
  silent on healthy data; no decision layer; no frontend tests.
- **The user's real data as of 2026-09-20** (why the roadmap is ordered this way): salary
  Rs 57,700 on the 28th; five loans totalling Rs 3,40,092 at 9.35%-22.08%; EMIs Rs 21,191 =
  37% of income; SIP+RD Rs 3,500; family support Rs 10,000; net worth **-Rs 2,75,595**; Real
  Balance Rs 9,497. The emergency fund goal (Rs 2L by Aug 2027) needs **Rs 15,182/month** that
  does not exist, yet reads "on track" - the clearest proof that goals must know about cash
  flow. Freed-EMI unlocks: Feb 2027 Rs 2,648 - Sep 2027 Rs 6,646 cumulative - Nov 2027
  Rs 10,063 - Dec 2027 Rs 15,046 - Oct 2029 Rs 21,191. Health insurance is modelled as a
  **loan account** because no protection primitive exists.
