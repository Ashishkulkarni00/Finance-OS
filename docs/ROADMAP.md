# Roadmap — Financial OS

Written 2026-09-20 from the reassessment. Supersedes the phase lists in
`product/STRATEGY_DEEP_DIVE.md` §H and `design/PRODUCT_STRATEGY.md`. Read with
`FINANCIAL_OS.md` (why) and `FINANCIAL_STATE.md` (what).

**Standing constraints:** one developer, personal product first, real data in use, no tests
or migrations written since 2026-09-17 by the user's instruction (both are lifted in Phase 1
below — they are now the blocker). Frontend = React/Vite/RTK Query; backend = Spring Boot 4 +
MySQL + Flyway; `mvn` is not on PATH (`.\mvnw.cmd`).

---

## Where we actually are

| Layer | State |
|---|---|
| Recording (double-entry, money correctness, imports) | Strong |
| Salary-cycle time model, rule vs occurrence | Strong — genuinely rare |
| This cycle's cash state (Real Balance, Room, blockers) | Strong |
| Obligations | Strong |
| Goals | Shallow (priority stored, never used; no contention) |
| Debt | Half (outstanding from elapsed periods, `loan_payments` unused) |
| Forecast | Half (plan-only; ignores actuals; no balance path) |
| Attention | Exists, narrow, reactive, returns nothing when healthy |
| Opportunity | One rule (unlocks), no allocation prompt |
| Decision support | Absent |
| Behaviour / recovery / commitments | Absent |
| Protection (insurance) | Absent (modelled as a loan today) |
| Plan vs actual audit | Half (silent plan rewrite; snapshot lacks planned totals) |
| AI | Absent (correct for now) |

---

> **Renumbered 2026-09-24: phases are 1-based.** What this document called Phase 0 is now
> **Phase 1**, Phase 1 is **Phase 2**, and so on to Phase 8. The roadmap counted from zero
> while the user counted from one, and the two numbering schemes cost three separate
> rounds of clarification in a single session — so the document moved, not the person.
>
> Reading older history: branch `feature/financial-os-reassessment-phase-1` and PR #8
> ("Completed phase 1") hold what this file now calls **Phase 1**, so they read correctly
> under the new scheme. Anything *written* before this date that says "Phase 0" means
> Phase 1, and `ROADMAP 0.x` means `1.x`. Superseded documents under `product/` and
> `design/` were deliberately left alone: they use their own, unrelated phase schemes, and
> rewriting history to match a current scheme is how a record stops being one.

## Phase 1 — Foundations *(nothing new until these are true)*

Everything here unblocks the rest. Expect migrations; this is where the SQL freeze lifts.

**Status 2026-09-23: complete except 1.5, which the user has frozen.** Four of the five exit
criteria below are met. Three pieces are built but have **never executed** — see the notes.

| # | Item | Impact | Status |
|---|---|---|---|
| 1.1 | **Plan revisions + change log.** A commitment/goal edit records what changed, when, why, and its effect. Closed-cycle snapshot stores **planned** totals as well as actual | DB (2 tables, snapshot columns), backend (commitment/goal update paths), API, small UI | ✅ **Done** 2026-09-21 · V18 · ADR-0015 · in real use |
| 1.2 | **Loan payments wired.** Link an EMI transaction to its period; derive outstanding from recorded payments, falling back to the stated checkpoint | DB (none — table exists), backend (`LoanServiceImpl`, settle path), API, loan page UI | ✅ **Done** 2026-09-21 · ADR-0018 · **never run** — first EMI falls 5 Oct |
| 1.3 | **Protection primitive.** Insurance entity: cover, premium, frequency, renewal, insurer. Premium becomes an obligation; renewal a timeline event. ~~Migrate the health-insurance-as-loan record~~ | DB (1 table), backend (new package), API, new small screen | ✅ **Done** 2026-09-21 · V19 · ADR-0016 · **no policy recorded yet**. The migration was deliberately *not* done: that loan is a real ₹42,701 liability, and deleting it to tidy the model would erase a debt |
| 1.4 | **Reactive write path.** Every financial write returns the *effect* of what just happened (room after, nearest at-risk obligation, goal moved) and re-runs threshold rules | Backend (write paths + state service), API response shape, UI surfacing | ✅ **Done** 2026-09-23 · V20 · ADR-0017 · **verified on real writes**: six transactions, one warning, announced once |
| 1.5 | **Regression safety.** Re-enable tests: correctness invariants (money never double-counted, cycle boundaries, plan-vs-actual) before the engines multiply | Backend tests; a few frontend tests for money formatting | ⛔ **Frozen by the user** since 2026-09-17. Nothing has run since. See `CONTINUE_HERE.md` for what 1.1–1.4 introduced that wants covering |
| 1.6 | **Documentation consolidation** (see `DOC_INDEX.md`) | Docs only | ✅ **Done** 2026-09-23 · living docs made true, ADRs 0018–0019 written, `INFORMATION_ARCHITECTURE.md` banner-flagged |

**Exit criteria:** a plan change is auditable ✅; a loan's outstanding reflects payments ✅;
an insurance premium behaves like any other obligation ✅; recording a transaction tells you
what it cost ✅; **tests guard the invariants ⛔ — not met, and will not be until the freeze
lifts.** Phase 1 is otherwise closed.

