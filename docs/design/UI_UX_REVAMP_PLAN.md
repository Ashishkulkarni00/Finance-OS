# Kosh — UI/UX Revamp Plan

> **Status:** **Revision 2: the final version for approval** (2026-11-09,
> `feature/complete-ui-ux-revamp`). Revision 1 was reviewed by the user. Revision 2 settles the
> Breakdown rule (6.4), delete safety (6.6), the accessibility architecture (6.8), notification
> and connectivity behaviour (6.5, 6.11), the month-close release gate (Part 11), the manual
> acceptance checklist (Part 12), the example data (§0.4), the product name (§0.3) and the
> mobile Add button (7.3). **Not approved, nothing built.** It answers the brief in
> [`UI_UX_REVAMP_BRIEF.md`](UI_UX_REVAMP_BRIEF.md).
>
> **Once approved:** this plan becomes a living doc (add it to `DOC_INDEX.md` §1).
> `DESIGN_SYSTEM.md` v2 is then rewritten as v3 from Part 5 here, and `UI_UX_PRINCIPLES.md`
> §5 is revised (see §0.2).
>
> **How to read it:** every section keeps **Found** (a fact read from the code on 2026-11-09)
> apart from **Decision** (what this plan recommends). If a "Found" no longer matches the
> code, trust the code.

---

## 0. Ground rules this plan is held to

### 0.1 Constraints