---

## Phase 2 — Financial State engine + Pulse

| # | Item | Impact | Status |
|---|---|---|---|
| 2.1 | `GET /financial-state` composing existing engines + **runway**, **baseline**, debt totals, **debt-free date** | Backend (new service, mostly composition), API | ✅ **Done** 2026-09-24 · no schema · verified on real data: runway *at most* 1.7 months, EMI share 36.73%, debt-free Oct 2029 |
| 2.2 | **Pulse** — one compact state view answering "where do I stand" in six lines, each traceable | Frontend (Today's hero becomes the Pulse) | ✅ **Done** 2026-09-24 · rendered as a statement, not tiles · screenshotted |
| 2.3 | Provenance: every figure carries what produced it | Backend + UI ("why is this number this?") | ✅ **Done** 2026-09-24 · `Provenance` on runway + debt · derivation opens under the Pulse row · assertions prove the lines add up to the figure |

**Exit:** one object, one endpoint, one screen that explains the whole position without the
user opening five tabs. ✅ **Met 2026-09-24 — Phase 2 is closed.**

---

## Phase 3 — Attention + Opportunity, unified

| # | Item | Impact |
|---|---|---|
| 3.1 | Merge opportunity rules into the insight engine; add idle cash, subscription drift, rate mismatch (saving at 6% while paying 22%), goal underfunded early | Backend (rules), no schema |
| 3.2 | **Dismiss/snooze** (`insight_state`) | DB (1 table), backend, UI |
| 3.3 | **A voice when healthy** — "nothing needs you; here's what moved" | Backend wording + UI |
| 3.4 | Threshold crossings from 1.4 become first-class attention items | Backend |

**Exit:** the product has something worth saying every week, and never says it twice.

---

## Phase 4 — Decision engine *(the differentiator)*

| # | Item | Impact |
|---|---|---|
| 4.1 | **`decision` entity** + follow-through tracking | DB (1 table), backend, UI |
| 4.2 | **"Can I afford this?"** — consequence preview before a spend | Backend simulation over state, UI at entry point |
| 4.3 | **Prepay vs save vs invest** — the ₹50,000 question, with interest saved, liquidity cost, goal impact side by side | Backend simulation, UI comparison |
| 4.4 | **Unlock redirection** — at an EMI's end, a decision with options, not a notification | Backend + UI |

**Exit:** for the three decisions this user actually faces, the trade-off is legible and the
choice is remembered.

---

## Phase 5 — Goals that compete

| # | Item | Impact | Status |
|---|---|---|---|
| 5.1 | **Feasibility**: required/month vs what's actually free; say when a goal is fiction | Backend (goal engine reads flow) | 🟡 **Half done 2026-09-24.** Pace now measures *funding vs requirement*, so a goal nobody funds can no longer read `ON_TRACK` (`GoalPace`, `GoalServiceImpl.funding`). What remains is the other half: required/month against what is **actually free**, which needs the goal engine to read cash flow. |
| 5.2 | **Contention + allocation**: priority becomes functional; allocate free cash across goals | DB (allocation), backend, UI |
| 5.3 | Funding source per goal; goal dependency (reserve before investing, debt before wealth) as a *suggested* order, never enforced | Backend + UI |

---

## Phase 6 — Behavioural layer

| # | Item | Impact |
|---|---|---|
| 6.1 | **Commitments (promises)** — "I will put ₹5,000 aside this month", tracked, kept or missed | DB, backend, UI |
| 6.2 | **Recovery protocol** — after a broken month, a concrete way back (which optional items to defer, what to restore next month) | Backend + UI |
| 6.3 | **Momentum** — named directions with reasons, no score | Backend + UI |
| 6.4 | Month close becomes the review that closes the loop: planned vs actual vs kept | Uses 1.1 |

---

## Phase 7 — AI over the state engine

Read-only interface: explains state, cites figures, routes to decisions. Never computes,
never decides, never moves money. Requires Phases 2–5 to be worth anything.

---

## Phase 8 — Later / integrations

Account Aggregator (citizen-side, not lender-side), bank statement automation, tax view,
multi-user auth, mobile.

---

## Explicitly NOT building yet

Account Aggregator integration · bank sync · AI chat · tax module · Monte Carlo retirement ·
multi-user auth · mobile app · any health *score* · subscription-cancellation hooks ·
gamification · lending/distribution monetisation of any kind.

---

## Build order (first ten working sessions)

1. 1.6 docs consolidation *(started 2026-09-20)*
2. 1.1 plan revisions + change log + snapshot planned totals
3. 1.5 invariant tests (guard what 1.1 touches)
4. 1.2 loan payments → outstanding from truth
5. 1.3 protection primitive + migrate the health-insurance record
6. 1.4 reactive write path (effect returned with every write)
7. 2.1 `GET /financial-state` (+ runway, baseline, debt-free date)
8. 2.2 Pulse on Today
9. 3.1 + 2.3 opportunity rules and a voice when healthy
10. 4.1 + 3.2 decision entity and "can I afford this?"

Each is a `feature/<name>` branch off `uat-release`, merged back through `uat-release` → `main`.