| Constraint | Source | What it means here |
|---|---|---|
| Backend untouched | Brief §2; schema freeze (CLAUDE.md #3) | Every screen below uses endpoints that exist today. Anything that needs more is listed in Part 8.6 with a frontend-only alternative |
| No mocked data | CLAUDE.md "Settled questions" | Every redesigned screen is built against the live API, one screen at a time |
| No automated tests, no SQL | CLAUDE.md #3, #4 | `tsc -b --noEmit && vite build` proves only that the code compiles. **A build is not acceptance.** Each phase is accepted only through the manual scenarios in Part 12 |
| Never write to real data | CLAUDE.md #5 | Claude runs only read-only checks and click-checks with writes blocked. **Scenarios that write (create, edit, delete, settle, import, close) are run by the user**, or against a separate dev database if the user provides one. Part 12 marks which is which |
| No new heavy dependencies | Brief §13 | One small, justified addition is proposed (Part 6.9). Everything else uses React, Tailwind v4, RTK Query, react-hook-form, zod, lucide and Recharts, which are already installed |
| The user runs git | CLAUDE.md #1 | Each phase ends with a reminder of what to commit. Claude never commits |

### 0.2 The user's choices this plan is built on

These are settled. The plan applies them and does not reopen them.

1. **Answer first, detail on demand** (user, 2026-11-09). Every screen opens on its answer.
   The working behind each figure is one tap away and is never pushed at the reader.
   **This revises `DESIGN_SYSTEM` §1 "We rank. We do not hide"** and `UI_UX_PRINCIPLES` §5.
   The new rule:
   > **Rank the answer. Fold the proof. Never lose it.**
   Folded is not deleted. **Every figure the server can prove opens to that proof**, laid out
   with the full spreadsheet craft (item 2). A figure the server cannot prove is never given
   a proof worked out in the browser. It is plainly marked as unexplained or incomplete
   instead (the three figure classes in 6.4).
2. **The Excel's craft is the standard for the detail layer.** Aligned figures, ruled rows and
   visible derivations, as in `feedback_ui_must_match_excel_craft`. The craft moves to the
   second layer; it is not dropped.
3. **Plain language framed by the situation.** Real dates, never salary-month ranges. Say
   "commitment", not "bill". Hints tell you *what to pick and when*.
4. **Help belongs where the decision is made**, not behind a quiet link.
5. **Never judge.** Say "₹3,200 above your usual", never "overspent". No streaks, badges or confetti.
6. **Quiet by default, loud only when it matters.** A warning fires when something becomes true and
   again when it stops being true, not on every visit (`feedback_behavioural_reasoning_wanted`).
7. **Unknown is not zero.** Show `—`, "needs a number", `INCOMPLETE`. Never a guess.
8. **The month runs salary to salary.**
9. **No per-category budgets.** The plan (commitments plus Room) is the budget. Flexible
   spending is compared with the user's own past months.
10. **Recharts is the chart library** (ADR-0022). Highcharts was rejected because Kosh is meant to be sold.
11. **The product is meant to be sold** (2026-11-08). The quality bar is "would someone pay for this
    screen", not "does it work for one person".
12. **Short replies in chat.** Detail lives in docs like this one.

### 0.3 Product name

**Decision:** the product is called **Kosh** in every place a user sees: wordmark,
`<title>`, copy, help, emails if they ever exist. **FinanceOS** is the name of the
repository and the working project only; it never appears in the UI. This document follows
the same rule.

Found: `CLAUDE.md` marks *Kosh* as provisional, and `product/OPEN_QUESTIONS.md` keeps the
final name open. The name is currently hard-coded in at least `index.html` and `NavRail.tsx`.

**As part of Phase 1**, the name moves into one constant (`APP_NAME` in `src/lib/brand.ts`) so
that a final rename is a one-line change. **Open user decision:** whether "Kosh" is final
(Appendix A).

### 0.4 Example data in this document

Every figure, date and name in the mock-ups is **illustrative**. All of them assume one
scenario, checked for consistency:

| Fact | Value |
|---|---|
| Today | **Monday 9 November 2026** |
| Salary | ₹57,700 on the 28th |
| Current salary month | Wed 28 Oct 2026 → Fri 27 Nov 2026 = **31 days**. 9 Nov is **day 13 of 31** |
| Next salary | Sat 28 Nov 2026. Days left including today: 9–27 Nov = **19** |
| Free until salary (Real Balance) | ₹7,830 → Room ₹7,830 ÷ 19 = **₹412** today |
| After a ₹180 spend | Room shows **₹232** (412 − 180) |
| Commitments this month | ₹49,400 planned · ₹31,160 paid · **₹18,240** still to pay · 9 of 14 done |
| Onboarding example | ₹43,116 held − ₹3,226 set aside − ₹36,023 promised = **₹3,867** free |
| Previous (closable) month | Mon 28 Sep → Tue 27 Oct 2026 |

**In the app, nothing here is hard-coded.**
- Today's date comes from the client clock, formatted in the user's timezone (`/me.timezone`).
- Cycle dates, days to salary and every figure come from the API (`/financial-state.cycle`,
  `daysToSalary`, the figure fields).
- All formatting goes through `lib/dates.ts` and `lib/money.ts`.
- The weekday is always computed from the date, never written by hand.

---

## Part 1 — Executive product assessment

### 1.1 What Kosh is today (Found)

A desktop-first React app with **6 primary destinations** (Today, Ledger, Months, Money,
Goals, Summary), **5 Money tabs**, **6 detail pages**, a month-close wizard, onboarding, CSV
import and an in-app manual. It reads **~30 backend resources**. The product logic is
strong: Real Balance, salary-to-salary months, commitments carried through time, honest
unknowns, write-effect toasts, server-side provenance for figures, and forecasts and decisions.

That logic is what competitors lack, and the revamp must not damage it.

### 1.2 The biggest problems (Found, ranked by what they cost the user)

1. **No mobile layout at all.** `AppShell` always renders the 240px `NavRail`. Below
   ~640px the rail takes most of the screen on every page (recorded as a known app-wide gap
   in `CONTINUE_HERE`). The codebase has **0** `md:` classes and only 10 `sm:` classes. For a
   product whose daily action is "I just spent ₹180", this is the largest single gap.
2. **Every page shows everything at once.** Today has a hero, a derivation, a status card,
   before-payday, way back, more warnings and standing. Months has an overview, needs-you, a
   651-line plan zone, flexible spending, three briefing tabs and a close card. The user's
   new direction (detail on demand) is a direct response to this.
3. **Three help systems overlap on every page.** A dismissible `PagePrimer` banner (7 pages),
   a "How X works" `GuideSheet` modal (7 components), and the in-app manual (`/help`, 17
   topic files), with `InfoTip`s on top. Each was a fix for the last one not landing. A reader
   meets the same idea in three voices.
4. **One modal for everything.** `Modal.tsx` is a centred, max-width-lg dialog used for every
   form: the quick add, a 566-line commitment form, a loan with derived fields. It has no
   focus trap, no unsaved-changes guard and no mobile shape (no bottom sheet).
5. **No shared page template.** Each route hand-builds its header: eyebrow micro label,
   title, caption, "How X works" link, primer. Detail pages each build their own back link,
   statement and actions. The result is ~25 near-identical but slightly different layouts.
6. **Feedback is strong on writes but missing elsewhere.** The `EffectToastHost` (ADR-0017) is
   excellent. But there is no undo, no discard guard on half-filled forms, and no app-level
   offline or server-down banner. Each page writes its own error sentence.
7. **Some lists are flat where they should be ranked.** For example, Money > Overview repeats
   each tab's content in full instead of summarising it and linking to the tab.

### 1.3 What it should become

> **A calm daily answer, with an accountant's proof behind every number.**

- **Glance (default):** each screen answers its single question in under two seconds, on a phone.
- **Understand (one tap):** the derivation, in Excel craft. Shown **only** where the server
  supplies its parts (6.4). Elsewhere the figure is marked as unexplained or incomplete,
  never left looking proven.
- **Act (one tap from either):** record, settle, adjust. Each action shows its consequence (the effect toast).

### 1.4 Core design philosophy, in five rules

1. **One question per screen, answered at the top in words and one number.**
2. **Rank the answer, fold the proof, never lose it.** (§0.2-1)
3. **Phone first for capture and glance, desktop first for proof and planning.** Both are designed; neither is a shrunken copy of the other.
4. **One component per job.** One sheet, one page header, one disclosure, one breakdown. Consistency is what makes it feel premium.
5. **Quiet is the default state.** A screen with nothing urgent says so and looks restful.

### 1.5 The biggest opportunities

| # | Opportunity | Why it matters |
|---|---|---|
| O1 | Responsive shell with a bottom bar and an Add button for the thumb | Unlocks daily phone use. That is where capture happens |
| O2 | A universal **Breakdown** sheet, fed only by server data | Keeps the proof one tap away while the screens get simpler, without inventing any |
| O3 | One help layer: a one-line page subtitle, hints in forms, and the manual | Deletes 14 duplicating components and stops repeated explanations |
| O4 | One detail-page template for account, card, loan, goal and commitment | Six pages become one pattern the user learns once |
| O5 | Visual refresh: deeper warm ground, borderless cards, refined teal, three weights | The "classier than Excel" bar, met with less ink |

---

## Part 2 — Audit of the current app (Found)

### 2.1 Routes

| Route | Page | Job today | Main API |
|---|---|---|---|
| `/` | RootRedirect | → `/onboarding` if 0 accounts, else `/today` | `GET /accounts` |
| `/onboarding` | OnboardingPage | 5 steps: pay day, income, accounts, commitments, set-asides, with a live Real Balance preview | `/me`, `/accounts`, `/commitments`, `/reservations`, `/position` |
| `/today` | TodayPage | What can I spend today, and what's coming before payday | `/financial-state`, `/timeline?days=45`, `/insights?surface=TODAY`, `/recovery` |
| `/needs-you` | NeedsYouPage | Every insight in severity bands, what changed, answered items | `/insights/all` (polled 30s), `/insights/changes`, dismiss/restore |
| `/month` (`?cycle=`) | MonthPage | One salary month: overview, needs-you, plan, flexible spending, briefing tabs, close | `/cycles/*`, `/position`, `/cycles/{id}/commitment-instances`, `/plan-progress`, `/shape`, `/flexible-spending`, `/plan-revisions` |
| `/month/close` | MonthClosePage | 5-step close wizard | `/cycles/{id}`, `/review`, `/close`, `/snapshot` |
| `/money/accounts` | MoneyPage ("Overview") | Net worth, needs a look, cash & bank, cards, debts, investments | `/accounts`, `/net-worth`, `/position/cash` |
| `/money/cards` | CardsPage | Credit cards (owed, due, EMIs) and debit cards | `/credit-cards`, `/debit-cards` |
| `/money/debts` | DebtsPage | Loans: standing, needs a look, loans grouped | `/loans`, `/loans/summary` |
| `/money/investments` | InvestmentsPage | Holdings by liquidity, standing, check-in | `/investments`, `/investments/summary` |
| `/money/insurance` | CoverPage | Policies, cover standing | `/insurance-policies`, `/summary` |
| `/accounts/:id` | AccountDetailPage | Balance, available, set-asides, projection, recent activity, archive/delete | `/accounts/{id}`, `/projection`, `/transactions`, `/reservations` |
| `/cards/:id` | CreditCardDetailPage | Card, statements, EMIs | `/credit-cards/{id}`, `/statements` |
| `/loans/:id` | LoanDetailPage | Terms, outstanding, schedule, plan link, cover link | `/loans/{id}`, `/schedule` |
| `/goals/:id` | GoalDetailPage | Target, saved, funding, payments | `/goals/{id}`, `/reservations` |
| `/commitments/:instanceId` | CommitmentDetailPage | One occurrence: expected, settled by, how it recurs, past cycles | `/commitment-instances/{id}` |
| `/commitment-rules/:ruleId` | CommitmentRuleDetailPage | The recurring rule: details, recent occurrences, stop | `/commitments/{id}`, `/instances` |
| `/ahead` | PlanPage ("Goals") | Money freeing up, goals and verdicts, suggested order, where the freed money goes, lump sum, month by month | `/forecast`, `/goals`, `/goals/feasibility`, `/goals/suggested-order`, `/decisions/*` |
| `/ledger` | LedgerPage | Every transaction by day, filters, stated view, categories | `/transactions`, `/summary`, `/day-subtotals`, `/categories` |
| `/ledger/import` | ImportPage | CSV upload → review rows → commit | `/imports/*` |
| `/summary` | SummaryPage | Tiles, month by month, where it went, heatmap, debt down, plan held, momentum | `/review/*`, `/momentum` |
| `/help`, `/help/:cat`, `/help/:cat/:slug` | Help* | The in-app manual in its own shell | static content |

Redirects kept for old links: `/accounts`, `/cards`, `/debts`, `/investments`, `/money/cover`, `/goals`, `/plan`, `/review`.

### 2.2 Global surfaces (Found)

- `NavRail`: 6 items plus Help, and a context-aware **Add** button whose label changes per page via `addTargetFor`.
- `Ctrl/Cmd+K` always opens Add transaction.
- `AddSheet` (transaction), `SettleCommitmentSheet` and `PageAddHost` (the add sheets) are mounted globally.
- `EffectToastHost`: the after-write consequence toast. It uses a timer bar that pauses on hover and three tones (Recorded, Recorded · worth knowing, Needs you now).
- `HelpProvider`: the help overlay, context menu, and `useDocAnchor` links from UI to manual.

### 2.3 Frontend architecture (Found)

| Area | State |
|---|---|
| Build | Vite 8, React 19, TS 7, Tailwind v4 (`@theme` tokens in `index.css`) |
| Data | RTK Query, one `baseApi` with tag invalidation, 25 service files, `baseQuery` mapping ProblemDetail to `AppError {code, message, field, fix, fieldErrors}` |
| Local state | One `uiSlice` (add sheet, page-add, effect toasts) |
| Forms | react-hook-form + zod, per-feature `*Form.ts` schemas |
| Code splitting | Every route is `lazy()`. `Suspense fallback={null}`, so a route change shows blank for a moment |
| Tokens | Colour, type scale, spacing and motion as CSS variables. Dark mode by `prefers-color-scheme` only, with no manual switch |
| Money | `Amount` component: ₹ at 0.62em, tabular figures, `—` for unknown. `lib/money.ts` formats with `en-IN` |
| Size | ~36k lines in `src`. ~190 components. 4 unused (`CommitmentRulesSection`, `HistorySection`, `StandingZone`, `FreeUntilSalaryHero`) |
| Auth | None. `/me` returns a single user's settings. There is no login, so session expiry does not happen today |
| Settings UI | None. `GET/PATCH /me` exists (display name, cycle start day) but only onboarding uses it |
| Unsaved-changes guard | None (`useBlocker` and `beforeunload` are not used anywhere) |
| Undo | None. Transaction delete is final from the UI. Archive/unarchive exists for accounts, goals, commitments, policies and categories |

### 2.4 Current usability issues by theme (Found)

| Theme | Evidence |
|---|---|
| Mobile | Fixed 240px rail. Tables and `Statement` grids assume width. The modal is a centred dialog at every size |
| Density at the first glance | Today has 7 blocks, Months 6, Money > Overview 6, Summary 7 |
| Repeated help | PagePrimer + GuideSheet + Help topics + InfoTip on the same pages |
| Inconsistent headers | Eyebrow micro labels (`TODAY`, `MONTHS · SALARY TO SALARY`, `ACCOUNTS`) plus titles of different sizes. The eyebrow repeats the nav label |
| Naming drift | Nav says "Goals", route is `/ahead`, component is `PlanPage`. Money's first tab says "Overview", its header says "Accounts", its route is `/money/accounts` |
| Two pages for one commitment | The instance page and the rule page show overlapping facts in different layouts |
| Blank route transitions | `Suspense fallback={null}` |
| Forms | Long sheets (Add/Edit commitment: 566 and 568 lines) in a 512px modal. No discard guard |

---

## Part 3 — Information architecture

### 3.1 Decision: navigation

The six jobs are right; the user and earlier sessions earned them. The changes are names,
grouping, and how navigation works on a phone. **No destination is added.**

| Slot | Label | Route (unchanged) | Question it answers | Change |
|---|---|---|---|---|
| 1 | **Today** | `/today` | What can I spend, and is anything about to go wrong? | Needs you becomes a panel, not a page (3.3) |
| 2 | **Activity** | `/ledger` | What actually happened to my money? | Renamed from *Ledger*, a bookkeeping word. Route stays |
| 3 | **Month** | `/month` | What's left to pay before salary, and how did this month go? | Singular. "Months" read as a list of months |
| 4 | **Money** | `/money/*` | What do I have and owe? | Unchanged |
| 5 | **Goals** | `/ahead` | What am I working towards, and what's coming? | Unchanged label. Forecast sits inside it as "Months ahead" |
| 6 | **Progress** | `/summary` | Am I getting anywhere? | Renamed from *Summary*: it says what the page is for, not what kind of page it is |
| — | Help | `/help` | — | Footer of the sidebar. Under *More* on a phone |
| — | **Settings** (new page, existing API) | `/settings` | Name, pay day, appearance | See 4.17 |

> **Two renames for the user to approve:** Ledger → Activity, Summary → Progress. They are
> the only label changes. If either is declined, the rest of the plan still holds.

### 3.2 Hierarchy

```
Today ─┬─ Needs you (panel; /needs-you still opens it for links)
       └─ Breakdown (sheet on any figure)
Activity ─┬─ Import a statement (/ledger/import)
          └─ Categories (sheet)
Month ─┬─ any month (?cycle=)
       ├─ Close the month (/month/close)
       └─ Commitment (/commitments/:id, /commitment-rules/:id) ← one template
Money ─┬─ Overview · Cards · Loans · Investments · Insurance (tabs)
       └─ Account / Card / Loan detail ← same template
Goals ─┬─ Goal detail ← same template
       └─ Months ahead, Freed money, Lump sum (sections)
Progress
Settings · Help
```

### 3.3 Consolidations and removals

| What | Decision | Why |
|---|---|---|
| `/needs-you` page | **Becomes the Needs-you panel**: a right drawer on desktop, a full-height sheet on a phone. It opens from Today's status line and from the count badge on Today's nav item. The route still works and opens Today with the panel open | It is a drill-down of Today. A separate page sends you away from the figure the item is about |
| `PagePrimer` ×7 | **Removed.** Replaced by a permanent one-line page subtitle | The subtitle is the primer's first sentence, and it never needs dismissing |
| `*GuideSheet` ×7 | **Removed.** The page header's `?` opens the Help overlay at that page's topic | The manual already holds this content. Two copies drift apart |
| Instance page vs rule page | **One Commitment template.** The instance page leads with "This month's payment" and follows with "Every month". The rule page shows "Every month" plus the occurrence list. Both routes are kept | One concept, one look |
| Money > Overview repeating each tab | **Overview summarises; tabs hold the detail.** Each register becomes one ruled row (total, count, one status) that links to its tab | Removes about 60% of the Overview's height |
| Month "briefing" tabs (What's different / What you changed / Commitments kept) | **Folded into one "About this month" disclosure** under the plan | Context, not work. It should not compete with the plan |
| Summary heatmap | **Kept, folded** behind "By category, month by month" | Valuable for the detail-minded user, noise for everyone else |
| 4 unused components | Deleted in Phase 1 | Dead code |
| Eyebrow micro labels on page headers | Removed | They repeat the sidebar |

**Nothing the user can do today is lost.** Every action and figure has a home in Part 4.

---

## Part 4 — Page-by-page specification

### 4.0 Shared page anatomy (applies to every page below)

```
┌ PageHeader ─────────────────────────────────────────────────────────┐
│ Title (page-title)                                   [?] [secondary] │
│ One-line subtitle: what this page is for (supporting, ink-muted)     │
└──────────────────────────────────────────────────────────────────────┘
  Answer block      the one number + one sentence                   (always)
  Attention line    only if something needs the user                (contextual)
  Primary content   ranked list or register                          (always)
  Folded sections   "Show …" disclosures, state remembered per browser (on demand)
```

- **Breakdown**: only a figure listed in the **Breakdown registry** (6.4) gets the dotted underline and opens a Breakdown (a popover anchored to the figure on desktop, a bottom sheet on a phone). The Breakdown shows server lines and the server total, never browser arithmetic. An incomplete figure carries an "incomplete" marker. Any other figure is plain text. "→ Breakdown" in the mock-ups below always refers to a registry entry.
- **Disclosure**: `Show <what>` / `Hide`, chevron, `AnimatedCollapse`. Open/closed state is saved in `localStorage` (wrapped in try/catch) under `kosh.<page>.<section>`.
- **States**: each page defines skeleton, empty, error, unknown and success. They are listed per page as **S:**.
- **Mobile**: one column. The header's secondary actions move into a `⋯` menu, and the page's primary action is the Add button.

Information classes used below: **E** essential (always visible) · **C** contextual (only when it applies) · **O** optional (on demand) · **X** remove.

---

### 4.1 Today

**Current (Found).** The hero is "Spend today", with its arithmetic printed beneath. Below
that are a status card with the top insight, "Before payday" (a 45-day timeline), "Way back",
"Also worth a look", and "Standing" (net worth, runway, free this month), which is open by
default.
Problems: seven blocks on one screen; the arithmetic is always on; Standing's long-term
figures compete with today's figure; there is a two-column grid under a centred hero; and the
page has no mobile layout.

**Proposed.**

```
Today                                                        [?]
Monday, 9 November · day 13 of 31, salary on Sat 28 Nov

  ₹412                                ← hero, accent
  you can spend today
  Free until salary ₹7,830 ÷ 19 days   ← one line, dotted underline → Breakdown

  ● Nothing needs you today.            ← status line (or: ▲ 2 things need you  ›)

Before payday                               ₹18,240 still to leave
  Tomorrow   Electricity      HDFC Salary        ₹1,180
  Thu 12     SIP – Zerodha    HDFC Salary        ₹5,000
  …          (next 5 shown)
  Show all 14 →

Show how you stand  ▾      (net worth, runway, free this month)
```

| Element | Class | Reason |
|---|---|---|
| Spend today (hero) | E | The page's question |
| One-line derivation (free until salary ÷ days) | E, one line | All three numbers are server fields (`realBalance`, `daysToSalary`, `roomToday`), and the division is the server's. The full statement opens in a Breakdown (registry B1) |
| Full derivation statement | O → Breakdown | Detail on demand |
| Status line | E | "Nothing needs you" is a designed state (Principle 14) |
| Needs-you cards | O → panel | Moved off the page. The status line shows the count and the top item's title |
| Before payday, next 5 | E | What happens next |
| Before payday, rest | O "Show all" | Inline expand, not a new page |
| Dated shortfall on a payment row | C | Stays attached to its row (current behaviour is good) |
| Way back | C | Shown only when Spend today ≤ 0 or the recovery API returns options. Then it sits directly under the hero, because it *is* the answer |
| Also worth a look | X on Today | Moves to the Needs-you panel |
| Standing | O, **closed by default** | Long-horizon figures. The user's earlier choice was "open by default". **This reverses it under the new detail-on-demand rule. Flag to the user.** |
| "How Today works" link and primer | X | Replaced by `?` |

**Layout.**
- **Desktop ≥1024:** one **full-width** column, **left-aligned to the page edge like every other page** (centring a 720px column left Today ~200px in from the others and the content jumped when switching pages; the user then asked to expand it to the right too - 2026-11-09). Sections and ruled rows span the page; only prose (the day's sentence) and the status band keep the 720px reading measure so text lines never stretch. One column replaces the 1fr/26rem grid: the reading order is linear, and the user's earlier alignment complaints all came from figures far from their labels.
- **Phone:** the same order. The hero is 34px. Before-payday rows become two lines (name over account and date, amount on the right). The Add button sits above the bottom bar.

**Interactions.**
- Tapping the hero or the derivation opens the Breakdown (registry B1: the position breakdown of held, reserved, committed and card dues, with per-account and per-commitment lines).
- Tapping a payment row opens the Commitment page. Its trailing `⋯` offers *Record payment* (→ `SettleCommitmentSheet`).
- Tapping the status line opens the Needs-you panel.
- After any write, the hero counts to its new value (`useAnimatedMoney`, 250ms) and the effect toast appears.

**S:**
- **Loading:** hero skeleton at the final size, never a spinner, plus 5 row skeletons.
- **Empty (0 accounts):** RootRedirect handles this. Never shown.
- **Incomplete:** hero `—` with "needs a number for 2 commitments · Add them ›".
- **Error:** the hero area says "Couldn't load today's figure" with a Retry. The rest of the page still renders whatever loaded.
- **Success:** the count animation and the toast.

**API:** `/financial-state`, `/timeline`, `/insights?surface=TODAY`, `/recovery`. No change.

---

### 4.2 Needs-you panel (replaces the `/needs-you` page)

**Current (Found).** A page with severity bands ("Costs money if nothing happens" / "Needs a
decision" / "Worth knowing"), each card navigable and dismissible, "What changed", and "N
you've answered" with restore.

**Proposed.** The same content in a **480px right drawer** (a full-height sheet on a phone).
- The header is "Needs you · 3". Bands are kept with their current wording, which is good. Each card has a title, one sentence, a primary action button (from `insightDestination`) and an `I know` button (dismiss).
- "What changed" is a folded section at the bottom, as is "Answered (2)".
- Polling (30s) runs only while the panel is open.
- The nav badge (Today item) shows `attentionCount` from `/financial-state`. **The badge appears only for CRITICAL or ATTENTION items, never for INFO.** Otherwise it would become wallpaper the user learns to ignore.

**S:**
- **Empty:** "Nothing needs you right now." with the reason line (keep the current copy).
- **Error:** "Couldn't check what needs you", Retry. It never says "nothing".

**API:** unchanged.

---

### 4.3 Add transaction (global capture)

**Current (Found).** `AddSheet` in the centred Modal. Per-type labels (the 2026-11-09 work),
"Towards a bill?" picker, `AffordNote`. Ctrl+K opens it.

**Proposed.** This is the most-used surface, so it gets the most care.

```
Add transaction                                  ✕
[ Spent | Received | Moved | Invested | Refund ]    ← segmented, Spent default
₹ ______                                            ← 40px amount, autofocus, numeric keypad
Spent on   [ Food & dining ▾ ]   (recent 4 as chips beneath)
Paid from  [ HDFC Salary ▾ ]     (remembers last used per type)
Date       [ Today ▾ ]           (Today · Yesterday · pick)
Note       optional
▸ Towards a commitment?          ← C: shown expanded if a matching open commitment exists
Afford note (C): "Leaves ₹232 for today" / "₹168 over today's share — fine, it evens out"
                                       [ Save ]  (⌘↵)
```

| Element | Class | Note |
|---|---|---|
| Type, amount, category, account | E | Amount is the only field without a default |
| Date | E, defaulted to Today | |
| Note | E, optional | |
| Towards a commitment | C | Auto-expanded when the backend candidate match returns something (the U1 lesson: suggest, don't wait) |
| Afford note | C | Only for Spent, and only once an amount is typed |

- **Desktop:** right-side sheet, 440px, so the page and its hero stay visible and the count-down after saving can be seen. This replaces the centred modal.
- **Phone:** full-height bottom sheet with Save stuck above the keyboard.
- **Behaviour:**
  - Enter moves between fields; ⌘/Ctrl+Enter saves.
  - Save disables while the request runs, which prevents double submits.
  - After saving, the sheet closes and the effect toast shows.
  - "Save & add another" is a secondary action (kept if it exists, added otherwise; frontend only).
  - Closing a dirty form asks "Discard this entry?" (Part 6.2).

**API:** `POST /transactions`, `/decisions/afford`, candidate matching (existing). No change.

---

### 4.4 Activity (was Ledger)

**Current (Found).** Filter bar (search, account, category, type), a "stated view" summary,
day groups with subtotals, edit sheet, manage-categories sheet, an Import link, primer and
guide.

**Proposed.**

```
Activity                                    [Import] [⋯ Categories] [?]
Every time money moved, once, on the day it moved.

[ This month ▾ ]  [ Search… ]  [ Filters (2) ]     ← period chip uses salary months, shown as real dates
In ₹57,700 · Out ₹41,230 · 86 entries              ← stated view, one line; tap → Breakdown

Today · Mon 9 Nov                                  −₹1,410
  Swiggy            Food & dining · HDFC Salary      ₹410
  Electricity       Utilities · paid commitment      ₹1,000
Yesterday · Sun 8 Nov                              −₹2,300
  …
[ Load older ]
```

| Element | Class | Note |
|---|---|---|
| Period selector | E | Defaults to the current salary month, labelled "This month (from 28 Oct)". A real start date, never a salary-month range |
| Search | E | |
| Account / category / type filters | O, behind a "Filters" button with a count | Most visits need only search |
| Stated summary | E, one line | |
| Day groups with subtotal | E | Subtotals are right-aligned in the figure column |
| Row: description, category · account, amount | E | Incoming money shows a `+` sign and ink colour, never green (DESIGN_SYSTEM rule kept) |
| Row tags (linked commitment, transfer, card) | C | Small text chip, at most 1 per row |

- **Interactions:**
  - Tap a row to open the edit sheet. Its footer has Delete, which follows the pending-delete flow (Part 6.6).
  - The day subtotal is the server's (`/day-subtotals`). It is never re-added in the browser, including while a delete is pending.
  - Filters live in the URL, so refreshing keeps them (check `useLedgerFilters`; keep it if it already does this).
  - "Load older" pages by 50 (the existing `size`). No infinite scroll: it breaks footer access and position memory.
- **Desktop:** 880px column, figures in one right-hand column.
- **Phone:** rows on two lines. Filters open in a bottom sheet. The search field stays at the top while scrolling.
- **S:**
  - **Empty month:** "Nothing recorded since 28 Oct." with an Add transaction button.
  - **No filter results:** "No entries match. Clear filters" (one button).
  - **Error:** inline under the filter bar, keeping the filters.
- **API:** `/transactions`, `/summary`, `/day-subtotals`, `/categories`. No change.

#### 4.4a Import a statement (`/ledger/import`)

Keep the flow (choose account → upload CSV → check rows → commit) and turn it into a **3-step
stepper** with the steps named. The row review becomes a dense table on desktop and a card
per row on a phone. "Looks already recorded" rows are unticked by default with that reason
shown. The Commit button reads "Import 23 entries". **S:** a parse error names the line and
says what's wrong if the backend returns it, else a generic sentence plus "Check it's the
bank's CSV export".

#### 4.4b Categories (sheet)

Keep `ManageCategoriesSheet`'s abilities (add, rename, group, archive, unarchive, delete).
Rows are grouped by Income / Fixed / Flexible. Archived categories go under a fold. Delete is
offered only for unused categories, otherwise Archive (this follows the backend's rules).

---

### 4.5 Month

**Current (Found).** Cycle switcher; `MonthOverview` (planned ahead, how the plan went, money
in and out); Needs you (limit 2); `PlanZone` (the plan grouped by attention or category, with
settle, record and amount actions); flexible spending; `MonthBriefing` tabs; a "Close cycle"
card when ended.

**Proposed: "the worklist, then the context".**

```
Month                                   ‹  This month · 28 Oct – 27 Nov  ›   [?]
What still has to be paid before your next salary, and what's free after it.

  ₹18,240 still to pay   ·   9 of 14 done                      ← answer (current month)
  ▓▓▓▓▓▓▓▓▓░░░░░  (paid-of-planned bar, labelled ₹31,160 of ₹49,400)
  Free after commitments ₹7,830  (→ Breakdown)

Needs you (2)                      ← C, only current month, only if any
  Credit card bill — due tomorrow, no amount yet          [Add amount]

Coming up                                                ₹18,240
  12 Nov   SIP – Zerodha        HDFC Salary      ₹5,000   [Record]
  …
Coming in                                               ₹57,700   ← C, if income still expected
Done (9)  ▸                        ← folded by default, shows ✓ count

Day-to-day spending  ₹11,980 · ₹1,200 below your usual  ▸   ← folded; opens category list vs baseline
About this month ▸   (What's different · What you changed · Commitments kept)
[ Close this month ]   ← C, only when ended and not closed
```

| Element | Class | Reason |
|---|---|---|
| Month switcher | E | Real dates in the label |
| Still to pay + progress | E | The question for the current month |
| Free after commitments | E (one line) | Bridges to Today. Same number, different horizon |
| Needs you | C | Max 3, then "see all" → panel |
| Coming up (by date) | E | The worklist. **Grouped by attention as already agreed** (Needs you / Coming up / Done) |
| By-category view toggle | O | Kept as a view switch in the section header ("By date · By category") |
| Done | O, folded | Done items are reassurance, not work |
| Day-to-day spending vs usual | O, folded, with a one-line summary always visible | Compared with the user's own past months (no budgets, §0.2-9) |
| Briefing tabs | O, folded into "About this month" | Context |
| Close card | C | |

**Modes (keep today's logic):**
- **Upcoming month:** answer = "₹49,400 planned · 14 commitments", list = the plan.
- **Past month:** answer = "Plan held: 13 of 14 · ₹2,100 more than planned", list = what was left unpaid, then what was spent.

**Interactions:**
- A row opens the Commitment page. The row's primary action is a visible button on desktop (`Record` / `Add amount` / `Confirm`) and in the `⋯` menu on a phone.
- "+ Add a commitment" sits at the end of Coming up, and the sidebar Add becomes *Add commitment* on this page (current behaviour, kept).

**Phone:** the switcher becomes a compact chip with arrows. Rows show name and date on line 1, account on line 2, amount on the right. The action button moves into a swipe-left option **and** the `⋯` menu, because a swipe on its own can't be discovered.

**S:**
- **No commitments:** "Nothing planned for this month yet. Add the commitments you expect, like rent, EMIs and SIPs." with an Add commitment button.
- **Error:** in the section, with Retry.
- **Unknown amounts:** the answer shows "₹18,240 + 2 without an amount".

**API:** unchanged (`/cycles/*`, `/commitment-instances`, `/plan-progress`, `/shape`, `/flexible-spending`, `/plan-revisions`, `/position`).

---

### 4.6 Close the month (`/month/close`)

**Current (Found).** A 5-step wizard (Resolve → Confirm balances → Review → What moved →
Close) with step dots.

**Proposed.**
- Keep the steps. The page becomes a **focus mode**: the sidebar is hidden, and a top bar shows "Closing 28 Sep – 27 Oct · step 2 of 5 · Exit". Only an ended month can be closed. Steps get named labels instead of dots.
- Each step has one primary action at the bottom right (stuck to the bottom on a phone).
- The final step ends on **something that moved the right way** (Principle 12). `WhatMovedStep` already does this; give it the editorial serif line.
- Exit asks for confirmation only if a step has unsaved input.

**Release dependency, not redesign work:** the first real close writes an immutable
`CycleSnapshot`. **This redesign changes nothing about what is calculated or stored.** Whether
the first close is safe depends on the backend gate **G1** in Part 11, not on this screen.

---

### 4.7 Money: Overview

**Current (Found).** Header ("Accounts / What you own and owe"); `NetWorthZone` (net worth,
in bank and cash, set aside, owed on cards, yours to move, approximate); `NeedsALookZone`;
`CashBankRegister`; `CardsSection`; `DebtsSection`; `InvestmentsRegister`.

**Proposed.**

```
Money      [Overview] Cards  Loans  Investments  Insurance            [?]
What you own and owe, as of today.

  Net worth  −₹2,09,564                            (→ Breakdown)
  ₹33,021 of loans repaid since 14 Sep            ← progress line from /momentum (C)

Needs a look (1)   ← C
  IDBI Saving won't cover Petrol on 27 Nov — ₹1,188 short          [Move money]

Cash & bank                         ₹43,116  ›   (list of accounts, always visible: this is the daily register)
  HDFC Salary        ₹31,204   ₹24,000 free to move
  …
Cards                 ₹12,400 owed · next due 5 Dec    ›  → Cards tab
Loans                 ₹3,07,071 owed · 6 loans         ›  → Loans tab
Investments           ₹1,18,000 · 4 holdings           ›  → Investments tab
Insurance             3 policies · cover ₹50L          ›  → Insurance tab
```

| Element | Class | Note |
|---|---|---|
| Net worth with an approximate marker | E | "≈" plus "2 figures estimated" when confidence is low |
| Net-worth composition (assets / liabilities / set aside) | O → Breakdown | |
| Progress line | C | Only when `/momentum` has a positive debt or saving direction |
| Needs a look | C | |
| Cash & bank list | E | Balance and *free to move* (Balance ≠ Available, kept) |
| Other registers | E as one summary row each | Detail lives in the tabs |

**Tab rename:** "Debts" → **Loans** (the plain word, and it matches the rows). Route
`/money/debts` stays.

**Phone:** tabs become a scrollable segmented strip and the page fits without horizontal scroll.

**S:** each summary row shows `—` where its endpoint failed, with a quiet retry icon, so the page never fails as a whole.

#### 4.7a Cards tab

- **Answer:** "Owed on cards ₹12,400 · next payment ₹8,200 on 5 Dec".
- **List:** one row per credit card (owed now, due date, statement state). Debit cards sit under a fold ("Debit cards (3)"), since they hold no balance and are seldom looked at.
- **Primary action:** *Add credit card*.
- **Empty:** "No credit cards. If you use one, add it so its bill is counted before it arrives."

#### 4.7b Loans tab

- **Answer:** "₹3,07,071 owed · debt-free by Mar 2029 · ₹41,560 a month in EMIs".
- **Needs a look:** contextual (unrecorded EMIs, estimated terms).
- **Rows:** grouped "Debited from a bank account" / "Billed to a card" (kept). Each row has name, outstanding, EMI, end date, and a confidence pill only when estimated.
- **Empty:** "No loans recorded."

#### 4.7c Investments tab

- **Answer:** "₹1,18,000 put to work". Groups are kept ("Ready if you need it" / "Growing for later"), which is good plain language.
- **Check-in:** "Keep it accurate" lists holdings whose value is stale. Contextual, at most 3, "Update value" inline.
- **Plan prompt:** contextual.
- **Stopped holdings** read "Monthly · Stopped" (kept).

#### 4.7d Insurance tab

- **Answer:** "Covered for ₹50L across 3 policies · next premium ₹12,000 on 1 Feb".
- **Needs a look:** contextual.
- **Policy rows:** what it covers, sum assured, premium, renewal date.
- **Empty:** "No cover recorded. Add health, life or vehicle policies so their premiums are planned and their cover is visible."

---

### 4.8 Detail-page template (account, credit card, loan, goal, commitment)

One template, so the user learns it once.

```
‹ Back to <parent>                                             [Edit] [⋯]
<Name>                                   <type chip>  <status chip, C>
  <hero figure>                     <one sentence of what it means>
  <2–4 key facts in a ruled statement: label · value>    (→ Breakdown where derivable)

<Primary section>         the thing you come here for
<Secondary section>       folded if long
<History / activity>      last 10, "Show all"
──────────────
Danger zone: Archive · Delete (with consequence sentence)    ← bottom, never in the header
```

| Page | Hero | Key facts | Primary section | Secondary | Primary action |
|---|---|---|---|---|---|
| **Account** | Balance | Free to move · set aside · minimum balance · opening balance (O) | Recent activity | Set asides · projection to salary ("Will dip to ₹1,188 on 27 Nov") · linked debit cards | Add transaction (pre-filled account) · Update balance |
| **Credit card** | Owed now | Limit · available · blocked for EMIs · due date | Statements (record, latest first) | Card EMIs · spent since statement | Record statement |
| **Loan** | Outstanding today | EMI · EMIs left · rate · debt-free date | Schedule (folded after the next 6 rows) | Terms (O) · plan link · cover link · "figures don't add up" (C) | Edit terms · add to plan (if not in plan) |
| **Goal** | Saved of target (a progress bar labelled with both figures) | Monthly needed · target date · feasibility verdict | Funding (where it's saved) | Payments | Edit · set aside money |
| **Commitment** | This month's amount and status | Due date · pay from · paid from (actual) · mandatory | This month's payment (settled by) | Every month (rule facts) · past months | Record payment / Add amount / Confirm |

**Delete and archive copy:** each states its consequence. For example: "Archive HDFC Salary?
It stays in your history and net worth stops counting it. You can bring it back from Money ›
Archived."

**Phone:** Edit and `⋯` stay in the header, the primary action sticks to the bottom, and the key facts become a 2-column grid.

---

### 4.9 Goals (`/ahead`)

**Current (Found).** Money freeing up → Goals (verdicts, suggested order) → Where the freed
money could go → Lump sum → Month by month.

**Proposed.**

```
Goals                                                  [Add goal] [?]
What you're saving towards, and what your money can do next.

Your goals
  Emergency fund   ₹80,000 of ₹1,50,000  ▓▓▓▓▓▓░░░   ₹5,000/mo · fits ✓
  Bangalore trip   ₹3,226 of ₹12,000     ▓▓░░░░░░░   due Dec · tight — ₹1,400 short at current pace
  ▸ A common order for spare money   (suggested order, O)

Money freeing up                         ₹4,700/mo from Mar 2027
  Bike loan: last EMI Feb 2027 → ₹4,700/mo
  ▸ Where the freed money could go      (unlock options, O)

▸ Got a lump sum?                         (planner, O)
▸ Months ahead                            (12-month forecast, O)
```

| Element | Class | Reason |
|---|---|---|
| Goals with verdict | E | The page's question |
| Verdict wording | E | Kept from 5.1 ("fits", "tight", "doesn't fit" plus the per-month figure) |
| Suggested order | O | |
| Money freeing up, headline | C | Only if something ends within 24 months |
| Unlock options | O | |
| Lump sum | O | A tool you open with a question in mind |
| 12-month forecast | O | Detail |

**Empty:** "A goal turns 'I should save' into 'I need ₹8,300 a month'." (keep this line, it's
good) with an Add goal button.

---

### 4.10 Progress (was Summary)

**Current (Found).** 6 stat tiles; Month by month (Recharts: income | expenses stack | left);
Where it went (split bar, category bars, month chips); category heatmap; Debt down (curve +
payoff timeline); Did the plan hold; Momentum. Tables sit behind "Show the figures".

**Proposed: four questions, one chart each, everything else folded.**

```
Progress
Your months side by side — are things moving the right way?

  ↗ Debt is going down · ↔ Savings steady · ↘ Day-to-day up ₹1,200   ← Momentum strip (E, words + arrows)

Am I keeping more than I spend?        [chart: Month by month, In | Out stack | Left]
  "October left ₹4,100 after everything — your best month so far."   ← takeaway sentence above chart
  ▸ Show the figures

Where does the money go?               [chart: category bars for chosen month]  month chips
  ▸ By category, month by month (heatmap)
  ▸ Show the figures

Is debt going down?                    [chart: debt curve] "Debt-free Mar 2029 at this pace."
  ▸ Each loan's end date (payoff timeline)

Did the plan hold?                     13 of 14 commitments kept · ₹2,100 above plan   (no chart, kept)
```

| Element | Class | Note |
|---|---|---|
| Momentum strip | E | Answers the page question in words |
| 6 stat tiles | **X** as a tile grid | DESIGN_SYSTEM §14 forbids equal-weight KPI tiles. Their figures move into the Breakdown of each section and the chart takeaways |
| Each chart's takeaway sentence | E | No chart without one |
| Heatmap, payoff timeline, figure tables | O | |

**Thin-data honesty (Found: one complete salary month exists):** under 3 closed or recorded
months, each section says "Only 1 full month so far, so there's no trend yet." and the chart
draws without trend language.

**Phone:** charts at full width, 220px tall. Tooltips open on tap and close on tapping outside. Category bars are horizontal and need no x-axis labels.

---

### 4.11 Onboarding (`/onboarding`)

**Current (Found).** Pay day → Income → Accounts → Commitments → Set-asides, with a Real
Balance preview.

**Proposed.**
- Keep the order. It builds the core number in the order the formula needs.
- Full-screen focus layout (no sidebar). A progress label reads "Step 2 of 5 · Your income".
- The Real Balance preview becomes a **live strip stuck to the bottom** that grows as each step adds data: "So far: ₹43,116 held − ₹3,226 set aside − ₹36,023 promised = ₹3,867 free". Each figure comes from `/position`, never from adding up the form inputs in the browser. This is the product's aha moment, made visible.
- "Skip for now" on Commitments and Set-asides, with the honest consequence: "Your free figure will read 'incomplete' until you add them."
- The last step lands on Today with a one-time welcome line in the editorial serif.

---

### 4.12 Help (`/help/*`)

**Keep** the manual and its own shell, which is good work. Changes:
1. It becomes the **only** long-form help (primers and guide sheets are removed, 3.3).
2. The header `?` on every page opens the **overlay** at that page's topic (`contextMap.ts` already exists).
3. Search moves to the top of the overlay.
4. On a phone the overlay is a full-height sheet and the help shell's sidebar becomes a "Topics" dropdown.

---

### 4.13 Commitment add / edit sheets

**Current (Found).** Simplified on 2026-11-09 (Name, Amount with Same/Changes chips, Starts /
Ends dropdowns with real dates, More details fold, plan-change "From when + Why" only on plan
fields). That work is good and matches the user's rules.

**Proposed.**
- Move it into the new Sheet (right side, 480px on desktop; full-height on a phone).
- Group the fields under three quiet headings: *What and how much* · *When* · *Paid from*.
- Keep the edit sheet's plan-revision preview, and give it the visual weight of a consequence card: "From December: ₹500 more a month. Free after commitments goes from ₹7,830 to ₹7,330."

---

### 4.14 Other sheets (account, card, debit card, loan, investment, policy, goal, update balance, record statement, settle commitment)

- All move to the shared **Sheet**.
- All use **FormField** (label above, hint below in "pick X when…" form, error below in critical).
- All use **FormFooter** (primary right, cancel left, a loading state on the primary).
- Derived fields (loan EMI and tenure from `/loans/estimate`) are marked "Worked out for you — change it if yours differs" (kept), shown in the derived style (Part 5.7).

---

### 4.15 Settle commitment sheet

Keep the logic, including the U3 fix (pay from anywhere). On a part-paid commitment, the
"link that entry instead" advice is wrong (`USAGE_ISSUES` M2 note). Show it **only when
`confirmedAmount` is zero**. This is a frontend-only copy fix.

---

### 4.16 Error, not-found and empty routes

- **New `NotFound` page** inside the shell: "This page doesn't exist. It may have moved. Go to Today." There is no catch-all route today (Found).
- **Detail of a missing or other-user record** (the backend returns 404): "We couldn't find this account. It may have been deleted." with a link back to its register.

### 4.17 Settings (`/settings`, new page on the existing API)

- Display name (`PATCH /me`).
- Appearance: System / Light / Dark (frontend only, `localStorage`, `data-theme`).
- Pay day: shown read-only with the line "Changing your pay day reshapes every month. Ask before changing." **Whether to allow editing is an open product decision.** `cycleStartDay` affects cycle membership, which is derived, but existing cycle rows and snapshots make a mid-stream change risky. Read-only until the user decides.
- Reset hidden tips (clears the `kosh.*` disclosure keys).

---

## Part 5 — Visual design system (v3)

### 5.1 Direction

Keep the identity, "Quiet Instrument: warm paper, one deep teal". **Revised 2026-11-09 on the
user's review:** a first v3 attempt tinted the backgrounds (a cool mint ground, then a warmer
beige) and the user rejected both. *"The earlier colors were good, the backgrounds in the last
version were fresh."* **The v2 neutrals are therefore kept exactly** (`#FAFAF9` ground, white
surface). Freshness comes from where the accent and semantic colours are *used*, not from tinting
the page (5.4a).

What changes from v2 is execution, not the palette: a darker hover instead of a lighter one, a
readable muted text colour, washes and an info colour added for banners, text-on-accent for
dark mode, three weights, sentence-case section titles instead of uppercase micro labels.

### 5.2 Colour (light)

| Token | HEX | Purpose |
|---|---|---|
| `--ground` | `#FAFAF9` | Page background. Warm off-white (unchanged from v2) |
| `--surface` | `#FFFFFF` | Cards, sheets, the sidebar |
| `--surface-raised` | `#FFFFFF` + shadow-2 | Popovers, drawers, sheets |
| `--sunken` | `#F5F5F4` | Wells, inputs on surface, skeletons, inactive segments |
| `--line` | `#E7E5E4` | Row rules, dividers |
| `--border` | `#D6D3D1` | Input borders, secondary-button borders |
| `--ink` | `#1C1917` | Primary text |
| `--ink-soft` | `#44403C` | Secondary text |
| `--ink-muted` | `#6F6A66` | Captions, labels. A touch darker than v2's `#78716C` so it clears AA on every light surface |
| `--accent` | `#0F766E` | Brand teal: primary buttons, the hero figure, focus, links, selected nav |
| `--accent-hover` | `#115E59` | Hover and pressed (darker reads as "pressed in"; v2's lighter hover read as disabled) |
| `--accent-wash` | `#F0FDFA` | Highlight band, selected row, active nav |
| `--on-accent` | `#FFFFFF` | Text on a solid accent fill (dark mode uses `#04201C`) |
| `--positive` / `-wash` | `#047857` / `#ECF8F2` | Paid, on track, improved |
| `--attention` / `-wash` | `#B45309` / `#FDF6EC` | Needs you. Not danger |
| `--critical` / `-wash` | `#B91C1C` / `#FCEDEB` | Overdue, below zero, failed |
| `--info` / `-wash` | `#1F5FA8` / `#ECF2FA` | Neutral information (help callouts, an "estimated" marker) |
| Domain hues `--commit #52525B`, `--goal #7C3AED`, `--debt #9A3412`, `--invest #1D4ED8` | kept | Identity rules and dots only |
| `--viz-*`, `--chart-*` | kept | Validated on 2026-11-09. Not changed |

There is no second brand hue: secondary emphasis is ink weight, not colour.

### 5.3 Colour (dark)

v2's dark palette is kept: ground `#0C0A09`, surface `#1C1917`, raised `#26221F`, sunken
`#151311`, line `#34302C`, border `#47413C`, ink `#FAF9F8`, soft `#D6D3D1`, muted `#A8A29E`,
accent `#2DD4BF` (hover `#5EEAD4`, wash `#0F2E2B`, on-accent `#04201C`), positive `#34D399`,
attention `#F59E0B`, critical `#F87171`, info `#7FB0EE`; washes are the hue at 12% over the surface.

**Contrast:** every text/background pair in 5.2 and 5.3 passes AA (script `contrast`, run
2026-11-09), including solid-accent buttons in both modes. A change to any token is re-checked
before it lands. Dark mode follows `prefers-color-scheme`; Settings can force light or dark
with `[data-theme]` on `<html>`.

### 5.4a Highlights: simplicity with a few things that command the eye

*(User intent, 2026-11-09: "simplicity along with highlights wherever required, with dominance
and effective eye catching.")* The page is quiet on purpose, so that the handful of things that
matter can be loud. **At most three highlighted things on any screen, and one of them dominant.**

| Highlight | Treatment | Used for |
|---|---|---|
| **The answer** | The hero figure in `--accent` at hero size (44px, 600), the largest thing on the screen by a wide margin | Spend today; Still to pay; Net worth; each page's one number |
| **The primary action** | A solid `--accent` fill with `--on-accent` text. Exactly one per view | Add, Save, Record payment |
| **What needs you** | `--attention-wash` band with an `--attention` edge and the count in a solid attention badge. `--critical` only for overdue / below zero | Needs-you status line, overdue rows, the nav badge |
| **Where you are** | `--accent-wash` fill with accent text | Active navigation, selected row, the current month |
| **Good news** | `--positive` text with a word and a check: never a celebration | Debt repaid, plan kept, a cleared warning |

Everything else stays in ink and grey. The test: squint at the screen; one thing should stand
out first, and a second or third only if something genuinely needs the user.

### 5.4 Money colour rules (kept, restated)

1. Money in is **not** green and money out is **not** red. Direction is shown by a sign (`+₹57,700`), a word ("came in") and its position.
2. `--critical` only for below zero, overdue and failed. Debt is clay, never red.
3. At most **two** semantic colours on screen at once.
4. Colour never carries meaning alone. It always comes with a word, an icon or a shape.

### 5.5 Typography

**Decision: Inter for everything functional and every number; Instrument Serif for at most
one editorial line per screen.** Both are already installed.

- **Why not Geist or Manrope:** neither improves numeral readability over Inter's tabular
  figures, and switching changes every screen's rhythm without a reason the user can see.
  Inter has true tabular and slashed-zero features, which `.num` already uses.
- **Why keep the serif:** it is the one thing that makes a screenshot recognisably Kosh.
  It is scarce: empty-state headlines, the month-close ending line, the onboarding welcome.
  **Not modal titles.** Today's `Modal` uses it for every title, which overuses it.

| Role | Desktop size/line | Phone | Weight | Notes |
|---|---|---|---|---|
| Hero figure | 44/48 | 34/40 | 600 | `.num`, accent |
| Page title | 24/30 | 22/28 | 600 | Sentence case |
| Section title | 16/24 | 16/24 | 600 | **Replaces the uppercase micro labels** for section headers |
| Section figure | 24/30 | 20/26 | 600 | `.num` |
| Row primary text | 15/22 | 15/22 | 500 | |
| Row figure | 15/22 | 15/22 | 500 | `.num`, right-aligned |
| Body | 15/24 | 15/24 | 400 | |
| Supporting / subtitle | 13/20 | 13/20 | 400 | `--ink-muted` |
| Label (form, table header) | 13/18 | 13/18 | 500 | `--ink-soft` |
| Caption | 12/16 | 12/16 | 400 | |
| Micro (chips, axis) | 11/14 | 11/14 | 500 | Uppercase only inside chips |
| Button | 14/20 | 15/20 | 500 | |
| Editorial (serif) | 26/32 | 22/28 | 400 | One per screen, at most |

**Weights:** 400, 500 and 600. The two-weight rule is retired: the code already uses 500
widely, and a rule nobody follows is worse than an honest three.

**Number craft (kept):** ₹ at 0.62em and muted; a true minus `−`; `—` for unknown; `en-IN`
grouping (₹1,31,000); whole rupees in summaries, paise only in Activity row detail;
`₹1.2L`/`₹4.5Cr` only on chart axes; never `10.0K`.

### 5.6 Spacing, layout, radius, elevation

- **Scale (kept):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 (`space-1` … `space-12`).
- **Page gutters:** 16 on a phone, 24 on a tablet, 40 on desktop.
- **Content widths:** `--width-read` 720px (Today, Month, Activity, detail pages, sheets' content); `--width-wide` 1120px (Money overview, Progress, Goals). One page uses one width; no width changes mid-page.
- **Grid:** 4 columns on a phone, 8 on a tablet, 12 on desktop. Gaps of 16 / 24 / 24.
- **Section spacing:** 32 between sections, 48 between major zones. Rows are 44–52px (density kept).
- **Card padding:** 20 on a phone, 24 on desktop. **Cards only where the content is one object** (a goal, a policy, a needs-you item). Lists sit directly on the ground with rules, so there are no nested cards.
- **Radius:** 6 for chips and badges · 8 for inputs, buttons and segments · 12 for cards · 16 for sheets and dialogs (top corners only for bottom sheets) · full for pills and avatars.
- **Elevation:** 0 for cards (no shadow, no border on `--ground`; a 1px `--line` border only when a card sits on `--surface`) · shadow-1 `0 1px 2px rgb(0 0 0 / .06)` for sticky bars · shadow-2 `0 8px 24px rgb(0 0 0 / .12)` for popovers, sheets, drawers and toasts.
- **Dividers:** a 1px `--line` between rows inside a list. Sections are separated by space, not by a rule (this removes most of today's `Divided` hairlines).
- **Icons:** Lucide, stroke 1.5. 16 inline, 20 in nav and buttons, 24 in empty states. One icon per domain, used everywhere for it.

### 5.7 Component standards

| Component | Standard |
|---|---|
| **Button** | Variants: primary (accent fill), secondary (surface + border), ghost (text), destructive (critical text, critical fill only in a confirm dialog). Heights: 40 desktop, 48 phone; `sm` 32. At most one primary per view. Loading shows a 14px spinner inside, keeps its width and is disabled. Disabled is 40% opacity with no pointer |
| **IconButton** | 36×36 (44×44 touch target on a phone). Always has an `aria-label` |
| **Input** | 44px high, 8px radius, 1px `--border`, `--surface`. Focus: 2px accent ring with offset. Label above, hint below, error below in critical with an icon. Never a placeholder used as the label |
| **AmountInput** | ₹ prefix muted. Grouping applied as you type (`1,00,000`). `inputmode="decimal"`. 40px on the Add sheet |
| **Select / Combobox** | The existing `Select.tsx` (470 lines) becomes the single list picker: search appears above 7 options, recent items first, keyboard ↑↓↵, and a bottom sheet on a phone |
| **Segmented control** | For 2–5 exclusive options (transaction type, By date/By category). The selected segment is surface on sunken |
| **Date picker** | Quick chips (Today, Yesterday) plus a native `<input type="date">` underneath. Native is accessible, localised and free. No library |
| **Month switcher** | ‹ label › showing real dates, plus a "Back to this month" chip when away |
| **Card** | See 5.6. An optional domain rule on the left (3px) for goal, debt and investment cards |
| **List row** | Leading (optional icon or domain dot) · primary + secondary text · trailing figure + status. Whole row is clickable when it navigates. Hover is `--sunken`. A trailing `⋯` holds row actions |
| **Statement** | Kept as the Excel-craft primitive for derivations and key facts: label left, figure right in one column, a rule before totals, signs explicit |
| **Tabs** | Underline tabs for sibling pages (Money). Segmented for views within a page |
| **Badge / StatusPill** | A word, always (Paid, Due tomorrow, Estimated). Sunken background, semantic text colour. Never a bare dot |
| **Tooltip** | Only for icon-button names and truncated text. **Never for information the user needs.** That goes inline or in a Breakdown |
| **InfoTip (ⓘ)** | For a term's plain-language meaning next to a label. A popover on click, not hover, so it works on touch |
| **Breakdown** | Only for registry figures (6.4). Native `popover` on desktop (anchored, 360px), a bottom-sheet `<dialog>` on a phone. Shows the formula line, `Statement`, caveats, and "Open in Activity ›" when lines link to records |
| **Sheet** (replaces `Modal` for forms) | Right side 440–520px on desktop, full-height bottom sheet on a phone. Header (title, close), scrolling body, footer stuck to the bottom. **Built on native `<dialog>` + `showModal()`** (6.8). Discard guard when dirty |
| **Dialog** (confirmations only) | Centred, 400px, native `<dialog>`, `role="alertdialog"` for destructive actions. Title, consequence sentence, Cancel + action. The action is destructive-styled for deletes |
| **Drawer** | Right panel (Needs you, Help overlay). **Modal** (`showModal()`), so the page behind is inert while it is open. A non-modal panel that lets you click a page row underneath is a focus-management trap, and the panel's rows already link to their targets |
| **Toast** | One host, an `aria-live` region. Kinds: **effect toast** (existing, after writes), **pending toast** (a delete in its undo window), and **system toast** (errors, connectivity). Bottom right on desktop, above the bottom bar on a phone. At most 2 visible. The timer pauses on hover and on focus (existing pattern) |
| **Banner** | Full-width, inside the page, for app-level states (offline, server unreachable, demo or estimated data). Dismiss only if the state is non-blocking |
| **Empty state** | Icon (24, muted) · serif headline · one sentence on why it matters · one action. Left-aligned within the column |
| **Skeleton** | The final layout's shapes in `--sunken` with a 1.2s shimmer (disabled by reduced motion). Never over the hero figure: the hero skeleton is a still block |
| **Progress bar** | 6px, sunken track, domain or accent fill, always labelled with both figures |
| **Chart** | Recharts. Takeaway sentence above. No gridlines except one baseline. Direct labels over a legend where they fit. Tooltip prints server strings only (ADR-0022 §2). "Show the figures" table under each chart |
| **Nav (sidebar / bottom bar)** | See Part 7 |

### 5.8 Fine, not thick: the sleek pass (binding; overrides any size in 5.5–5.7 it contradicts)

**Why this section exists.** The user, 2026-11-09: *"it should be fine and sleek design, not
thick … I want to give premium experience to customers, not thickness and bulkiness."*
Measured in the code that day, the bulk comes from a handful of specific choices:

| Source of bulk (Found) | Where | Count |
|---|---|---|
| 44px controls on every screen size | `h-11` on buttons, inputs, Select `field`, nav Add | 12 + Select |
| 2px ink rules under totals | `Statement` `total`/`hero` (`border-t-2 border-ink`) | every derivation |
| Uppercase micro labels | `text-micro uppercase` eyebrows, Statement total labels, help headings | 72 |
| Medium weight (500) used as a default | `font-medium` | 87 |
| Mixed icon strokes | 1.5 / 1.75 / 2 / 2.25 | 164 icons |
| Heavy overlay shadows | `shadow-lg`, `shadow-xl` | 6 |
| Browser-default scrollbars | none styled; 16px grey gutters on Windows | every scroller |
| Hero at 600 weight | `--text-hero` | every page |

**The principle:** premium is **thin lines, light weights at large sizes, tight controls and
generous space between groups**. Mass comes from size and whitespace, never from heaviness.
These are the values Sonnet implements. Change them only with the user.

#### 5.8.1 Lines

| Token / rule | Value | Notes |
|---|---|---|
| `--hairline` | `1px`; **`0.5px` on screens ≥ 2dppx** (`@media (min-resolution: 2dppx)`) | Row rules, dividers, card edges. A real hairline on retina phones is the single biggest "fine" signal |
| Input and secondary-button border | always `1px` `--border` | Never 0.5px: controls must stay findable |
| Statement `total` / `hero` rule | **`1px --ink-soft`** (was 2px `--ink`) | The total is marked by its position, weight and spacing, not a thick bar |
| Statement `subtotal` rule | `--hairline --border` | |
| Row rules in lists | `--hairline --line` | |
| Section separation | **space only** (40px), no rule | Removes most `border-t` section dividers |
| `border-ink` anywhere | **removed** (8 uses) | Ink-coloured lines read as heavy |
| Focus ring | `2px` accent, `2px` offset (kept) | Accessibility outranks sleekness here |

#### 5.8.2 Type: lighter at size, smaller at body

Replaces the scale in 5.5. Inter is installed at 400/500/600 only, so no new font files.

| Role | Size / line | Weight | Tracking | Was |
|---|---|---|---|---|
| Hero figure | 40 / 44 (phone 32 / 38) | **500** | −0.025em | 44, 600 |
| Page title | 22 / 28 (phone 20 / 26) | 600 | −0.015em | 24, 600 |
| Section title | 15 / 22 | 600 | −0.005em | 16, 600 |
| Section figure | 22 / 28 | 500 | −0.02em | 24, 600 |
| Body | **14 / 22** | 400 | 0 | 15 / 24 |
| Row primary | 14 / 20 | **400** (500 only for the row's figure) | 0 | 16, 500 |
| Row figure | 14 / 20 | 500, tabular | −0.01em | 16, 500 |
| Supporting / subtitle | 13 / 20 | 400, `--ink-muted` | 0 | — |
| Label (form, column header) | 12.5 / 16 | 500, `--ink-soft` | 0 | 13, 500 |
| Caption | 12 / 16 | 400 | 0 | 12 |
| Micro (badge, chart axis, table column header only) | 11 / 14 | 500 | +0.04em, uppercase **only** in table headers and badges | everywhere |
| Button | 13.5 / 20 | 500 | 0 | 13, 500 |

**Weight rules:**
- 600 is for titles only.
- 500 is for figures, buttons and labels only.
- Everything else is 400.
- `font-medium` on body copy, list text or captions is removed.

**Uppercase rule:** no uppercase eyebrows above page titles, and no uppercase Statement totals
(sentence case, 500). Uppercase is used only in table column headers and badges.

#### 5.8.3 Controls: compact on desktop, finger-sized on touch

Sized by **input type, not width**: `@media (pointer: coarse)` restores touch sizes, so a
touch laptop also gets them.

| Control | Fine pointer | Coarse pointer | Radius |
|---|---|---|---|
| Button (default) | **36px**, padding-x 14px | 44px | 7px |
| Button (sm) | 30px, padding-x 10px | 36px | 6px |
| Input, Select field, date | **36px**, padding-x 12px | 44px | 7px |
| Chip / segmented option | 28px | 36px | full / 6px |
| Nav item (sidebar) | 34px | — | 7px |
| Icon button | 32×32 (icon 16) | 44×44 | 7px |
| Bottom bar | 56px + safe area (kept) | — | — |
| Add pill (phone) | 48px (kept, a primary touch target) | — | full |

Inputs: `--surface` fill, `1px --border`, no inner shadow. Hover: border to `--ink-muted`.
Focus: border `--accent` plus the 2px ring. Placeholder `--ink-muted` at 400.

#### 5.8.4 Radius, elevation, icons

| | Value | Was |
|---|---|---|
| Card | 10px | 12 (`rounded-xl`) |
| Sheet / drawer / popover / dialog | 14px | 16 |
| Inputs, buttons | 7px | 8 (`rounded-lg`) |
| Badges, chips | 6px / full | — |
| `--shadow-1` (sticky header on scroll) | `0 1px 0 var(--line)` (a hairline, not a blur) | — |
| `--shadow-2` (popover, menu, toast) | `0 0 0 1px rgb(0 0 0/.04), 0 4px 12px -2px rgb(0 0 0/.08), 0 12px 32px -8px rgb(0 0 0/.10)` | `0 8px 24px /.12` |
| `--shadow-3` (sheet, dialog) | `0 0 0 1px rgb(0 0 0/.05), 0 24px 64px -12px rgb(0 0 0/.22)` | `shadow-lg` |
| Dark mode shadows | the same shapes, with alpha ×2.5, plus the 1px ring at `rgb(255 255 255/.06)` | — |
| Scrim | `--ink` at **32%** | 40% |
| Icons | **stroke 1.5 everywhere**; 16px inline and in buttons, 18px in nav, 20px in empty states. Exception: glyphs of 12px or less use 1.75 | 1.5–2.25 mixed |

`shadow-lg` and `shadow-xl` utilities are removed in favour of the tokens.

#### 5.8.5 Scrollbars

| Where | Treatment |
|---|---|
| All scrollers (`main`, sheet body, popover, Select list) | Thin: `scrollbar-width: thin`; `scrollbar-color: var(--scroll-thumb) transparent`. WebKit/Blink: a 10px track, transparent; the thumb is 6px visible (2px transparent border + `background-clip: padding-box`), radius full, `--scroll-thumb` = `--ink` at 18% (dark mode: `#fff` at 18%). Hover on thumb: 32% |
| Calm by default | The thumb is `transparent` until the scroller is hovered, focused-within, or being scrolled (`:hover`, `:focus-within`). Touch devices keep the OS overlay scrollbars (nothing is set under `pointer: coarse`) |
| Layout stability | `#app-main { scrollbar-gutter: stable; }` so pages never jump sideways when content grows past one screen |
| Horizontal strips (Money tabs, month chips, filter chips) | **No visible scrollbar** (`scrollbar-width: none`; `::-webkit-scrollbar { display:none }`). An edge fade instead: `mask-image: linear-gradient(to right, transparent, #000 16px, #000 calc(100% - 16px), transparent)`, shown only on the side that has more content. This is not a gradient on data; it is a scroll affordance |
| Never | A horizontal scrollbar on a page. Tables become rows on a phone (§7.4) |

#### 5.8.6 How information is laid out (the "conveyed" part)

The goal is that the eye moves **down one line**, not around a dashboard.

1. **One spine per page.** One content column (`--width-read` 720px, or `--width-wide` for
   Money, Goals and Summary). Figures sit on **one right edge**, so every amount on a page
   lines up vertically, as in the spreadsheet.
2. **Page header:** title (22px) and a one-line subtitle in `--ink-muted`. Actions sit at the
   right as ghost or secondary buttons. **No box, no rule** under it, just 24px of space.
3. **Answer block:** the hero figure, one sentence beneath (14px, `--ink-soft`) and, at most,
   one **fact strip**.
4. **Fact strip** (replaces stat tiles and short Statements of 2–4 facts): a single row of
   label-over-figure pairs separated by `--hairline` vertical rules, with no boxes. Label 12px
   `--ink-muted`, figure 15px 500 tabular. On a phone it wraps 2 × 2 with the rules turned
   horizontal.
   Example: `Free until salary ₹3,168 │ Days left 19 │ Set aside ₹10,001`.
5. **Sections:**
   - A section title (15px 600) with an optional right-aligned muted meta ("₹18,240 still to
     leave") **on the same baseline**, then the content.
   - 40px between sections; 0 rules between them.
6. **Lists are ruled rows, not cards.**
   - Rows are 44px (fine pointer) / 52px (coarse), with hairline rules.
   - Primary text 14/400, secondary 12.5 `--ink-muted` on the same line on desktop
     (`Name · account · date`) and on a second line on a phone.
   - The figure is right-aligned 14/500.
   - Hover: `--sunken` at 60%. No row borders on the sides. No zebra stripes.
7. **Cards only for a single object** (a goal, a policy, a needs-you item). They have a 10px
   radius and a `--hairline --line` edge with no shadow. **Never a card inside a card**, and
   never a card around a list.
8. **Disclosure is a quiet text link** — `Show 9 more ▾`, `How is ₹3,168 worked out?` — 13px
   accent, never a bordered button. The opened content gets no extra frame.
9. **Numbers carry the hierarchy, not boxes.** The hero is 40px, section figures 22px, row
   figures 14px. Three sizes of figures per page at most.
10. **Whitespace budget:** 8px inside a row group, 16px between a title and its content, 40px
    between sections, 56px between the answer block and the first section on desktop (40 on a
    phone).
11. **Truncation:** names truncate with an ellipsis and show the full text on hover/focus
    (`title`). Figures never truncate or wrap.
12. **Sticky compact header** on long pages (Ledger, Months, detail pages): after 48px of
    scroll a 48px bar appears with the page title (15px 600) and its primary action. It has a
    solid `--ground` background and a `--hairline` bottom (`--shadow-1`). No blur and no
    glass (DESIGN_SYSTEM §2).

#### 5.8.7 Sidebar, sleeker

- Width 220px (was 232). Background `--surface`, `--hairline` right edge.
- The wordmark is 15px 600.
- The Add button is 34px, full width, radius 7.
- Items are 34px, label 13.5/400 in `--ink-soft`, icon 18px.
- Active item: label in `--ink` at 500 on an `--accent-wash` fill, plus a **2px accent bar** on
  the item's left edge (inside the radius). Hover: `--sunken`.
- The badge is 16px tall, 11px figure.
- Help sits at the bottom, 13px `--ink-muted`.

#### 5.8.8 Acceptance for the sleek pass (added to Part 12 as phase "1b")

| # | Check | Expected | Who |
|---|---|---|---|
| K1 | Count `border-ink`, `border-t-2`, `shadow-lg`, `shadow-xl`, `h-11` in `src` | 0 (except where §5.8.3 coarse-pointer rules restore 44px in CSS) | C |
| K2 | Count `text-micro uppercase` | Only table headers and badges | C |
| K3 | Computed heights at 1440 (fine pointer): button 36, input 36, nav item 34; with `pointer: coarse` emulated: 44 | Match | C |
| K4 | Statement total rule | 1px, `--ink-soft` | C |
| K5 | Scrollbar on `#app-main` (Windows Chrome) | Thin, invisible until hover; no layout shift when content grows | C + U (eyeball) |
| K6 | Money tabs and chip strips at 390px | No visible scrollbar; edge fade on the overflowing side | C |
| K7 | Contrast re-run after the weight/size change (thin text at 400 is the risk) | All AA | C |
| K8 | User eyeball at 1440 and on a phone: "fine and sleek, not bulky" | User says yes | U |

---

## Part 6 — Interaction and feedback system

### 6.1 Navigation behaviour

- Route changes show the **page skeleton**, not a blank `null` fallback. Each lazy route exports a `Skeleton` used as its `Suspense` fallback.
- Scroll resets to the top on a page change and is restored on Back (React Router `ScrollRestoration` with a data router, or a small custom hook keyed by location; the custom hook is preferred to avoid migrating to `createBrowserRouter`).
- The month switcher, filters and tabs live in the URL, so refresh and Back behave.
- Keyboard (desktop):
  - `Ctrl/Cmd+K`: Add transaction (kept).
  - `G` then `T` / `A` / `M` / `$` / `O` / `P`: go to a section (optional, P3).
  - `?`: Help overlay.
  - `Esc`: close the top layer.

### 6.2 Forms

- Validation runs **on blur and on submit**, never on every keystroke. Errors clear as soon as the field becomes valid.
- On submit with errors: focus moves to the first invalid field and a summary line appears at the top for long sheets ("2 things need fixing").
- **Server field errors** (`AppError.fieldErrors`) map onto fields. `AppError.fix` shows under the error. Unmapped errors show in the footer.
- **Dirty guard:** closing a sheet with changes opens "Discard changes? Your entry won't be saved." with *Keep editing* or *Discard*. Leaving the route while a sheet is dirty does the same. A page refresh triggers the browser's own prompt through `beforeunload`, only while dirty.
- **Duplicate submits:** the primary button disables from click until the response. A double Enter is ignored.
- **Defaults:** the last used account per transaction type and the last used category for a description (frontend memory in `localStorage`, best-effort).

### 6.3 Feedback patterns: when to use what

| Situation | Pattern |
|---|---|
| A write succeeded and changed something that matters | **Effect toast** (existing, ADR-0017): "Recorded · Spend today now ₹232" |
| A routine write succeeded with no consequence worth saying | Quiet effect toast ("Recorded"), 4s. The figure update is the main feedback |
| A delete | Pending toast "Deleting in 6s · Undo", then the server's result (6.6). **Never "Deleted" before the server confirms** |
| Field invalid | Inline, under the field |
| Form-level server error | Footer line in critical, with the fix |
| Section failed to load | Inline error in the section with Retry. The rest of the page stays |
| Whole page failed (main query) | Full-page error state with Retry and a "Go to Today" link |
| Server unreachable (status 0) | **Connectivity mode** (6.11): app banner, stale-data marking, writes held, capped backoff |
| Something will go wrong soon (shortfall, overdue) | An insight on the right surface. **No toast or banner duplicating it** |
| A destructive action | Confirm dialog with the consequence (archive, delete, close month, discard) |
| Missing data | Unknown state (`—` plus "needs a number" and an action) |

### 6.4 The Breakdown: which figures can explain themselves

**The rule:** an interactive Breakdown is offered **only** when the server supplies the parts
of a figure **and** the figure's total. The browser lays out what the server said. It never
adds, subtracts, divides or derives money to build a proof. A figure the server cannot prove
looks different, so it is never mistaken for one that can.

#### Three figure classes

| Class | When | How it looks | Interaction |
|---|---|---|---|
| **Explained** | The figure has a registry entry: its server response carries the component lines and the server's total | Dotted underline on hover/focus. On a phone, a small `›` after the figure | Opens the Breakdown: server lines, server total, server caveats |
| **Incomplete** | The server marks it unfinished (`complete: false`, `state: 'INCOMPLETE'`, `upperBound: true`, `unknownBillCount > 0`, `confidence` estimated, non-empty `caveats`) | The figure shown the way the server allows: `—`, "at most ₹X", or "≈ ₹X". It is followed by a word chip: *incomplete*, *at most* or *estimated*. Never colour alone | If it is also in the registry: the Breakdown opens with a **"Not counted yet"** section listing what is missing (server-named, for example "2 commitments without an amount") and an action to fix each. If not: the chip opens a one-line explanation using the server's `unknownReason` / `fix` text |
| **Unexplained** | No registry entry. The server gives only the number | Plain figure: no underline, no chevron. Where the meaning of a field is fixed (a balance you typed, a loan's EMI from its terms), a static source caption may be shown, such as "Balance you entered on 3 Oct" | None. It is still a correct figure; it just has no server-side derivation to show |

#### Never, in the browser

- Sum lines to make a total, or show a line the server did not send (no "other").
- Compute a percentage, ratio or difference of money for a Breakdown. Display ratios the server sends (`emiShareOfIncome`) as they are.
- Fill an unknown with zero to make lines balance.
- Re-total a list after a local change, such as a pending delete (6.6).

**If the server's lines visibly fail to add up to its total**, that is a backend defect. The
Breakdown still shows exactly what was sent and adds the caveat "These parts don't add up to
the total. This has been noted." The defect is logged in `FIX_BACKLOG`. The browser does not
"fix" it.

#### Breakdown registry (starting set; each entry verified in its phase by reading the backend calculator)

| # | Figure | Server source | Lines | Verified when |
|---|---|---|---|---|
| B1 | Real Balance / Free until salary; Room today | `/financial-state.position.breakdown` (and `/position`) | held · reserved · committed · card dues, with `accounts[]`, `commitments[]`, `cards[]` | Phase 5 |
| B2 | Runway ("If income stopped") | `/financial-state.runway.basis` (Provenance) | provenance sections and lines with `ref` | Phase 5 |
| B3 | Debt total / EMI per month / debt-free date | `/financial-state.debt.basis` (Provenance) | provenance sections | Phase 10 |
| B4 | Net worth | `/net-worth` | totalAssets · totalLiabilities → netWorth. **Verified 2026-11-10** (`PositionServiceImpl.currentNetWorth`: assets − liabilities; live 97,503.90 − 3,07,070.91 = −2,09,567.01) | Phase 10 ✓ |
| B5 | Month: still to pay | `/cycles/{id}/plan-progress` (+ position `committed`) | needsYouTotal · upcomingTotal → committed. **Verified 2026-11-09 (3,100 + 2,000 = 5,100); never plannedTotal − settledTotal (5,594)** | Phase 7 ✓ |

**Not in the registry (unexplained until the server gives parts):** Activity's stated
summary and day subtotals; flexible spending vs usual; goal feasibility; forecast months;
Progress chart values; investment values.

Adding to the registry means naming the endpoint field and confirming in the backend code
that its total equals its signed lines. **No registry entry is added without that check.**

### 6.5 Notifications (in-app only): three tiers

No email, push or SMS exists in the backend. Every alert is an **insight**, created, ranked
and keyed by the server (`/insights`, `severity`, `key`). The frontend decides only **where**
it appears and **how loudly**. It never creates an alert of its own.

| Tier | Server severity | What it means | Examples | Where it shows | Badge | Dismiss | Snooze |
|---|---|---|---|---|---|---|---|
| **1. Critical financial alert** | `CRITICAL` | Money is lost, or a promise breaks, if nothing happens | Overdue commitment; an account goes below zero before a payment; card bill due with no plan | On the affected row (Today / Month) **and** at the top of Needs you. If it starts as the result of a write, the effect toast is **held** (stays until closed, "Needs you now") | Yes, with a count | "I know" is allowed. It hides the card, **but the row-level marker stays** while the condition is true. A critical fact is never fully silenced | Not offered: snoozing an overdue bill is hiding it |
| **2. Action required** | `ATTENTION` | Nothing lost yet, but it won't resolve itself | Commitment due in ≤ 3 days without an amount; loan EMIs not recorded; a stale investment value | Needs you. Today's status line names the top one | Yes, with a count | "I know" | 1 day / 3 days / until next salary (`/snooze?days=`) |
| **3. Informational** | `OPPORTUNITY`, `INFO` | Worth knowing, no hurry | Money freeing up; a goal back on track; something cleared | Needs you ("Worth knowing") and What changed. Never a badge | **No** | "I know" | Not shown (it doesn't nag, so there is nothing to snooze) |

**Frequency and duplicate suppression:**
1. **One key, one appearance per surface.** The server's `key` is the identity. A key already
   rendered on the page (for example a dated shortfall attached to a payment row) is removed
   from that page's list. This is the existing `consumed` / `hideKeys` rule, made universal.
2. **A toast only on a change.** An effect toast appears when a write *starts* or *clears*
   an insight (`started` / `cleared`), never because one is still true. Visiting a page never
   produces a toast.
3. **No toast for what the page already shows.** If the affected figure or row is on screen,
   the toast is the quiet kind.
4. **Polling:** Needs you refetches every 30s **only while it is open and the tab is visible**.
   Badge counts come from `/financial-state.attentionCount` on its normal refetch. There is no
   separate badge polling.
5. **Dismissed and snoozed items** are listed under "Answered (n)" with "Show it again"
   (`/restore`). Nothing disappears without a way back.
6. **Clears are news once.** "Bangalore trip is no longer behind" appears once, in What
   changed and as the write's toast, then never again.

**Open backend question (not resolved by the UI):** whether a dismissed CRITICAL item
returns on its own when it gets worse is server behaviour. The UI keeps the row marker
either way, so a critical condition can never be invisible. It is recorded in Part 11 as D3.

### 6.6 Deleting a transaction safely

**Found:** `DELETE /transactions/{id}` exists, with no restore endpoint. It invalidates
`Transaction` (list, summary, day subtotals), `Account`, `Position`, `NetWorth`,
`CommitmentInstance`, `Timeline` and more.

**Principle:** the user is never told something is deleted until the server says it is.
Undo is possible only **before** the request is sent, because afterwards there is nothing to
undo with.

#### States of one delete

```
idle ──Delete──▶ pending (6s, undoable) ──timer──▶ sending ──2xx/404──▶ deleted
                     │                                 │
                   Undo                              error
                     ▼                                 ▼
                   idle                     failed (entry kept, Retry)
```

| State | Row in Activity | Toast | Figures (hero, totals, subtotals) |
|---|---|---|---|
| **pending** | Stays in place, dimmed, struck through, label "Deleting…". Not hidden: hiding it would make the list disagree with the server's subtotals | "Deleting this entry in 6s · **Undo**", with a timer bar that pauses on hover and focus | **Unchanged.** Still the server's last values |
| **sending** | Same, with a small spinner. Undo is no longer offered | "Deleting…" | Unchanged |
| **deleted** (2xx) | Removed by the refetch that tag invalidation triggers | "Entry deleted." (4s). No Undo, because none exists | Refetched from the server. The hero counts to its new value |
| **deleted** (404) | Removed after a refetch | "This entry was already deleted." | Refetched |
| **failed** (other error, or network) | Restored to normal | "Couldn't delete this entry. It's still in your records." · **Retry**, with the server's `message` / `fix` when present | Unchanged |

#### Rules

1. **Single flight.** Pending deletes live in `uiSlice` as `pendingDeletes: Record<id, {state, startedAt}>`.
   - Delete is disabled for any id already in it, so a second click, a double tap or the
     same entry from another page does nothing.
   - The mutation uses `fixedCacheKey: 'delete-<id>'`, so the request is sent at most once.
2. **The timer lives in the store, not in a component** (a small listener middleware). It
   survives route changes within the app. Navigating from Activity to Today does not cancel
   or duplicate the delete.
3. **Undo** removes the id from `pendingDeletes` before the timer fires. The row returns, and
   focus goes back to that row (or to the toast's origin).
4. **Closing or reloading the tab while a delete is pending:** `beforeunload` shows the
   browser's leave prompt (only while something is pending or sending). If the user leaves
   anyway, **a pending delete is cancelled, not sent.**
   - The entry stays, which is the safe side. Nothing was ever claimed as deleted, so nothing
     false was said.
   - **Revision 1's `keepalive` send on `pagehide` is withdrawn.** It could delete with no one
     to see the result.
   - A request already in `sending` when the tab closes may or may not complete. On next load
     the list shows the truth either way.
5. **Cache consistency:**
   - No optimistic edit of any money figure or RTK cache entry. The pending look is a UI
     overlay keyed by id.
   - Only the mutation's existing `invalidatesTags` updates figures, after the server responds.
6. **Offline (6.11):** Delete is disabled while the server is unreachable ("Can't delete
   while Kosh can't reach the server"). The delete isn't queued.
7. **An entry that pays a commitment:** if the transaction is linked to a commitment, Delete
   first opens a **confirm dialog** saying what else changes: "This entry pays Electricity for
   November. Deleting it marks that commitment unpaid again." Only then does the pending
   window start.
   - **Dependency:** whether `TransactionResponse` exposes the link is checked in Phase 8.
   - If it doesn't, the dialog uses the generic "If this entry paid a commitment, that
     commitment will show as unpaid again." The UI never guesses which commitment.
8. **Bulk delete** does not exist and is not added.
9. **Archive** (accounts, goals, commitments, policies, categories) is reversible on the
   server (`/unarchive`). It uses a confirm dialog and, after the server confirms, a toast
   with **Undo** that calls `/unarchive`.

### 6.7 Loading

- Skeletons match the final layout, and each component owns its skeleton.
- The hero figure never shows a spinner.
- Data is kept while refetching (RTK Query default). A stale figure stays visible during a refetch, with no flicker. In connectivity mode it is marked stale (6.11).
- Mutations: the button shows the spinner; the list updates on tag invalidation. Optimistic updates **only** for insight dismiss and restore (fully reversible, no money involved). **Never for money**, and not for deletes (6.6).

### 6.8 Accessibility architecture

**Decision: build on native browser primitives.** No custom focus trap, and no new dependency.

| Need | Primitive | What the browser provides | What we still write |
|---|---|---|---|
| Sheet, bottom sheet, Dialog, Drawer | `<dialog>` + `showModal()` | Top layer; **everything outside is inert** (no click, no focus, hidden from the accessibility tree); Esc fires `cancel`; focus moves into the dialog; `::backdrop` | Scroll lock on `<body>` (dialogs don't lock scroll); enter and exit animation; the dirty guard; focus restoration as a fallback (below) |
| Breakdown and menus on desktop | `popover` attribute (`popover="auto"`) | Light dismiss (click outside, Esc), top layer, one open at a time | Positioning next to the trigger (a small measure-and-place helper; CSS anchor positioning is not yet in every target browser); `aria-expanded` on the trigger |
| Making the rest of the page inert outside dialogs (focus modes, a pending sheet transition) | `inert` attribute | Removes a subtree from focus and the accessibility tree | Setting and clearing it |
| Live updates | `aria-live` regions | Announcements | One polite region (effect, pending and system toasts) and one assertive region (critical toasts, connectivity lost) |

**Browser baseline:** `<dialog>`, `inert` and `popover` are supported in current Chrome, Edge,
Firefox and Safari (desktop and iOS). Target = the last 2 versions of each. Verified in
Phase 2 on real Chrome, Firefox and iOS Safari; if any gap is found, it is recorded and patched
there.

#### Requirements per overlay

| Requirement | Sheet (desktop right) | Bottom sheet (phone) | Drawer (Needs you, Help) | Dialog (confirm) | Breakdown popover |
|---|---|---|---|---|---|
| Opens with | `showModal()` | `showModal()` | `showModal()` | `showModal()` | `showPopover()` |
| Role / name | `dialog`, `aria-labelledby` = title | same | same | `alertdialog` for destructive actions, else `dialog`; `aria-labelledby` + `aria-describedby` (the consequence sentence) | `role="dialog"` (non-modal), `aria-labelledby` |
| Initial focus | First field (`autofocus`); the amount on Add | Same | The heading (`tabindex=-1`) so the list is read from the top | **Cancel** (the safe action) | The popover's heading |
| Tab order | Contained (inert background) | Contained | Contained | Contained | Natural. Tab out closes it |
| Esc | `cancel`: if dirty, `preventDefault()` and show the discard Dialog; else close | Same | Close | Close (= Cancel) | Close |
| Click outside / backdrop | Same as Esc (dirty guard applies) | Same | Close | **Does nothing.** A confirmation needs a deliberate choice | Close (light dismiss) |
| Other ways to close | ✕ button (`aria-label="Close"`) | ✕ button **and** drag the handle down. The handle is also a `<button aria-label="Close">`, so dragging is never the only way | ✕ button | Cancel button | ✕ on a phone |
| Background interaction | None (inert) | None | None (inert) | None | Allowed |
| Focus on close | Back to the element that opened it. Stored on open and restored explicitly, because a deleted row (6.6) may have gone, in which case focus goes to the list heading | Same | Same | Same, or to the next sensible element after a delete | Back to the trigger |
| Scroll | Body locked. The sheet body scrolls; header and footer stay put | Same. Sized with `100dvh` and `visualViewport` so the footer sits above the keyboard | Body locked | Body locked | — |
| Screen reader | Title announced on open. The footer action's loading state is announced ("Saving…") through `aria-busy` + the polite region | Same | The count is announced in the title ("Needs you, 3 items") | Title and consequence announced together | Title + lines read as a list. Figures read as words via `Amount`'s `aria-label` |
| Reduced motion | No slide: instant appear and disappear (opacity only, ≤ 100ms) | Same. Drag-to-close still works but snaps | Same | Same | Same |

**Exit animation with `<dialog>`:** add a `closing` class, wait for `animationend` (or skip
straight to it under reduced motion), then call `close()`. Entry uses a CSS animation on
`[open]`.

#### Page-level requirements (unchanged from Revision 1, restated)

- AA contrast everywhere (checked in Phase 1), AAA on the hero figure.
- Visible focus on every control, never `outline: none`.
- Landmarks: `nav`, `main`, and the dialogs. One `h1` per page.
- Figures: `Amount` already speaks the formatted value. The hero adds context ("You can spend
  four hundred and twelve rupees today").
- Status is never conveyed by colour alone.
- Touch targets are at least 44×44 on a phone.
- Text scales to 200% without horizontal scroll.
- Charts: every chart has its figures table ("Show the figures"), which is the accessible
  equivalent. Tooltips are reachable by keyboard (arrow keys across bars) or skipped in
  favour of the table.
- Route changes move focus to the new page's `h1` and announce the page title.

### 6.9 Dependencies

**None added.** Revision 1's custom focus trap is withdrawn in favour of `<dialog>` and `inert`.

### 6.10 Motion

| Where | Motion | Duration / easing |
|---|---|---|
| Sheet (desktop) | Slide from the right 24px + fade | 260ms, ease-out. Close 200ms |
| Bottom sheet (phone) | Slide up from the bottom. Drag-to-dismiss on the handle | 300ms, ease-out |
| Dialog | Fade + scale from 0.98 | 180ms |
| Drawer | Slide from the right | 260ms |
| Popover / Breakdown / menu | Fade + 4px rise | 150ms |
| Disclosure | Height via `AnimatedCollapse` + chevron rotate | 220ms, ease-in-out |
| Toast | Existing `effect-toast-in` | 220ms |
| Page entrance | Existing `reveal` (8px rise), **first visit to a route per session only** | 260ms |
| Hero figure after a write | Count to the new value (existing `useAnimatedMoney`) | 250ms |
| Button press | scale 0.98 (existing `.pressable`) | 150ms |
| Chart | Bars grow from the baseline **on first render only**, not on hover or refetch | 400ms |

**Never:** bounce, spring, parallax, scroll-triggered reveals, numbers counting up on page
load, confetti. Reduced motion turns all of it into instant changes.

### 6.11 Connectivity: when the server can't be reached

**Found:** `baseQuery` maps a fetch failure to `AppError {code: 'NETWORK_ERROR', status: 0}`.
No store-level reconnect handling was found (`setupListeners` is not called), and there is
no app-level offline state.

**Entering connectivity mode:** two consecutive requests fail with status 0 (one blip is
ignored), or the browser fires `offline`.

**While in connectivity mode:**

| Aspect | Behaviour |
|---|---|
| Banner | Under the page header, `role="status"`, announced once through the assertive region: "Can't reach Kosh's server. The figures below are from 10:42 and may be out of date. Retrying in 8s · **Retry now**" |
| Stale data | **Every figure on screen is marked stale.** The hero loses its accent colour (shown in `--ink-soft`) and gets "as of 10:42" beneath it. Registry Breakdowns still open but carry "as of 10:42". The afford note on Add is hidden: an affordability answer from stale data is a guess. The time shown is the last successful `fulfilledTimeStamp` of that page's main query, never "now" |
| Writes | Save, Settle, Delete, Import and Close are **disabled**, with "Can't save while Kosh can't reach the server. Your entry is still here." An open form keeps its contents. Nothing is queued; offline capture is P3 and needs conflict rules first |
| Retry schedule | Capped exponential backoff with jitter: **2s → 4s → 8s → 16s → 30s**, then every **30s** (±20% jitter) while the tab is visible. **Paused while the tab is hidden.** On `online`, on tab focus, or on "Retry now": retry immediately and reset the schedule. The probe is one lightweight GET (`/me`), never a refetch of every query |
| Leaving the mode | On the first success: refetch the current page's queries (`invalidateTags` for the active page's tags), clear the stale marks **only once fresh data has arrived**, remove the banner, and show a polite "Back online. Figures updated." |
| Server errors (5xx) | Not connectivity mode. The section's error state with Retry. A failed section never shows a cached figure as if current; it shows the error and, if cached data exists, "Last loaded 10:42" next to it |

**Never:** spin forever, retry faster than every 2s, retry in a hidden tab, or show a cached
figure without its time while the server is unreachable.

---

## Part 7 — Desktop and mobile strategy

### 7.1 Breakpoints (Tailwind defaults, so no custom config)

| Name | Width | Layout |
|---|---|---|
| phone | < 768 | Bottom bar + Add button, 1 column, bottom sheets |
| tablet | 768–1023 | Collapsed icon rail (72px) with tooltips, 1 column, side sheets |
| desktop | ≥ 1024 | Full sidebar (232px), page widths per 5.6 |
| wide | ≥ 1440 | Same as desktop, centred. No extra columns (the content widths cap growth) |

### 7.2 Desktop navigation

- **Sidebar, 232px:**
  - Wordmark.
  - **Add** button (context label kept: "Add commitment" on Month, etc.).
  - The 6 destinations, with Today showing the Needs-you badge.
  - Footer: Help, Settings.
- The active item is `--accent-wash` with accent text (kept).
- The sidebar can be collapsed to 72px by the user, remembered in `localStorage`.

### 7.3 Mobile navigation

- **Bottom bar:** Today · Activity · Month · Money · **More**, 56px plus the safe-area inset. The active item shows a filled icon and a label.
- **More** opens a sheet with Goals, Progress, Settings and Help.
  - *Why Goals and Progress go under More:* they are monthly visits.
  - *Why not 4 tabs plus a centre Add:* that drops Money or Activity, both weekly visits.
- **Add button: always visible, always in the same place, always doing the same thing.** (Revision 1 hid it while scrolling; that is withdrawn. The daily action must never have to be found.)
  - **Shape:** an extended pill, **"+ Add"**, with the visible label, 48px tall. It sits bottom right, 16px above the bar and 16px from the edge, plus `env(safe-area-inset-right/bottom)`.
  - **On a phone it always opens Add transaction**, on every page. Page-specific adds ("Add commitment", "Add loan") come from the page's own header button. A button whose meaning changes by page is unpredictable on a phone, where its label is short. Desktop keeps the context-aware sidebar Add; Ctrl/Cmd+K stays as transaction everywhere.
  - **Accessible name:** "Add transaction". It is a real `<button>`, ≥ 48×48, focusable, and in the tab order after `main`.
  - **Never covers content:** every page's scroll container gets bottom padding = bar height + button height + 24px + safe-area inset, so the last row's amount is always reachable.
  - **Hidden only when it can't be used:** while a sheet or dialog is open (it is under the inert backdrop anyway), while the on-screen keyboard is up (`visualViewport` height drops), and in focus modes (onboarding, month close), which have their own primary action.
  - **Connectivity mode:** stays visible. It opens the sheet, which explains that saving waits for the server (6.11).
- **Headers:** the page title scrolls away. On long pages a compact sticky header (title + key action) appears after 64px of scroll.

### 7.4 Tables and forms on a phone

- Every desktop table becomes stacked rows: primary on line 1, secondary on line 2, the figure right-aligned spanning both lines. **No horizontal scroll anywhere** (Progress tables included: the figure tables become row lists).
- Forms are full-height bottom sheets, with the primary action stuck above the keyboard (`visualViewport` aware). Inputs use the right `inputmode` (`decimal` for amounts) and `autocomplete="off"` for money.
- Pickers (Select, date, category) open as bottom sheets with large rows.

### 7.5 Touch interactions

- Tap opens. Long-press on a row opens its `⋯` actions (an alternative to swipe, which is never the only way).
- Swipe left on a Month row reveals the primary action. Swipe on Activity rows is **not** used, because accidental deletes would be costly.
- Bottom sheets: drag the handle down to close. A dirty form asks first.
- Charts: tap a bar to pin its tooltip, tap outside to clear.

### 7.6 Page-by-page adaptation summary

| Page | Desktop | Phone |
|---|---|---|
| Today | 720 column, payment rows on one line | Hero 34px, rows on two lines |
| Needs you | 480 right drawer | Full-height sheet |
| Activity | 880 column, filters inline | Search stuck to the top, filters in a sheet, two-line rows |
| Month | 720 column, row action buttons visible | Compact switcher, swipe + `⋯` for actions |
| Month close | Focus mode, 640 column | Focus mode, action stuck to the bottom |
| Money | 1120, registers as rows | Scrollable tabs, same rows stacked |
| Detail pages | 720, facts in a 2-col statement | Facts in a 2-col grid, primary action stuck to the bottom |
| Goals | 1120 with goals list 720 + right column for Money freeing up (≥1280 only) | One column in the same order |
| Progress | 1120, charts 100% wide | Charts full width, 220px tall, tables as rows |
| Onboarding | Focus, 560 column, preview strip at the bottom | Same, full width |
| Help | Own shell | Topics dropdown, overlay as a sheet |

---

## Part 8 — Feature recommendations

### 8.1 Keep as is

Effect toasts (ADR-0017) · `Amount` and number craft · `Statement` · Real Balance / Room
logic and wording · salary-month switching · Needs-you severity bands and copy ·
commitment add/edit simplification (2026-11-09) · feasibility verdict wording · Recharts
choices and the `--viz` palette · the help manual's content · Ctrl+K · the context-aware Add
label.

### 8.2 Keep but redesign

Today (4.1) · Month (4.5) · Activity (4.4) · Money Overview (4.7) · detail pages (4.8) ·
Goals (4.9) · Progress (4.10) · Onboarding (4.11) · Month close (4.6) · all sheets (Sheet
component) · Import (4.4a).

### 8.3 Simplify

Page headers (no eyebrows) · help (one layer) · Activity filters (behind a button) · Standing
(folded) · Progress tiles (removed as a grid) · debit cards (folded).

### 8.4 Consolidate

Needs-you page → panel · instance and rule pages → one template · Money Overview → summary
rows · briefing tabs → "About this month" · `Modal` → Sheet + Dialog.

### 8.5 Remove

`PagePrimer` ×7 · `*GuideSheet` ×7 · 4 unused components · eyebrow micro labels · Today's
"Also worth a look" block · the 6-tile grid on Summary.

### 8.6 New, all on the existing backend

| Feature | User problem | Complexity | Priority |
|---|---|---|---|
| Responsive shell (bottom bar, Add button, tablet rail) | Can't use Kosh on a phone at all | M | P0 |
| Breakdown sheet | Simpler screens must not lose proof | M | P0 |
| Sheet + Dialog on native `<dialog>` + dirty guard | Lost half-typed entries; inaccessible modals | M | P0 |
| App connectivity banner | A dead backend looks like wrong numbers | S | P0 |
| Pending-delete with undo (6.6) | A mistaken delete is permanent | M | P1 |
| Settings page (name, appearance, read-only pay day) | `/me` exists with no UI; no theme control | S | P1 |
| NotFound route | A wrong URL shows a blank page | S | P1 |
| Remembered defaults on Add (last account and category) | Re-picking the same account every time | S | P1 |
| Route skeleton fallbacks | Blank flash between pages | S | P1 |
| Keyboard go-to shortcuts | Speed for daily desktop users | S | P3 |
| Offline capture queue | Recording in a dead zone | L | P3 (deliberately later: needs conflict rules) |

### 8.7 Backend limits and the frontend alternative chosen

| Wanted | What's missing | Alternative in this plan |
|---|---|---|
| Undo a transaction delete | No restore endpoint | Pending window before the request is sent; no undo after the server confirms (6.6) |
| Does a transaction pay a commitment? (for the delete warning) | Unconfirmed whether `TransactionResponse` exposes the link | Specific warning if it does; a generic warning if it doesn't (6.6 rule 7) |
| "Which entries paid this commitment?" list (USAGE U2/M3) | The payments table isn't exposed in the instance response (only the latest link) | Show "Settled by" (the latest) plus the confirmed total, and a line: "Earlier part-payments are included in the total." **Backend field recommended for later** |
| Session expiry / login | No auth | Not designed now. `baseQuery` gets a 401 branch that shows a full-page "Signed out" state, ready for when auth lands |
| Push or email reminders | None | In-app insights only (6.5) |
| Per-account cash plan (USAGE M6) | Not modelled | Not in this revamp. Today keeps the dated-shortfall rows |
| RD maturity date | `matures_on` is deferred schema | The note stays the source; the investment row shows "withdrawable Jan 2029" only from the note when present |
| Editing pay day safely | Product decision open | Read-only in Settings |
| Breakdown for every figure | Only some responses carry their parts (provenance on runway and debt; component fields on position, net worth, plan progress) | Three figure classes and a verified registry (6.4). Unexplained figures are plain and never get a browser-made proof |

---

## Part 9 — Implementation roadmap

Each phase is one or more feature-branch slices: plan → build → `tsc` + `vite build` →
headless click-check (writes blocked) → docs → rewrite `CONTINUE_HERE` → stop. **The user
commits.** Every screen is rebuilt against live data; nothing is mocked.

| # | Phase | Pages / components | Outcome | Depends on | Technical notes | Risk | Priority |
|---|---|---|---|---|---|---|---|
| 1 | **Tokens & type v3** | `index.css`, `Amount`, `SectionHeader`, `Card`, `Button` | New palette (contrast-checked), 3 weights, section-title style, dark tokens, `[data-theme]` | — | One file for tokens. Component APIs stay stable, so every page restyles at once | Low (visual churn everywhere; review screenshots per page) | **P0** |
| 1b | **Sleek pass** (§5.8) — *built 2026-11-09; awaiting the user's K8 eyeball* | `index.css` (hairline, type scale, control sizes under `pointer: coarse`, radius, shadows, scrollbars), `Button`, `Select`, inputs in every form, `Statement`, `SectionHeader`, `Card`, `NavRail`, `Sheet`/`Dialog`/`Breakdown`, `Amount` hero, icon strokes app-wide, uppercase eyebrows | The whole app reads fine and premium: thin lines, light large figures, compact controls, thin scrollbars | 1, 2, 3 (restyles their output) | Mostly token and shared-component changes; then a sweep of `h-11`, `border-ink`, `shadow-lg`, `font-medium`, `strokeWidth`, `text-micro uppercase`. Do not change any figure, wording or behaviour | Low–medium (visual churn everywhere; K1–K8) | **P0** |
| 2 | **Overlay primitives** | `Sheet`, `Dialog`, `Drawer` on native `<dialog>`; `Popover` on `popover`; dirty guard; `Breakdown` + registry B1–B5 checked against the backend | `Modal` retired; every form moves to Sheet | 1 | Swap `Modal` for `Sheet` behind the same props first (mechanical), then add the dirty guard per form via RHF `isDirty`. Check browser support on real Chrome, Firefox and iOS Safari | Medium (touches ~20 sheets) | **P0** |
| 3 | **Responsive shell** | `AppShell`, `NavRail` → `Sidebar` + `BottomBar` + `AddFab` + `MoreSheet`, `PageHeader`, route skeletons, NotFound, connectivity mode (6.11) | Kosh is usable on a phone; stale data is always marked | 1, 2 | `matchMedia` hook. Safe-area insets. Gutters per breakpoint. A reachability probe with capped backoff | Medium | **P0** |
| 4 | **Help consolidation** *(built 2026-11-09)* | Remove primers and guide sheets; `PageHeader` `?` → overlay topic | One help layer | 3 | Check each guide sheet's content exists in `help/content/*` before deleting; move it there if not | Low | **P0** |
| 5 | **Today + Needs-you panel** *(built 2026-11-09)* | 4.1, 4.2 | The daily answer in two seconds on a phone | 2, 3 | Standing closed by default: confirm with the user | Low | **P1** |
| 6 | **Add transaction** *(built 2026-11-09)* | 4.3 | Capture in under 5 seconds on a phone | 2, 3 | Remembered defaults; Save & add another | Low | **P1** |
| 7 | **Month** *(built 2026-11-09)* | 4.5, 4.13, 4.15 | Worklist first, context folded | 2, 3 | Split the 651-line `PlanZone` into `PlanList`, `PlanRow`, `PlanGroup` | Medium | **P1** |
| 8 | **Activity** *(built 2026-11-10; Import + Categories restyle deferred to Phase 15)* | 4.4, 4.4a, 4.4b, pending-delete flow (6.6) | Clean daily record; no premature "deleted" | 2, 3 | Filters in the URL. `pendingDeletes` + listener middleware. Check whether `TransactionResponse` exposes a commitment link | Medium | **P1** |
| 9 | **Detail template** *(built 2026-11-10)* | `DetailPage` + 5 pages (4.8) | One learnable pattern | 2 | Do Account first, then Loan (largest), then the rest | Medium | **P1** |
| 10 | **Money** *(built 2026-11-10)* | 4.7a–d | Overview as summary, tabs as detail | 9 | "Debts" tab label → "Loans" | Low | **P1** |
| 11 | **Goals** *(built 2026-11-10)* | 4.9 | Goals first, tools folded | 2 | — | Low | **P2** |
| 12 | **Progress** *(built 2026-11-10, still labelled "Summary")* | 4.10 | Four questions, one chart each | 1 | Thin-data copy | Low | **P2** |
| 13 | **Onboarding + Month close** *(UI built 2026-11-10; the close itself stays gated by G1)* | 4.11, 4.6 | Focus modes, live preview strip | 3; **release gate G1** (Part 11) for the close flow | The UI can be built and merged; the **first real close** waits for G1 whatever the UI state | Low for the UI; the close itself is gated | **P2** |
| 14 | **Settings** *(built 2026-11-10)* | 4.17 | Name, appearance, pay day shown | 1 | Pay-day edit stays off until decided | Low | **P2** |
| 15 | **Polish & audit** *(built 2026-11-10)* | All | Contrast, keyboard, 200% text, reduced motion, phone pass at 360/390/430px, performance on a throttled CPU | All | Lighthouse a11y ≥ 95 as the target; check bundle per route | Low | **P2** |
| 16 | **Later** | Keyboard go-to, offline queue | Speed and resilience | — | — | — | **P3** |

**Order rationale:** 1–4 (with 1b) are foundations every page reuses. Doing pages before them means
redoing pages. 5–6 are the daily loop. 7–10 are weekly. 11–14 are monthly.

**Performance notes:**
- Routes are already lazy.
- Recharts loads only on Progress and Goals (already route-split; keep it out of shared chunks).
- Fonts: Inter is 3 static weights, so Latin-only subsets are worth checking (@fontsource exposes them).
- Avoid re-rendering whole pages on toasts by keeping toast state in `uiSlice` (it already is).
- Test on a 4× CPU throttle in Chrome DevTools.

---

## Part 10 — The finished experience

**A new user** opens Kosh on their phone. Five short steps ask for their pay day, their
salary, their accounts, their commitments and anything set aside. A strip at the bottom
grows with each step: *held − promised = free*. They land on Today: one figure, "₹412 you
can spend today", and a line saying how that was worked out. Nothing else shouts. The
language never assumes they know what a "cycle" or a "liability" is.

**A regular user** checks in once or twice a day. Today answers in two seconds. The Add
button sits under their thumb. They type ₹180, pick "Food" (already suggested), and save.
The figure counts down to ₹232 and a quiet note confirms it. Once a week they open Month,
tick off two commitments, and see "9 of 14 done, ₹18,240 still to pay". The badge on Today
appears only when something genuinely needs them, so they trust it when it does.

**A detail-minded user** taps any figure and gets the accountant's view: the formula, every
line signed and aligned, each one a link to its record, caveats spelled out, unknowns marked
`—` rather than guessed. On desktop they keep Activity open with filters in the URL, read a
loan's full schedule, compare months on Progress with the figure tables open, and model a
lump sum on Goals. The detail is all there, and the simple layer stays simple for everyone
else.

**What it should feel like:** calm, precise and on your side. A finance app that says *what you
can do*, shows its working when asked, and never makes you feel judged for an ordinary month.

---

## Part 11 — Existing product defects and release blockers (not redesign work)

**This revamp changes presentation only.** It does not fix, and must not be described as
fixing, any calculation, stored value or backend behaviour. Accepting a phase (Part 12) means
"the screen shows the server's figures correctly and behaves as specified". It does **not**
mean the figures are right. Those are separate tracks with their own owners.

Backend changes are outside this plan. The schema freeze stays: no migrations, no SQL, no
tests (CLAUDE.md #3). A backend **code** fix to any item below is its own `bug/<name>`
branch, approved by the user separately.

### 11.1 Release gate G1: the first real month close

| | |
|---|---|
| **Risk** | `close` writes `CycleSnapshot`, which is **immutable by design** (ADR-0011). A wrong figure written at the first close is wrong permanently. No UI can repair it |
| **Defect** | `FIX_BACKLOG` **1.15**: `PlanAdherence` counted income occurrences as commitments, so the salary and the Diwali bonus inflated "commitments kept" and the planned total |
| **Status (Found)** | **Fixed in code on 2026-11-07**, before any cycle was closed (`PlanAdherence.billsOnly` is the only path; `close` passes the commitments). **No runtime verification is recorded** |
| **Gate (all three required before the first real close)** | **(a)** The running backend includes the fix. The user restarts it from IntelliJ and confirms the build is from 2026-11-07 or later. **(b)** A read-only `GET /review/months` (and `/cycles/{id}/review` for the ended 28 Sep – 27 Oct cycle) shows commitments kept and planned **without** income occurrences: the salary is not counted, and ₹57,700 is not in the planned total. **(c)** The user explicitly approves the close, because it is a real-data write |
| **If any part fails** | The close stays blocked. The fix is backend work on a separate branch. The redesigned close UI may still ship, but **the close action is not used**, and the Month page shows no "Close this month" prompt until G1 passes (a frontend flag, defaulting to off) |
| **Owner** | Verification: Claude (read-only checks) + the user (restart, approval) |

### 11.2 Known defects the UI exposes but does not fix

| # | Defect | Source | What the UI does |
|---|---|---|---|
| D1 | A part-paid commitment can't list *which* entries paid it. The payments table isn't in the instance response | `USAGE_ISSUES` U2 / M3 | Shows the latest "Settled by" plus the confirmed total, with "Earlier part-payments are included in the total". A backend field is recommended for later |
| D2 | No cap on over-settling a commitment | `USAGE_ISSUES` M2 (checked 2026-10-02: none over-settled) | Nothing hidden. The 4.15 copy fix stops the Settle sheet *recommending* a double link. The cap itself is backend |
| D3 | Whether a dismissed CRITICAL insight returns when it worsens | Server behaviour, unconfirmed | The row-level marker stays while the condition is true (6.5), so it is never invisible |
| D4 | Deferred schema: ROADMAP 4.1 / 5.2 / 6.1, `matures_on` | `CONTINUE_HERE` DEFERRED SCHEMA | Out of scope. No UI promises these |
| D5 | A Breakdown whose server lines don't add up to the server total | Would be found in Phase 2 / 5 / 7 / 10 registry checks | Shown as sent, with the caveat. Logged to `FIX_BACKLOG`. Never patched in the browser |
| D6 | Entries recorded without linking to the commitment they pay | `USAGE_ISSUES` U1 | The Add sheet suggests the link (4.3). Detecting orphans is backend (M5) |

### 11.3 Release blockers for the revamp itself

| # | Blocker | Applies to |
|---|---|---|
| R1 | Phases 1–4 accepted (Part 12) before any page phase is merged to `uat-release`. Every page depends on them | All page phases |
| R2 | Contrast check passes for every token pair in light and dark (5.3) | Phase 1, then every phase |
| R3 | **Figure parity:** for each redesigned page, every figure shown matches the same API response field, captured read-only before and after. Formatting may change; values may not | Every page phase |
| R4 | No new console errors, and no failed requests on load (read-only check) | Every phase |
| R5 | The user has run the write scenarios marked **U** in Part 12 for that phase | Every phase that writes |
| G1 | 11.1 | The first real close, not the merge |

**Merge flow reminder (the user runs git):** `feature/complete-ui-ux-revamp` → `uat-release`
→ `main`. Each phase is committed separately so a phase can be reverted on its own.

---

## Part 12 — Manual acceptance checklist

**A build is not acceptance.** A phase is done only when its scenarios pass. **C** = run by
Claude: read-only API calls, or headless Chrome with writes blocked in the page.
**U** = run by the user, because it writes real data (CLAUDE.md #5), or against a dev
database if one is provided. Record each result (pass / fail + note) in `CONTINUE_HERE`
when closing a phase.

### 12.1 Run for every phase (global)

| # | Scenario | Expected | Who |
|---|---|---|---|
| A1 | Viewports 360, 390, 430, 768, 1024, 1440px | No horizontal scroll. Nothing overlaps. The Add button never covers the last row | C |
| A2 | Light, dark, and forced light/dark via Settings (from Phase 14) | Tokens only. No unreadable text | C |
| A3 | Keyboard only: reach every control, open and close every overlay | Visible focus. Esc behaves per 6.8. Focus returns to the opener | C |
| A4 | Screen-reader pass (NVDA on Windows) on the phase's pages | Page title announced on navigation. Dialog titles announced. Figures read as amounts | U (C can check roles and labels in the DOM) |
| A5 | `prefers-reduced-motion: reduce` | No slides, counts or shimmer. Content is never hidden behind a delay | C |
| A6 | Browser zoom 200% | No content lost, no horizontal scroll | C |
| A7 | Figure parity (R3) | Values on screen = API fields | C |
| A8 | Real Chrome, Firefox, Edge; iOS Safari (phone) | Overlays, popovers and inert behave the same | U for iOS, C for desktop Chrome |

### 12.2 Phase-specific scenarios

| Area / phase | # | Scenario | Expected | Who |
|---|---|---|---|---|
| **Tokens (1)** | T1 | Compare every page before and after at 1440 and 390 | Only styling changed. No figure, label or action is missing | C |
| **Overlays (2)** | O1 | Open every sheet; type; press Esc; click the backdrop; press ✕ | The discard dialog appears each time when dirty, never when clean | C |
| | O2 | In a dialog, Tab 30 times | Focus never leaves the dialog | C |
| | O3 | Open a Breakdown for each registry entry B1–B5 | Lines and total are exactly the server's. Incomplete figures show "Not counted yet" | C |
| | O4 | A figure **not** in the registry | Not underlined, not clickable | C |
| **Shell (3)** | S1 | Each of the 6 destinations + More on a phone | The bar highlights the right item. Detail pages keep their section lit | C |
| | S2 | **Network failure:** set the browser offline (DevTools / CDP) on Today | Banner appears after the second failure. The hero turns stale with "as of HH:MM". Save is disabled with the explanation. The form keeps what was typed | C |
| | S3 | Stay offline for 2 minutes and watch the requests | Retries at about 2, 4, 8, 16, 30, 30… seconds. None while the tab is hidden | C |
| | S4 | Go back online | One probe succeeds, page queries refetch, the stale marks clear only after fresh data, "Back online" | C |
| | S5 | Unknown URL | NotFound page inside the shell | C |
| **Help (4)** | H1 | `?` on each page | Opens the overlay at that page's topic. No primer or guide sheet remains | C |
| **Today (5)** | D1 | Hero = `roomToday`; derivation = `realBalance` and `daysToSalary`; salary date and day count match `/financial-state.cycle` | Exact match | C |
| | D2 | **Incomplete data:** a commitment without an amount exists (or is found in the data) | The hero shows the server's incomplete form plus the chip, and "needs a number" links to it | C (read-only, if such data exists; else U) |
| | D3 | Needs-you badge vs `attentionCount`; INFO-only shows no badge | Matches 6.5 | C |
| | D4 | Dismiss, snooze 1 day, restore an ATTENTION item | It moves to Answered and back. A CRITICAL item keeps its row marker after "I know" | U |
| **Add (6)** | N1 | **Create:** add a ₹180 expense on a phone, end to end | Under 5s for a repeat category. The hero counts down by the server's new value. Effect toast | U |
| | N2 | Double-tap Save; press Enter twice | One transaction is created | U (C with writes blocked: one request attempted) |
| | N3 | Type, then close the sheet | The discard dialog appears. "Keep editing" keeps the values | C |
| | N4 | Server field error (e.g. missing category on Received) | The error shows under the field with the server's `fix` | U (only a real request produces a real server error) |
| **Month (7)** | M1 | **Salary-cycle switching:** previous, next, "back to this month"; open `?cycle=` directly; refresh | The label shows real dates. Past / current / upcoming modes per 4.5. Refresh keeps the month | C |
| | M2 | Month boundary: the cycle containing the 27th and the 28th | The 27th belongs to the ending month, the 28th to the new one. The label and list agree with `/cycles` | C |
| | M3 | **Commitment settlement:** record a payment from a different account than planned | The status follows the server (U3: no "Needs review"). "Paid from" shows the actual account | U |
| | M4 | Settle a part-paid commitment | The "link that entry instead" advice is not shown (4.15) | U |
| | M5 | Add an amount to a commitment without one | The Month answer and Today's hero update from the server | U |
| **Activity (8)** | L1 | **Edit:** change amount, category and date of an entry | The list, day subtotal and hero refresh from the server | U |
| | L2 | **Delete:** delete, wait 6s | Pending look → "Deleting…" → "Entry deleted" only after the 2xx. Totals change only after the refetch | U |
| | L3 | **Undo:** delete, then Undo within 6s | No DELETE is sent (check the network log). The row is restored. Focus returns | U (C: blocked-write log shows no request) |
| | L4 | Delete twice quickly; delete the same entry from its account page | One request only | C (writes blocked: one attempt logged) |
| | L5 | Delete, then navigate to Today inside 6s | The delete completes once. The toast follows. No duplicate | U |
| | L6 | Delete, then reload inside 6s | The browser's leave prompt appears. If you leave, the entry is still there on return | U |
| | L7 | Delete fails (server stopped by the user, or offline) | The entry is kept. "Couldn't delete…" with Retry. Never "deleted" | C (offline) |
| | L8 | Delete an entry that pays a commitment | The confirm dialog names the consequence before the pending window | U |
| | L9 | Filters + search, refresh, Back | Kept in the URL. "No entries match" with Clear filters | C |
| | L10 | **Statement import:** a valid CSV for an account | Rows reviewed. Duplicates unticked with a reason. "Import N entries" creates exactly N | U |
| | L11 | Import a malformed CSV | A plain error naming the problem. Nothing created | U (upload is a write) |
| **Details (9)** | P1 | **Loan calculations:** for each loan, compare outstanding, EMI, EMIs left, rate, debt-free date and every schedule row with `/loans/{id}` and `/schedule` | Exact match. Estimated terms show the *estimated* chip | C |
| | P2 | Archive, then Undo (unarchive) an account | The server confirms both. The toast offers Undo only after confirmation | U |
| | P3 | Open a missing or other-user id | "We couldn't find this…" (404 page), not a crash | C |
| **Money (10)** | Y1 | Net worth and the register totals vs `/net-worth`, `/loans/summary`, `/investments/summary`, `/insurance-policies/summary` | Exact match. Approximate marker where confidence is low | C |
| **Goals (11)** | G1x | Goal verdicts vs `/goals/feasibility`; unlock options vs `/decisions/unlock-options` | Server strings and values shown as sent | C |
| **Progress (12)** | R1x | Each chart's tooltip and figures table vs `/review/*` | Server values. Thin-data copy with < 3 months | C |
| **Onboarding / close (13)** | B1x | Onboarding on an empty account (dev database only) | The preview strip equals `/position` at each step | U (dev DB) |
| | B2x | Close flow on the ended month | **Blocked until G1.** The UI path is checked up to the final step with writes blocked | C |
| **Settings (14)** | Z1 | Change display name; switch theme | The name is saved via `PATCH /me`. The theme persists per browser | U (name) / C (theme) |
| **Mobile (15)** | Q1 | On a real phone: Add, record a payment, filter Activity, open a Breakdown, use Needs you | All done one-handed. Nothing hidden behind the keyboard or the Add button. Safe areas respected | U |

---

## Appendix A — Unresolved user decisions (asked one at a time, in chat)

| # | Decision | Section | Plan's default if unanswered |
|---|---|---|---|
| 1 | Is **Kosh** the final product name? | §0.3 | Kosh everywhere, behind one constant |
| 2 | Rename **Ledger → Activity** and **Summary → Progress**? | 3.1 | Keep the current labels |
| 3 | Today's **Standing closed by default**, reversing the earlier "open by default"? | 4.1 | Closed (follows detail on demand) |
| 4 | Money tab **Debts → Loans**? | 4.7 | Keep "Debts" |
| 5 | Pay day **read-only in Settings** until a safe change process exists? | 4.17 | Read-only |
| 6 | Approve running the **G1 checks** and, after them, the first real close | 11.1 | Close stays blocked |

## Appendix B — Files this plan expects to touch (for scoping, not a commitment)

`src/index.css` · `components/*` (new: `Sheet`, `Dialog`, `Drawer`, `Popover`, `Breakdown`,
`PageHeader`, `DetailPage`, `BottomBar`, `AddFab`, `MoreSheet`, `ConnectivityBanner`,
`Disclosure`; retired: `Modal`, `PagePrimer`) · every `routes/*.tsx` · `features/*/components/*GuideSheet.tsx`
and `*Primer.tsx` (deleted) · `features/month/components/PlanZone.tsx` (split) ·
`store/slices/uiSlice.ts` (undo queue, theme) · `App.tsx` (NotFound, Settings route, Suspense
fallbacks). **No backend file.**
