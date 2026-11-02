# Continue here (rewritten 2026-10-24)

**This top block — down to the `---` — is the whole handoff contract. A session started
with the single word "continue" must be able to act on it with no other input.** Everything
below the rule is the record of how we got here: read it when you need the reasoning, not
before you start.

Read next: `FINANCIAL_OS.md` (what we're building), `ROADMAP.md` (what's next and why),
`SESSION_HANDOFF.md` (how to work with the user), `DOC_INDEX.md` (which docs are true).
Everything else under `docs/` is history unless `DOC_INDEX.md` lists it as living.

---

## HOW TO TALK TO THE USER — read this before writing a reply

**Short, plain, direct. Say the thing, then stop.** The user asked for this twice in one
sentence on 2026-09-25 ("tell me simply", "let's keep it simple and quick"), after a reply
that buried a one-word decision under three tables.

- **One question at a time**, in a sentence. Not a menu, not a comparison table.
- Don't restate the plan, the handoff, or anything they already know.
- Long structured write-ups belong **here**, in the docs — not in chat. That is what this
  file is for.
- If they ask "what do you want from me", the answer is one line.

This changes how much gets *printed*, never how much gets verified.

---

## NEXT ACTION

On branch **`feature/month-summary`**, off `uat-release`. Two pieces of finished work sit
uncommitted: **Summary** (2026-10-24) and the **Today rebuild** (2026-11-01). Both are
verified against real data in a headless browser, not merely compiled.

### 1. Nothing is half-done. Two things need committing

**Today, rebuilt 2026-11-01** on the user's own words: *"whatever is there on today page I
dont like it how its aligned and everything ... what numbers its showing how it came nothing
is making sense for me right now ... how much I am able to spend for today that should be
there along with little relevant information. revamp it please"*. Full write-up below under
*2026-11-01*.

**Summary, built 2026-10-24** on *"monthly summary section below Goals in left vertical ...
via charts graphs etc"*. Five sections at `/summary`, a sixth rail entry under Goals. Full
write-up below under *2026-10-24*.

Frontend only, both of them. `npx tsc -b --noEmit && npx vite build` clean; no backend
change, so nothing new is waiting on DDL.

### 2. New: `webapp/mcp-server/` - Kosh's data, read-only, over MCP

Built 2026-11-01 on the user's instruction: *"I want to begin new session in claude code via
app, and give it access of data what our kosh has so that in the session I can ask claude to
act as my personal CA"*. On the current branch, at their direction.

- **`server.mjs`** - one file, zero dependencies, MCP over stdio (Node 22's `fetch` plus
  newline-delimited JSON-RPC). 16 tools, each one GET.
- **Read-only is structural.** `call()` is the only function that touches the network and
  takes no HTTP method, so there is no code path that can POST, PATCH or DELETE. A session
  cannot write because no tool *can*. `lastFour` is stripped from every account on the way
  out; names are not, since an answer has to be able to say "IDBI Saving".
- **`CA_BRIEF.md`** - the role, the reading rules that are easy to get wrong (the 28-27
  salary month against the 1 Apr - 31 Mar financial year; transfers are not spending; null
  is never zero), and the part that decides whether a tax answer is possible at all:
  **what Kosh does not know** - gross salary, TDS, EPF, HRA, rent, regime choice. The brief
  tells the session to ask for a payslip or Form 16 rather than compute from take-home.
  What it *can* do from Kosh alone: **80E** (education loan interest, via
  `kosh_loan_schedule` on loan 2 - `interestComponent` per row) and **80D** (health premium,
  with the parent-policy limit noted as separate).
- **Registered in both clients.** Claude Code reads `.mcp.json` at `G:\FinanceOS\`; Claude
  Desktop reads `%LOCALAPPDATA%\Claude-Data\<account>\claude_desktop_config.json` - the newer
  per-account layout, **not** the `%APPDATA%\Claude\` path the guides still give, and it had
  no `mcpServers` key at all. Desktop's entry uses the **absolute path to `node.exe`**: the app
  spawns servers without a login shell's `PATH`. The previous config was backed up beside it as
  `claude_desktop_config.backup-2026-11-01.json`.
- **The brief reaches a Desktop chat through MCP**, since a chat there cannot open a file: as a
  *prompt* (`personal_ca`, listed under "+") and as the `kosh_ca_brief` *tool*, read from disk
  per call so edits need no restart.
- **`.mcp.json` lives at `G:\FinanceOS\`** - outside the repo, which is not a git work tree
  at that level, so machine-local config stays untracked while the server itself is
  versioned.

**Verified** against the running backend: handshake, `tools/list` (16), live calls to
accounts / loans / spending summary / loan schedule, `lastFour` absent from the payload,
unknown-tool error, and the backend-down path returning a sentence that names the fix. One
real bug found and fixed in the process: exiting on stdin close dropped in-flight requests,
so the server now drains before exiting.

### 3. What the Today rebuild did **not** fix, deliberately

- **`FIX_BACKLOG` 1.17 - "Free this month" leads with an income figure the user will not
  recognise.** The note reads *"₹1,05,733 in"*: salary ₹57,700 + Diwali bonus ₹46,000 + a
  ₹1,736 withdrawal from an NJE-wealth SIP + ₹297 recorded as "Unexplained part of the
  credit". A SIP withdrawal is a transfer between two things the user already owns and is
  **not income**. The arithmetic is right; the input is not. Contained for now inside Today's
  collapsed *Standing* section - but it is the **lead figure on Months**, where it is
  prominent and unexplained. Needs a decision: is the transaction miscategorised, or should
  the shape calculator exclude income whose counterparty is the user's own holding?
- **A second shortfall account would keep its card.** `useDatedWarnings` fetches one
  projection, for the first shortfall account, and anchors that warning to the exact payment
  that breaks it. Hooks cannot be called in a loop; a second shortfall still shows in full in
  Needs you, just not inline. Nothing is lost, only the placement.

### 4. Defects still open from Summary, neither fixed

- **`FIX_BACKLOG` 1.15 - `PlanAdherence` counts income as a commitment.** The October cycle
  read "16 of 17 kept" with a planned cost of ₹1,24,722 against ₹59,200 of income, because the
  salary and the Diwali bonus are occurrences like any other. Summary filters them out for
  itself; `CycleServiceImpl.close` still writes the inflated figures into `CycleSnapshot`,
  which is immutable. **No cycle has been closed yet, so there is nothing to restate - that
  window shuts the first time a month is closed.** This is the one item with a deadline.
- **`FIX_BACKLOG` 1.16 - `formatPercent` prints a hyphen, not a true minus.** One line, six
  existing call sites, so not slipped into an unrelated change.

### 5. Open decisions - the user has not answered these; do not pick for them

- **May a closed cycle's figures change?** The only thing blocking `FIX_BACKLOG` **1.11**.
  `CommitmentBucketClassifier` reads the *planned* source, so an account's spendability checkbox
  silently restates a month's shape - and it is shared with `CycleReview`, which **recomputes
  live rather than reading `CycleSnapshot`**. If the answer is "no", `CycleReview` needs the
  snapshot before the classifier can move. *Note: ₹27,500 is **arithmetically correct** - see the
  correction in 1.11. The defect is that it moved retroactively, not that it is wrong.*
- **Commitment 43** (₹30,000 EF top-up, 3 Nov) - **the user said "let it be" on 2026-10-03.**
  Parked, not pending. Do not raise it again unprompted.

*(The old "green on a positive Free this month" question is closed: that row left Today's
hierarchy on 2026-11-01 and now sits inside Standing, where a colour would say nothing.)*

### 6. Real money: IDBI is short on **5 Nov** - and Today now says so on the row

Checked 2026-11-01 against live data. `GET /accounts/4/projection`: IDBI Saving holds ₹4,389
and is projected to **-₹10,111** by the cycle's end. It covers the Education loan EMI on 5 Nov
(leaving ₹972) and then **cannot cover the Coding Ninjas EMI** the same day. ₹10,111 needs to
move in by 5 Nov; ₹44,151 is sitting in HDFC Salary.

This is the **same shape** as the 8 Oct warning raised on 2026-10-03 - the money lives in the
wrong account each month. The warning is now attached to the payment it breaks in *Before
payday*, with its own **Move money** button, rather than sitting in a card beside it.

### 7. If they say "carry on": the solutions pass, `USAGE_ISSUES` section "Solutions pass"

Six proposals, none approved. **M3 is the one to build** - show the payment list on a bill's
detail page. It is the only item that hands the user the evidence instead of Claude fixing
something on their behalf, and *"which entries made up this ₹10,500?"* has been answerable in
the data since V23 and visible nowhere. **M2** (refuse an over-settle - the calculator still has
no cap) is smaller and closes a live rule-4 hole.

### Owed to Summary, small and deliberate

- **No Help topic and no primer.** Every other screen has one; this has a takeaway sentence per
  section and a plain-language footnote under each table instead, because it is a report with no
  form to get wrong. If a Help topic is written, `SummaryPage` has nowhere to hang a guide sheet
  yet.
- **`Statement notes` collapses below ~900px** - its label column squeezes to nothing while the
  22rem notes column holds its width. Pre-existing, affects Money; Today's own statements use
  the two-column form and are unaffected. Related to `FIX_BACKLOG` 4.8 (the rail never
  collapses).

### Where a problem found in real use goes

**`product/USAGE_ISSUES.md`** — the product behaved correctly and the experience was still wrong.
`FIX_BACKLOG` is defects and missing capability. Cross-reference, never copy. **Do not fix
`USAGE_ISSUES` entries piecemeal** — they are solved in one considered pass, at the user's own
instruction.

---

## 2026-11-01 - Today rebuilt around the day's own figure

**Asked for:** *"whatever is there on today page I dont like it how its aligned and everything.
Everything above needs you and coming up needs revamping what numbers its showing how it came
nothing is making sense for me right now. on todays page, how much I am able to spend for today
that should be there along with little relevant information. revamp it please"*. Built on the
current branch at the user's instruction (*"build on current branch only"*).

### What was actually wrong - four structural faults, not cosmetics

Diagnosed against live data (2026-11-01, cycle 28 Oct - 27 Nov) in a headless browser:

1. **The page answered a different question from its own title.** The hero was Real Balance,
   ₹3,650 - a 27-day figure. The day's own number, ₹135, was row one of a seven-row table in
   caption type.
2. **Nothing aligned.** The hero sat at the left margin; seven figures right-aligned ~850px
   away. The eye zig-zagged, and a 1440px window left the right half of the hero block empty
   while the bottom third of a 2400px page was blank.
3. **Two figures both called "free", 3.5x apart, five rows apart.** *Free until salary*
   ₹3,650 and *Free this month* ₹12,842. Both correct; they measure different things, which
   is precisely why they could not sit unexplained beside each other.
4. **The loudest number was the least actionable.** Net worth -₹2,02,316 in red was the
   strongest thing on screen, on a page whose question is "can I spend?".

### What was built

- **`SpendToday`** replaces `Pulse`. Hero is **`roomLeft`** - the day's share less what has
  already gone today - not `realBalance` and not `perDay`. Under it, the derivation **on the
  page**: *Free until salary ₹3,650 / 27 days to Sat 28 Nov = ₹135 a day*, three ruled rows
  with dotted leaders. `PositionStatement` stays behind "How is ₹3,650 worked out?" as the
  next level down.
- **`BeforePayday`** replaces `ComingUpList`. The window is the **cycle**, not 30 days: it runs
  to the salary row and stops, salary last, in positive ink. Dates are **group headers**, so
  the rows carry only what differs - and names are no longer truncated. Was 3 of 16 rows; is
  now all 14 to payday.
- **Shortfall warnings attach to the payment they break.** `useDatedWarnings` reads
  `/accounts/{id}/projection` and matches the first `covered: false` deduction's
  `commitmentInstanceId` to the timeline row's `sourceId` - the same payment `ShortfallRule`
  named. **Account + date is not enough** and the first attempt got it wrong on real data:
  three IDBI bills fall on 5 Nov and the account covers the first two. The warning carries its
  own **Move money** button and is suppressed from Needs you (`InsightList hideKeys`), so it
  is said once.
- **`StandingPanel`** - *Free this month*, *You usually spend*, *If income stopped*, *Owed*,
  *Net worth* - collapsed at the foot of the page. **Folded, not deleted:** "If income
  stopped" exists nowhere else in the product, and Owed and runway keep their `BasisPanel`
  derivations.
- **Layout, settled on the second pass.** The rebuild first went to one column at a 44rem
  measure. The user's verdict: *"two column view below the consolidated summary was actually
  nice ... unnecessary white space is left towards right"* - correct on both counts, and the
  fix was to adopt the house idiom rather than invent one. `MonthOverview` already splits a
  block with `lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]` and a `lg:border-l` divider, and
  the shell is a 1120px container (`--width-content`). Today now follows it:
  - **Summary band, full width**, divided: the day's figure left, the derivation right.
  - **Two columns below** at `xl`: *Before payday* in the 1fr track (four facts per row and
    the longest list), the rail at 26rem.
  - **The rail holds Needs you *and* Standing** - everything that is not the payment
    timeline. Standing moved out of the page foot because the rail otherwise ran empty for
    most of its height beside a fourteen-row list.
  - **`PositionStatement` opens full width, below the band**, never inside the 28rem column
    that holds its trigger: it renders `Statement notes`, whose third column is a fixed
    22rem, and in a narrow track every row wraps one word per line.
  - Checked at 1440 / 1280 / 1100 / 900px: no overflow, two columns above `xl` (1280),
    stacked below it in reading order.
- **`DayStatus` fills the space under the figure** (third pass, same session). The hero left
  most of a 600px column empty next to the first thing the eye lands on. That slot now
  carries **the highest-ranked warning not already shown elsewhere**, promoted out of the
  rail by key - the same say-it-once rule the dated shortfalls follow. The rail is retitled
  **"Also worth a look"** and takes `hideWhenEmpty`, so it omits itself rather than printing
  a header over nothing.
  - **The all-clear states a fact, it does not congratulate.** *"great job, everything's
    sorted"* was the ask; the wording goes a step past it, deliberately. Praise for a quiet
    day is hollow - most quiet days are the plan working - and a product that congratulates
    on a schedule teaches you to discount it, which is nag fatigue in a friendlier coat.
    So: a green tick, **"Nothing needs you today."**, and a line saying *why* - "Every
    payment due before Sat, 28 Nov has an amount, and the account it leaves from covers it."
    A reason outlasts a compliment, and it is still true on the day it stops being clear.
    `whatMoved` (ROADMAP 3.3) prints under it when the server supplies it.
  - **It cannot contradict the page.** It renders only when the insight list is empty, which
    is the same list that feeds the inline shortfalls - so a green tick above a shortfall in
    *Before payday* is impossible by construction, not by a check that could be forgotten.
    Verified by stubbing `/insights` to an empty list over CDP (a response substitution on
    the way into the browser; every non-GET stayed aborted and nothing was written).

### Files

New: `SpendToday.tsx`, `BeforePayday.tsx`, `StandingPanel.tsx`, `DayStatus.tsx`.
Deleted: `Pulse.tsx`, `PulseMetrics.tsx`, `ComingUpList.tsx`.
Changed: `TodayPage.tsx`, `InsightList.tsx` (exported `useInsightAction`, added `hideKeys`
and `hideWhenEmpty`),
`TodayPrimer.tsx`, `TodayGuideSheet.tsx`, `features/help/content/today.ts` (seven topics
re-worded - the help described a page that no longer exists).

**No backend change and no new endpoint**, so the Postman collection is unchanged;
`/accounts/{id}/projection` already had a request.

### Verified

`npx tsc -b --noEmit` and `npx vite build` clean. Headless Chrome against the real dev data:
no console errors, no horizontal scroll, the shortfall anchored to Coding Ninjas EMI (not
Education loan EMI), Standing opens and reconciles against `/financial-state`.

---

## 2026-10-24 — Summary: the salary months, side by side

**Branch `feature/month-summary`.** The user asked for a monthly summary below Goals in the
rail, by charts, consolidating months, with the *content* left to judgement: *"you decide from
finance growth perspective what needs to be known by the user"*.

### What it says, and why those five things

`DESIGN_SYSTEM` §8 already names the only four places a chart earns its place here — net worth,
debt payoff, cycle comparison, category vs baseline — so the sections are those, ordered by
growth rather than by chronology.

| Section | Form | The question |
|---|---|---|
| Where you stand | **No chart.** A ruled statement | Net worth · still owed · interest ahead · committed share |
| Month by month | Spend columns, income as a rule across each | Did spending fit inside what came in |
| Where it went | The same columns, stacked | **Is the committed share falling** — the one number a decision can move |
| Debt down | A clay curve to the last payoff | The only section full of data on day one |
| Did the plan hold | **No chart.** Counts and a hairline | Commitments kept — the North Star |

Two sections deliberately have no chart. "11 of 13" is the whole answer, and a bar of it is the
same fact drawn larger.

### The honest problem, stated on the page

**One complete salary month exists.** August has nothing in it, September has no plan behind it,
October is 90% through. The page says so in its opening paragraph rather than letting two bars
imply a trend. Debt down is exempt and says so — it is derived from each loan's amortisation,
not from history.

### Two things the real data caught, which compiling never would have

1. **September read as "0% committed".** Nothing in that month was linked to a bill because
   there were no bills yet — true of the links, false about the person, and it would have drawn
   the committed share collapsing to nothing, exactly backwards. Now `planTracked: false`, the
   split is **withheld rather than zeroed**, and the column is drawn as one undivided band. This
   is rule 3 somewhere it had not been needed before: *null means unknown* applies to a ratio as
   much as to an amount.
2. **"16 of 17 commitments kept", including the salary.** → `FIX_BACKLOG` 1.15 above.

### Backend — two reads, no schema

`com.finance.review`: `GET /review/months?months=12` and `GET /review/debt-trajectory`.
**No new entity, no new column, nothing for DEFERRED SCHEMA** — the backend boots unchanged.
Everything is recomputed from the engines that already own it: the same repository sums as
`CycleServiceImpl.computeSummary`, the same `sumUnplannedByTypeInRange` Room is built on, the
same `PlanAdherence`, the same `AmortisationCalculator`. A figure here that disagreed with the
screen it came from would make the whole page worthless.

**Nothing is read from `CycleSnapshot`,** because no cycle has ever been closed and a
snapshot-backed series would be permanently empty. **Reading Summary creates no cycle rows** —
it queries cycles that already exist instead of going through `CurrentCycleResolver`.

Two additive repository finders (`CycleRepository`, `CommitmentRepository`) and
`PlanAdherence.from` made public. That is the whole footprint on existing backend code.

### The comparison that is not a lie

`samePoint` cuts the previous cycle at **the same day of the month** before comparing. This
month's spend against last month's *total* flatters for twenty-seven days out of twenty-eight.
It reads "₹17,631 more than by day 27 of 28 Aug – 27 Sept", and is null when there is no
previous recorded month rather than inventing a baseline.

### Charts — ADR-0021

- **`Number()` over money is confined to `components/charts/chartScale.ts`,** which can only
  return fractions. Every figure a person reads is a server figure through `Amount`, so
  `FRONTEND_CONVENTIONS` §4 rule 2 survives intact instead of quietly eroding.
- **Recharts is not adopted** (it was never installed). Columns are HTML/CSS, the curve is
  inline SVG. No dependency added. `TECHNICAL_ARCHITECTURE`'s charting row is corrected.
- **New `--chart-*` tokens**, separate from the domain hues: `--commit`'s dark value sits ΔE 13
  from `--invest`'s in normal vision, below the legibility floor for two fills. Committed and
  flexible are **two steps of one hue** — both are money going out — with invested a different
  hue because it is money kept. Validated in both modes.

### Verified, not assumed

Headless Chrome against the live app, non-GET blocked so real data was never touched. The rail
shows six entries with Summary lit; five sections render; no console errors; no horizontal
scroll at 1440px; `outstandingNow` ₹3,34,442 and debt-free 5 Oct 2029 both reconcile with
`/financial-state`; the curve is monotonic and ends at ₹0. Three layout faults were found by
**looking at a screenshot** and fixed: 340px-wide columns that read as blocks, an income rule
whose halo assumed a white surface, and a 37-point axis truncating "Oct 26" to "O…".

Postman: a **Summary (review)** folder with both requests, assertions on the rules that matter
(an unrecorded month carries nulls; committed + flexible = spend; no debt-free date while a loan
is excluded), and saved real response examples.

---

## 2026-10-03 — the plan stopped being read as fact, and Today grew a hierarchy

Three slices, all verified. The thread running through them: **a plan field was being read as
though it were a record of what happened.**

### ADR-0020 — `committed` reads the account actually paid from (`FIX_BACKLOG` 1.8)

`PositionServiceImpl.leavesHeldMoney` decided whether a bill's outstanding belongs in
`committed` from `commitment.getAccountId()` — the plan. U3 had just stopped settlement
enforcing that account, so the plan became a claim nothing checked. The emergency-fund top-up
was planned Cash wallet → Premium (neither spendable), so all ₹15,000 stayed out of `committed`
— while ₹1,000 of it was actually paid from HDFC Salary, left spending money, and was never
spoken for. Now resolved from the **latest recorded payment**, falling back to the plan. The
destination still comes from the plan, because `settle` enforces it. **No schema change.**

### M1 — every plan-field read audited and labelled

**The register is the table in ADR-0020.** New `CommitmentSourceResolver` holds the one
implementation of "where does this bill's money come from"; `PositionServiceImpl` and
`ProjectionServiceImpl` share it. **1.9 fixed:** the projection behind the shortfall warning
grouped bills by `c.accountId` in SQL and now groups by effective source, so it can no longer
warn about an account that is not being drawn on. The auto-matcher, `settle`'s destination
check, Timeline, the forecast and the mappers were each examined and **deliberately left on the
plan**, with a comment at each site saying why. **Honest caveat:** no open bill currently has
evidence that disagrees with its plan, so the live figures are identical before and after.

### Today's middle block rebuilt into three tiers — `features/today/components/PulseMetrics.tsx`

The user's brief called the seven rows *"visually flat, text-heavy, lacks clear hierarchy"*. All
true, of one cause: seven rows of identical weight with a run-on annotation in a 22rem column to
the **right** of the figures. Now **Today's pace · Safety · What you owe**, with notes moved
under their label and **one grid for all three tiers** so figures still stack across the block.

**Three things the brief asked for and did not get** — the first two offered as a choice with
previews, and the user chose this layout:

1. **No cards.** `Pulse.tsx` already recorded why: an earlier tile build read as *less* classy
   than the spreadsheet. `CLAUDE.md`'s bar is "aligned figures, visible derivations, ruled
   density". **This still governs that page — do not reopen it without new evidence.**
2. **No progress ring.** A ring cannot show past 100%, and going over today's share is normal,
   not a failure (rule 8). `ProgressRule` pins at full and the note changes word to "over".
3. **No green on a positive figure** — not put to the user; see the open decision above.

**Fixed on the way:** `Free this month` had **no `emphasiseNegative` at all**, so −₹9,436 drew in
plain ink; and both pacing rows were hidden whenever Real Balance went negative, removing the
daily pace at exactly the moment it matters.

**Verified:** `tsc -b --noEmit && vite build` clean, screenshotted over CDP at 1440px, 1000px and
in **dark mode**, console clean in all three. Found and **not** fixed: below ~700px the sidebar
does not collapse and the whole app squeezes to ~130px — pre-existing, `FIX_BACKLOG` **4.8**.

### What the user did on their own data

- **Cash wallet → "Yes – day to day"** (`USAGE_ISSUES` U4). Real Balance ₹3,627 → **₹3,867**,
  exactly as predicted. It also silently moved ₹15,000 into `plannedSavings` — that is 1.11.
- **The emergency-fund top-up is `PAID`**, ₹15,000 of ₹15,000, the last ₹4,500 from HDFC Salary.
  **The orphan risk is closed:** `settle` refuses a paid instance, so txns 85 and 94 can never be
  counted against it again.
- **₹8,400 moved into IDBI** for the 5 Oct EMIs.
- **RD - Mom done:** monthly contribution ₹0, `liquid` false, note *"Jan 2029"*. The ₹9,000 now
  stays out of the emergency-runway figure. It remains outside net worth by design, which
  `InvestmentsRegister` states on screen. `FIX_BACKLOG` **2.14** still wants a real maturity
  date — **DEFERRED SCHEMA** has the DDL and the migration freeze is on.

### The one thing the data said that nobody has acted on

**Three mandatory monthly commitments all fund the emergency fund** — 10 (variable, day 28),
41 (₹15,000, day 2) and 43 (₹30,000, day 3), two of them sharing the identical name. October is
₹39,636 of bills **plus** ₹27,500 set aside against a ₹57,700 salary, which is why *Free this
month* reads −₹9,436. **That is not a display bug; the plan does not fit the month.** Detail in
`FIX_BACKLOG` §"Data to check". The user parked it on 2026-10-03.

### Last thing of the day: every relative date was a day fast after 17:30 (`FIX_BACKLOG` 1.12/1.13)

The user spotted **"Tomorrow · Mon, 5 Oct · 3"** on the Months plan at ~21:20 and said the app
was *"running 1 day further"*. It was — everywhere, every evening.

`lib/dates.ts` `daysBetween` compared a **date** with an **instant**: `new Date('2026-10-05')` is
**UTC** midnight, the default `toIso` was `new Date().toISOString()` (a wall-clock time), and the
fractional difference was then rounded. In IST it tipped at **17:30 local**. So after half five:
4 Oct read "Today", 5 Oct read "Tomorrow", "in N days" was short by one, and — the one that
mattered — `PlanZone` uses `daysBetween(...) < 0` for **late**, so **a bill due that very day was
drawn as overdue**. Both sides are now flattened to local midnight. `localIsoDay` already existed
in that same file and did exactly this; `daysBetween` simply never used it.

**Found on the way (1.13):** the cycle band said *"24 days to salary"* while Today said *"25"*.
Salary lands the day **after** the cycle's last day, so the band was wrong about its own label.
`CycleProgress` gained **`daysToSalary`** (`daysRemaining + 1`), carrying the server's meaning —
the divisor behind `perDay`. `CycleBand` and `MonthCrux` use it; the amber tone still turns on
`daysRemaining`, so it warns on exactly the day it always did.

**Verified by reading the rendered text over CDP, not just the build:** stable at 06:00, 17:29,
17:31 and 23:59 IST · the band now reads *"MON, 5 OCT · 3"* with no "Tomorrow" and every weekday
label is correct · all three screens agree on **25 days to salary**.

*Lesson worth keeping: a date and a timestamp are different types, and this file knew it —
`localIsoDay` carries the warning in its own comment. One function skipped it, and every relative
date in the product inherited the bug.*

## ⚠️ 2026-09-29 → 2026-10-02 — reconstructed after an editing accident, 2026-10-03

**These sections were destroyed by Claude on 2026-10-03** — a scripted edit meant to refresh
*WAITING ON THE USER* rebuilt the file as `new_head + s[old_end:]` instead of
`s[:old_start] + new_head + s[old_end:]`, dropping everything above that heading. The file had
not been committed since 2026-09-28, so `git show HEAD` could restore only up to that date.

**What follows is a condensed reconstruction, not the original text.** It is written from the
same session's reading of the originals and from the living docs, which were **not** affected
and remain authoritative. **Where this summary and those docs disagree, they win.**

Full detail survives in: `product/FIX_BACKLOG.md` **1.6, 1.7, 2.9** · `product/USAGE_ISSUES.md`
**U1, U2, U3** · `architecture/decisions/0020-*` · migrations **V22**, **V23**.

### 2026-09-29 — communication clarity audit

Triggered by the user asking *"before salary — which salary?"*. Five fixes, all at source:
`ShortfallRule` now names the next salary date and says "must keep ₹10,000" rather than
"(minimum ₹10,000)", and asks for money "**by**" a date rather than "before" it ·
`GoalBehindRule` leads with what is saved rather than what is missing · `TransactionFormFields`
says what is held back and why · and "Left today" stopped double-counting a settled bill
(`FIX_BACKLOG` **1.6**). The hero line was rebuilt three times that day and ended as a
statement rather than a run-on sentence.

### 2026-09-30 — three fixes on the Months plan

- **A goal's funders showed the rule, not the occurrence.** The user changed October's
  Emergency-fund top-up from ₹17,000 to ₹15,000 and *Funded by* still read ₹17,000.
  `GoalFunding` now resolves a **one-off's** amount from its occurrence in the current cycle,
  falling back to the rule; a *recurring* funder has no single month, so the rule's amount stays.
  `FunderAmount` shows the occurrence with a quiet *"set to this, from ₹17,000"* beneath.
  Also fixed: `GoalFunding.tsx` built `${dueDay}th` directly and printed **"on the 2th"**.
- **Done had to read as done.** A skipped bill wore the same green tick as a paid one. Split
  into `paid` (green `CheckCircle2`, no strikethrough — a struck-through amount is the language
  of cancellation) and `skipped` (`CircleSlash`, muted, strikethrough kept). **Three attempts
  failed first**, all the same mistake: colouring the row's *container* (a 2px left edge, then
  a gradient wash). What worked is a solid `PAID` tag **in** the row. *Lesson: to mark a row's
  state, put something in the row — do not tint, bar or band the row itself.*
- **Part-paid bills show how far in.** `PartPaidNote` renders "₹500 of ₹2,500 paid" with a
  `ProgressRule`. The rule was being clipped because `LedgerRow`'s secondary cell is `truncate`
  (`overflow: hidden`) and the marker overflows its 2px track — fixed with `richSecondary`.
  **Any future non-text secondary needs that flag.**
- **"Needs you" is three on every surface.** `InsightService.limitFor` returned 5 for Month.

### 2026-09-30 — "Towards a bill?" on the Add sheet

Recording a ₹500 petrol expense did not count against the ₹2,500 Petrol commitment:
`CommitmentAutoMatcher.amountFits` demands the amount **to the paisa**, and the date must be
within **±3 days**. A part payment satisfies neither by definition, so ₹500 left `held` *and*
₹2,500 stayed in `committed` — ₹2,500 of intent producing ₹3,000 of effect. The Add sheet now
offers an optional **"Towards a bill?"** row; no backend change, since
`POST /commitment-instances/{id}/settle` already took `{transactionId, amount}`.

**The deeper question, still open (`FIX_BACKLOG` 2.13):** Petrol, Mobile recharges and Hair cut
are not bills. A bill is one payment on one date; petrol is ₹2,500 across five fills.

### 2026-10-02 — "Paid from" became a plan again, and a bill remembers every payment

One afternoon of real use produced four linked problems, each found by fixing the one before it.
**This is the day that set up everything done on 2026-10-03.**

| | |
|---|---|
| **`FIX_BACKLOG` 1.7** | The Settle picker offered an entry that already paid that same bill. The server's guard only asked *"does this pay a **different** bill"* |
| **U3** | Settling from another account flagged `NEEDS_REVIEW`, and the only way round it was to **edit the bill first** — the product asking the user to rewrite the plan to get past a warning. `accountMatches` became **destination-only** |
| **U2 → V23** | `commitment_instance_payments`, with a **UNIQUE key on (instance, transaction)**. `linked_transaction_id` was a single column overwritten on every settle, so a bill forgot its earlier payments |
| **U1 — partly** | *Towards a bill?* matched only the **source** account, so it was blind to the case it was built for |

**Two lessons kept:** *a UI filter is not a rule* — 1.7 was first "fixed" by hiding the entry
while the server still accepted it, so both layers, every time. And *a guard is only as good as
what it compares against* — 1.7's server guard was correct and useless, because U2 destroyed the
value it read.

---

## 2026-09-28 — first real day, and two fixes on `bugs/27-09-2026`

**The user is now live on real data.** October's cycle is current, salary is settled, the EF
contribution is settled, and a ₹3,226 reservation funds the Bangalore goal.

### The cycle-ended timezone bug

`new Date("2026-09-27")` is **UTC midnight**, so anywhere east of Greenwich it is already in
the past by breakfast. Three places compared it against `Date.now()`: both `canClose` checks
(duplicated on `MonthPage` and `MonthClosePage`) and — the real root — **`cycleProgress()` in
`lib/dates.ts`**, which feeds the cycle band, `MonthCrux` and the day counter. On the final
day of *every* cycle the app claimed the month had ended while the server correctly refused
with `CYCLE_NOT_YET_ENDED`.

`cycleProgress` now compares local midnights, and both `canClose` sites read
`cycleProgress().ended` — **one definition of "ended" in the whole frontend.** Verified: the
Close button is gone on a cycle ending today, the direct URL is guarded, and a genuinely
ended cycle still offers it.

**~14 other `new Date(isoString)` calls remain**, all display-only. Correct in IST, wrong in
any negative-offset zone. Left alone deliberately — smallest correct change.

### FIX_BACKLOG 2.9 — a one-month amount now sticks (V22)

`amount_overridden` on `commitment_instances`; `reconcileWithRule` skips the amount sync when
set; `POST /commitment-instances/{id}/use-bill-amount` is the way back. **Flyway applied V22
itself on the devtools restart** — no manual step was needed.

**The flag is not the fix, and the first UI for it was wrong.** It shipped as a *Just this
month / From now on* radio behind a new **Amount** button on the plan row. The user rejected
it immediately and correctly: *"User will not be able to guess the amount is clickable and
doing it what will happen. We need to have intuition. we can have it under pencil click only
right?"*

**They were right, and the rebuilt version is simpler.** It lives in **Edit**, behind the
pencil that already means "change this". A fixed bill now shows two adjacent labelled fields:

| | |
|---|---|
| **How much** | Every month, until you change it |
| **This time** | Just the one due 1 Oct, if it differs. Leave it blank and this month uses the amount above |

No hidden choice, no third control on the row, nothing to guess — the two labels sitting next
to each other *are* the explanation. Edit also offers *Use the usual amount for this month
too* once a month is overridden, because clearing the field cannot mean "put it back" (blank
already means "leave it as it is").

**Generalise this:** a button labelled with a noun (*Amount*) says nothing about what it does.
Two labelled fields beat a choice you have to open something to discover.

**Two real bugs found while reworking it:**
- `instanceAmountEligible` still required `VARIABLE`, so the new field rendered on fixed bills
  and silently did nothing on save.
- The row's third control overflowed and printed across the figure (`₹10,000Amount`) — the
  same collision `InvestmentRow` hit. Gone now the button is gone; `WorklistRow` is back at
  `7.5rem`, with a comment saying a third control will not fit.

**Terms-locked bills are excluded automatically** — `amountSlot` is already gated on
`!termsLocked`, so a loan's EMI offers no per-month override. That resolves the worry the
first version raised.

**Not verified by a write.** The sandbox blocks POSTs and these would touch real data, so an
override has never actually been set. Ask the user to change one month's amount in Edit and
confirm it survives a **reload** — that reload is the whole bug.

## Readiness check, 2026-09-27 — the day before real use

Swept before the user's first real day. **The code is ready; what is left is theirs to click.**

| | |
|---|---|
| **Branches** | Everything is merged into `uat-release` (PR #14 carried the manual in). `bugs/27-09-2026` is cut from it and carries **3 uncommitted files** — the cycle-ended timezone fix. Merge before tomorrow or the Close button stays a day early |
| **Endpoints** | All 12 checked return 200: health · cycles/current · position · financial-state · insights/all · forecast · accounts · commitments · goals · loans · investments · cycles/3/shape |
| **Screens** | All 16 render clean in headless Chrome. The only console error is the known nested `<button>` on `/needs-you` (`FIX_BACKLOG` 4.7) — invalid HTML, clicks work |
| **October's plan** | `state: COMPLETE`, **0 unknown amounts**, 18 instances all `PENDING`. In ₹57,700 − committed ₹41,616 − set aside ₹12,500 = **free ₹3,584**. The arithmetic was re-summed by hand from the 18 rows and agrees |
| **Insights** | 3 live, all `OPPORTUNITY`. Nothing urgent going into the month |

**Anthropic has been un-archived** — it is in October's plan at ₹2,373 on 7 Oct. Still spelled
"Antropic".

### Expect a large negative on the morning of the 28th — it is not a bug

The moment cycle 3 becomes current, `committed` jumps from ₹0 (September carries no bills) to
the whole month's ₹41,616, while `held` is still about ₹8,000 because **expected income is
never counted until it arrives**. Real Balance will read roughly **−₹33,600** until the salary
is recorded, and the shortfall rule will probably fire.

That is the model working: it is what the user would be short if the salary never came. It
resolves the instant the *Salary credit* instance is settled as received. **Tell the user to
record the salary first, before reading anything else on the screen** - otherwise the first
thing the product ever says to them on a real day is a false alarm.

Worth considering afterwards, but **not** worth changing the day before: whether day 1 of a
cycle should phrase this differently, given expected income is sitting right there in the
plan. Changing what Real Balance means is not a thing to do the night before first use.

## Fresh start on 28 September (prepared 2026-09-26)

The user asked for the app to carry nothing from September. **The code side is done** (the
baseline fix below). What is left is theirs to click.

### The one code change that was needed

**An empty cycle is no longer counted as a month of ₹0 spending.**
`SpendBaselineCalculator` took every *ended* cycle. An empty **28 Jul – 27 Aug** cycle sits
beside the first real month, so at 00:00 on 28 September there would have been exactly two
ended cycles — September (₹3,200 flexible) and one that never existed (₹0) — which is
`MINIMUM_CYCLES`, and the app would have greeted the user's first real day with
*"You usually spend ₹1,600 a month day to day, measured over 2 months."*

A fabricated fact, on day one, from the median of a half-set-up month and a month that never
happened. `TransactionRepository.countByUserIdAndDeletedAtIsNullAndDateBetween` now gates it:
a cycle with **no entries at all** is not an observation. *Any* entry counts, not just
flexible ones — a month whose only entries were EMIs really was a month of ₹0 day-to-day
spending, and that is genuine.

With it, 28 September has **one** observation, which is below the minimum, so the honest
answer comes back instead: not yet known. Two real months in and it starts working.

**Proof it took effect:** `GET /financial-state` → `baseline.cyclesObserved` went **1 → 0**.
The empty July cycle is excluded today; the September one is not ended yet.

### What the user does on the 28th

1. **Delete the nine junk rows first** (Ledger; they are in the *Fixes* table below). They are
   inside the September cycle, so they distort the ₹3,200 that becomes an observation later.
2. **Re-anchor each account's balance.** Money → the account → **Update balance**.
   **Set "True as of" to 27 September, not the 28th.** The balance is
   `openingBalance + sum(postings dated **strictly after** the anchor)`
   (`PostingRepository.sumPostingsForAccount`: `t.date > :openingAsOf`), so an anchor of
   28 Sep would silently exclude the salary credited that same day. 27 Sep is the exact cycle
   boundary and lets everything from the 28th onward count.
3. The four other data fixes in the table below.

### What needs nothing, and why — all verified 2026-09-26

| | |
|---|---|
| **October's plan** | Cycle 3 (28 Sep – 27 Oct) already holds **18 PENDING** instances. Cycle 1 (28 Aug – 27 Sep) holds **zero**. Nothing from September is in October's plan |
| **"What's different this month"** | `PlanChanges` treats the plan's first month as the baseline and reports nothing. `planStart` is the earliest `INCOME` rule's `activeFrom` — *Salary credit*, **2026-09-28** — which is exactly the October cycle's start, so it resolves correctly with no intervention |
| **Goals** | Progress derives from the linked account, so re-anchoring HDFC Premium moves the goal with it |
| **Loans** | First EMI is 5 Oct, `unrecordedEmis: 0`. Nothing to clear |
| **Closing September** | Not worth doing. Cycle 1 has no commitment instances, so a close records "Kept 0 of 0", which renders nothing by design. Leave it open |
| **`insight_state`** | The 23 Sep row (`goal:6:pace`) stays open **deliberately**. The warning is still true, and re-announcing a live warning is what ADR-0017 exists to prevent |
| **Transactions in September** | They stay in the Ledger by design (soft delete only, rule 6). After re-anchoring they no longer affect any balance |

**Before starting anything, put the October data fixes in front of the user.** They begin
real use on **28 September** — three days out as of this writing — and their own standing
rule is that October correctness outranks features. All five were re-verified against
`:8080` on 2026-09-25 and all five are still open; they are in *The user's October data
fixes* below. Claude cannot make these writes.

| # | |
|---|---|
| 3.1 | 🟡 goal-underfunded (2026-09-24) and **rate mismatch (2026-09-25)** done. Idle cash and subscription drift left |
| 3.2 | ✅ done 2026-09-25 · **V21 applied** · the dismiss click itself is **still unverified** |
| 3.3 | ✅ done 2026-09-25 |
| 3.4 | **Rescope before building** — most of it is already true. See ROADMAP §3.4 |

### 3.1 rate mismatch — what was built (2026-09-25)

**`RateMismatchRule`** — money set aside while debt that costs more than it can earn is still
running (`FINANCIAL_STATE.md` §7, "allocation is costing money"). Nothing in the product had
ever connected a goal to a loan; each screen was correct alone and the one fact joining them
was visible from neither.

**Live on the user's data, screenshotted on `/needs-you`:**

> **₹8,000 you could move, while ₹42,701 costs 22.08% a year**
> Money in Emergency fund doesn't reduce what Health Insurance charges. Emergency fund holds
> ₹33,000, but ₹25,000 has to stay put as a minimum balance. Holding ₹8,000 rather than
> repaying costs about ₹1,766 a year. Money you can reach in a hurry is still worth having —
> this is the price of its size, not a reason to empty it.

**Four decisions, all load-bearing — reasoning in ROADMAP §3.1:**
- **No savings rate is assumed.** The roadmap says "saving at 6% while paying 22%", but
  nothing models what an account earns and inventing a figure breaks rule 3. Not needed:
  `min(reachable, outstandingPrincipal) × annualRate` is arithmetic over figures we hold.
- **A mandatory minimum balance is not savings you can spend.** ⚠️ **This was shipped wrong
  and corrected the same day.** The first version compared the goal's whole ₹33,000 and said
  the trade cost **₹7,286 a year**. HDFC Premium carries a mandatory ₹25,000 minimum
  (`minimumBalanceMandatory`, `hold.locked` ₹25,000, `available` ₹8,000), so only ₹8,000 can
  actually move: the real figure is **₹1,766**, a **4× overstatement** urging a transfer that
  is not even possible. `reachable()` subtracts the minimum, and the wording now says what is
  held back so the figure cannot look arbitrary next to the balance on the goal page.
  *The lesson worth carrying: a goal's `currentAmount` is not the same as money you can use.*
- **It must not read as "empty your fund."** A fund spent on debt means the next emergency is
  borrowed again at the same rate. The closing sentence is part of the rule and is
  **asserted in Postman** so a future edit cannot quietly drop it.
- **The bar is the yearly cost (₹1,500), not the balance.** A balance floor was the first
  attempt and it was the wrong variable — ₹10,000 against 22% is worth saying, the same
  ₹10,000 against 12% arguably is not. Only the product of the two is what the user acts on.
  Also: top rate ≥ 12%, loan `ACTIVE` with a balance. One insight, dearest loan only.
  `OPPORTUNITY` — nothing is going wrong.

**Files:** `insight/rules/RateMismatchRule.java` (new) · `InsightType.RATE_MISMATCH` ·
`FinancialContext` gained `List<LoanView> loans` **and `List<Account> accounts`** (the
projections list covers only *spendable* accounts, so a rule about money deliberately held
back had nowhere to read it) · `InsightService` injects `LoanService` · `types/insight.ts` ·
two Postman assertions on *What needs you - everything*.

**No schema. No bean cycle** — `LoanServiceImpl` depends on `AccountService`,
`@Lazy CommitmentService` and two repos; nothing reaches `InsightService`, which is consumed
only by `WriteEffects` and `FinancialStateServiceImpl`.

**Verified:** backend compiles and the running app serves it (`GET /insights/all` → key
`loan:7:rate-mismatch`, impact `1766.40`, route `/loans/7`, no `when`); frontend
`tsc -b --noEmit` + `vite build` clean; **screenshotted** on `/needs-you` in headless Chrome
with every non-GET blocked. Nothing in the frontend switches on `InsightType`, so no
exhaustive match needed updating — the UI groups by severity.

**Keyed on the loan** (`loan:{id}:rate-mismatch`), so when Health Insurance clears in Sep 2027
this crossing clears and a new one opens for Coding Ninjas at 19.05%. That is news, not a
repeat (ADR-0017).

**Still unverified by a click:** *Open loan* → `/loans/7` was not exercised; the route exists
(`App.tsx:62`). And **`I know` on this row has never been pressed** — same POST gap as 3.2.

### Why idle cash was not built (investigated 2026-09-25)

The user asked for it directly. It was not built because **it cannot fire truthfully on this
data**, and firing untruthfully is the one thing rule 3 forbids. Every non-spendable rupee is
already accounted for:

| Money | Status |
|---|---|
| HDFC Premium **₹33,000** | Linked to goal 1 (Emergency fund). Allocated — and ₹25,000 of it is a mandatory minimum. Already covered by `RateMismatchRule` |
| Cash wallet **₹16,900** | **Looks idle and is not.** Commitment **41** — *Emergency fund top-up*, ₹17,000, `TRANSFER`, **from Cash wallet**, active 28 Sep–27 Oct — moves the whole lot on 2 Oct |
| HDFC Salary ₹7,291 · IDBI ₹709 | Spendable working money |
| SIP - Zerodha ₹5,000 | An investment, not cash |

So an idle-cash rule either says nothing, or points at ₹16,900 that has a plan — which trains
the user to dismiss the channel (see memory `feedback-behavioural-reasoning-wanted`). Building
it would also mean shipping a rule that has never been seen to fire, which is what
"do not build blind" was meant to prevent.

**When it becomes worth building:** after the user starts recording real months, if a balance
appears with no goal link, no reservation and no commitment drawing on it. The exclusion set
above is the design — write it then, against data that proves it.

**Subscription drift is in the same position, for a different reason:** it needs history, and
there is about one month of it. Spotify ₹139, TV+WiFi ₹1,000 and the archived Anthropic
₹2,373 cannot drift against a baseline that does not exist yet.

### Found on the way, not fixed (2026-09-25)

- **`GET /api/v1/commitment-rules` returns 500.** The route does not exist — the real one is
  `/commitments`. Same unknown-path-returns-500 family as `GET /users/me`. Logged below.
- **Nested `<button>` on `/needs-you`** — React hydration error in the console.
  `FIX_BACKLOG.md` **4.7**, with the fix.
- **A new bill exists that the handoff did not know about:** `EMI - Processing fees`
  (id 50, `VARIABLE`, due 7th, one month only 28 Sep–27 Oct, "processing fees + first month
  interest of health insurance").

### 3.2 - what was built

A warning is derived on every read and never stored, so "delete this" cannot mean anything:
the next read works it out again and the button looks broken. Dismissal is therefore
remembered **beside** the warning - it stays true, and the product stops saying it.

**V21** adds two columns to `insight_state`: `dismissed_at` and `snoozed_until`. Two, not one
status, because they are different promises - a dismissal is answered by the world changing,
a snooze by the calendar.

**"Until something changes" needs no expiry rule.** The mechanism was already there: a
warning that clears and returns opens a *new* row (ADR-0017 - a recurrence is a different
event from one that never left), and a new row carries no dismissal. The single case needing
code is **escalation**, where the same row gets louder - `InsightStateTracker` undismisses it,
because an answer given to a milder thing must not outlive it.

**Rules stay pure.** Filtering happens once, in `InsightSilencer`, read by
`InsightService.evaluate`. A rule that had to remember to check dismissal is a rule that will
eventually forget.

**Dismissing records the warning if it has never been recorded.** The tracker only writes on a
**write**, because that is what makes a crossing a crossing - recording on read would mean the
state was already there by the time anything was written and the toast would announce nothing.
The consequence is that a warning true since before the user's last write has no row. Refusing
to dismiss it would be an unexplainable failure: it is on screen, and the button would claim it
does not exist. So `InsightSilencer.rowFor` creates it, with the fields the tracker would have
written. The controller resolves the key against what is **currently true**, so a resolved
warning cannot be dismissed.

**Answered items are folded, never dropped** - `"N you've answered"` at the foot of
`/needs-you`, each with *Show it again*. A list you can silently lose things from is one you
stop trusting.

**API:** `POST /insights/{key}/dismiss` · `/snooze?days=` (1-90) · `/restore`. Keys contain
colons (`goal:6:pace`) and are URL-encoded by the client.

### Found on the way, not fixed

**A GET to a POST-only route returns 500, not 405.** `HttpRequestMethodNotSupportedException`
is unhandled in `GlobalExceptionHandler` - the same family as the known "`GET /users/me`
returns 500". Pre-existing, now visible on the new routes. One `@ExceptionHandler` would fix it.

**Two of the user's bills are both named "HDFC - Credit card EMI"** (Rs 2,648 Mobile Mom,
Rs 3,998 Health Insurance), so 3.3's unlock line cannot say which one ends. A naming problem
in the user's data - worth raising with them.

**No Postman assertions yet** for `GOAL_FUNDING_UNCLEAR`, `whatMoved`, or the three new
endpoints. Add them together in the next slice so the Insights folder is touched once.

**Decided with the user (do not reopen):**
- Speak after any write that matters, **not** after every write. Silence is a valid effect.
- Report **before → after**, not just the new figure. The delta is the consequence.
- Announce a warning **when it crosses**, not while it is true — and announce the recovery
  too. The reasoning is behavioural and the user endorsed it explicitly: re-stating a live
  warning on every write trains the user to ignore the channel within two days.
- **Prominence follows severity.** CRITICAL/ATTENTION is held and explicit; everything else
  is one quiet line. The user's words: *"whenever it requires my attention it should be
  louder and clearer."*
- **Migration freeze lifted for this feature only.** V20 was asked for and is applied.
  **It is back on now** — ask before writing V21.

**Built:** ADR-0017 · `V20__insight_state.sql` **applied** · `insight/domain/InsightState`
+ repository · `InsightStateTracker` (the crossing diff) · `InsightService.evaluateAll()` ·
`effect/WriteEffect` + `WriteEffects.around(...)` · `effect/dto/WriteEffectResponse` ·
`types/effect.ts` · `components/EffectNote.tsx` · Postman assertions on *Create expense*.

**Wired into every write that moves money:** transactions (create) · commitment instances
(settle, skip, unskip, confirm, set amount) · commitments (create, from-loan,
from-investment, update, archive, unarchive) · goals (create, update, archive, unarchive) ·
accounts (create, update, archive, unarchive) · reservations (create, update).

**Surfaced as a toast** (`components/EffectToastHost.tsx`, state in `uiSlice.effectToasts`),
**bottom-right**, newest nearest the corner, max three. `AddSheet` and
`SettleCommitmentSheet` dispatch `showEffect` and close immediately. **`QUIET` expires after
10s and is held while hovered; `HELD` stays until dismissed.** A cross dismisses; clicking
goes to whatever the crossing is about.

**Two corrections made on the way, both worth keeping:**
- An earlier build showed only `HELD`, so an ordinary expense crossing no line was
  *invisible* — which reads as broken, not restrained. Both are shown now.
- An earlier build **held the sheet open** until acknowledged. Wrong for every ₹50 expense.
  ADR-0017 §7 records why the toast is acceptable *now* and would not have been before: every
  warning it shows is also on Needs you, so nothing is lost when it fades. **The list had to
  exist first.**

**The empty-toast bug, and the trap behind it (found by the user, fixed 2026-09-23).**
The toast rendered an **empty tinted box**. Cause: `PositionServiceImpl:201-203` computes
`roomToday = (realBalance + spentToday) / days` — it adds today's spending **back** so the
day's allowance is stable across the day. That makes it *invariant to the very write being
reported on*, so `roomBefore == roomAfter` always, and since nothing else was rendered, the
box had no content. **`roomLeft` is the figure that moves.** Fields renamed
`roomBefore/After` → `leftTodayBefore/After` rather than left misleading, and the note now
also shows Real Balance, and returns `null` rather than an empty container.
*Worth remembering: `roomToday` is an allowance, not a balance — do not diff it.*

**VERIFIED ON SCREEN AND IN DATA (2026-09-23):**
- `insight_state` proves the crossing diff works on the user's **real** writes. Six
  transactions on 2026-09-23 (ids 66–71, 15:39 → 16:33) produced exactly **one** row:
  `goal:6:pace`, `first_seen 15:39:11`, `last_seen 16:33:47`, never cleared, never
  duplicated. Announced once across six writes, and `last_seen` moving on each one proves
  the tracker ran every time rather than silently failing. **That is the whole feature.**
- The toast was driven end-to-end in headless Chrome by **fulfilling** the POST with a
  fabricated 201 (`Fetch.fulfillRequest`, so :8080 and the real data were never touched):
  sheet closes, toast renders bottom-right reading *Left to spend today ₹1,199 → ₹999* ·
  *Free until salary ₹8,797 → ₹8,597* · the warning · cross · link. Screenshotted, and the
  figures match Today's own hero beneath it.
- **Entry animation** (`.effect-toast` in `index.css`): 220ms slide-and-fade from the right,
  `cubic-bezier(0.22, 1, 0.36, 1)`, with `prefers-reduced-motion` honoured. It appears
  unasked, so movement is what says "this is new" without a colour or a sound.
- **Edge margin** raised `space-4` → `space-6`. At 16px it sat hard in the corner and read as
  browser chrome rather than part of the page.

**Toast refinements (2026-09-23, all verified with real pointer input over CDP):**

| | |
|---|---|
| **Colour + icon by severity** | `HELD` → amber `--attention` tint, 3px amber left edge, `AlertTriangle`, *"Needs you now"*. Crossing but calm → teal `--accent`, `Sparkles`, *"Recorded · worth knowing"*. Money only → `--positive` edge, `Check`, *"Recorded"*. Matches `InsightList`, so one warning does not change colour depending on where it appears |
| **Countdown bar is the dismissal** | The bar is a CSS animation and its `onAnimationEnd` removes the toast. There is deliberately **no second timer** — a `setTimeout` beside it could disagree with what is drawn |
| **Hover holds it** | `.effect-toast:hover .effect-toast-timer { animation-play-state: paused }`. Because the bar *is* the timer, pausing it pauses the disappearance for free. Also `:focus-within`, for keyboard |
| **Click navigates — when there is somewhere to go** | First crossing's `insightDestination`, else `/needs-you`. A toast that only reports money moving is **not** clickable and gets no pointer cursor: the screen you are already on is the right place. The cross `stopPropagation`s |
| **`EffectNote` gained `bare`** | The toast now supplies its own tint, and a tinted panel inside a tinted card reads as a mistake |

**Position, size and dwell (revised 2026-09-23 after the user saw it in use):**
- **Bottom-right, not top-right.** On Today, "Needs you" owns the top of the right column, so
  a toast there landed on the one block most worth reading. Lower down it covers "Coming up"
  instead — further ahead, lower stakes, gone in ten seconds. Pushing page content down
  instead would make the layout jump on every expense, which is worse than a brief overlap.
  `flex-col-reverse`, so the newest sits nearest the corner.
- **Wider and shorter:** `22rem` → `27rem`, and in `bare` mode the *Left to spend today*
  label and its figures share one line instead of stacking. **432 × 157px**, down from ~352
  wide and appreciably taller.
- **Ten seconds, not five.** Five was not long enough to read two figures and a sentence
  without feeling hurried, and since hover holds it and the bar shows exactly how much time
  is left, a longer default costs nothing.
- The explanation is `line-clamp-2` in a toast — supporting detail, not the point.

**Measured, not assumed:** entry animation `effect-toast-in` running · left border
`rgb(15,118,110)` teal on QUIET, `rgb(180,83,9)` amber on HELD · `animationDuration: 10s` ·
timer bar present on QUIET, **absent** on HELD · play-state `running` → **`paused`** on real
pointer hover, bar frozen at 375.9px across 2.5s with the toast still on screen ·
**overlap with the Needs you section: none**, checked by rect intersection in both variants ·
`cursor: pointer` only where a destination exists.

**No test data was written by any of this.** The CDP checks fulfil the POST locally
(`Fetch.fulfillRequest`), so `:8080` never sees it. Every row in `transactions` for
2026-09-23 is the user's own (`test`, `test - 2` … `test - 4`); the scripts used
"toast check", which appears nowhere.
- Tone follows severity in `EffectNote` — an `OPPORTUNITY` gets the sparkle, not the warning
  triangle, matching `InsightList`. It was drawing every crossing as a warning (rule 8).

**Three test rows are still in the user's ledger** — txns 66 (₹500), 67 (₹100), 68 (₹100),
all described "test", all dated 2026-09-23, in the 28 Aug–27 Sep cycle they are not using for
real. Today shows ₹700 spent because of them. Remind the user to delete them from Ledger.

## Dedicated "Needs you" page (2026-09-23, verified on screen)

Asked for by the user: keep the in-page lists as they are, add one place that shows
everything, live, where a row takes you to what it is about.

- **`GET /api/v1/insights/all`** — no surface filter, no cap. Separate from `surface=ALL`
  because a surface is a *place* a warning is shown and "all" is not a place.
- **`/needs-you`**, `routes/NeedsYouPage.tsx`, grouped into *Costs money if nothing happens*
  / *Needs a decision* / *Worth knowing*. Polls every 30s — a due date passing changes this
  list with no write to invalidate a cache tag, so tags alone would leave a screen that
  claims to be current quietly describing ten minutes ago.
- **Not a sixth nav tab, deliberately.** Today's whole job is "where do I stand right now";
  a sibling tab splits one job across two screens. It is a drill-down of Today, and the rail
  keeps **Today** lit while you are on it (`NavRail` `owns`).
- **Entry point:** the `"3 of 7 shown"` counter on Today and Months was a true statement with
  nowhere to go. It is now a **"See all"** link. The lists themselves are unchanged.
- **`InsightRow`** (extracted from `InsightList`) takes `navigable`. Only the dedicated page
  passes it: on Today, a stray tap next to Room must not navigate away. The row navigates,
  the button still acts — `stopPropagation` on the button, or it would do both.
- **Verified via headless CDP:** the page renders, groups correctly, "See all" is present on
  Today, and clicking the row lands on `/goals/6`, which renders.

**All three things left open by that conversation were since answered and built** — the toast
(1.4, moved to bottom-right, `QUIET` fades and `HELD` does not), and dismiss/snooze (3.2, on
V21). The advice that survived and is still binding: **the Room delta belongs in the toast
only, never in the list**, or the list becomes a second transaction log.

**Superseded, kept only so the contradiction is not re-discovered:** an earlier version of
this block said *"no effect has ever been produced, `insight_state` is empty"*. That stopped
being true on 2026-09-23 — six real writes produced exactly one row (`goal:6:pace`), which is
recorded under *VERIFIED ON SCREEN AND IN DATA* above.

**Deliberately not done, with reasons:**
- **`DELETE` endpoints report nothing.** 204 has no body, and deleting a bill genuinely
  changes the month. Changing them to 200 would break the API contract and Postman; the
  frontend refetches instead. Revisit only if it reads as a gap in use.
- **`monthlyEffect` is not carried on plan writes.** ROADMAP 1.4 names it, but it already has
  a home in the plan revision log (`PlanDecisions` on Months), and plumbing it through the
  service return types to say it twice was not worth the churn.
- **Postman has no happy-path settle request** — only the two error cases. Pre-existing gap,
  and it means the effect is asserted on `POST /transactions` only. Saved response examples
  for every effect-carrying endpoint are still outstanding.

---

## PARKED — investment withdrawals (designed 2026-09-23, not built)

The user asked for partial and full withdrawals from holdings, then parked it to finish
Phase 1 first. **Keep this; it is a real gap, and the design is settled enough to build.**

- **The app has no redemption concept at all.** Investment endpoints are create · list · get ·
  patch · value check-in · delete. Nothing turns a holding back into cash.
- **A naive fix is actively wrong.** `totalInvested` *is* the account balance
  (`InvestmentServiceImpl.java:266-290`), so simply allowing a transfer out makes the SIP
  report **+65% gain on a holding that is down**. `gain = currentValue − totalInvested`, and
  `currentValue` is hand-kept, so it does not move when money leaves.
- **The fix:** one door, `POST /investments/{id}/withdraw`, posting a `TRANSFER` out **and**
  reducing `currentValue` by the same amount. Reducing both sides preserves total gain exactly.
- **You cannot withdraw more than the account holds**, so a maturing RD must have its growth
  credited first — an `INCOME` posting *into* the investment account (`PostingFactory` already
  supports this untouched). Put-in / growth / taken-out / in-there-now are then all derivable
  from transaction type alone. **No schema.**
- **Two decisions still open:** (a) outside-the-ledger holdings have no account to post from —
  refuse with a clear message, or first build "move a holding into the ledger"? (b) interest
  credited shows as income that month, which is right but enters the income baseline.
- **Blocked on a second gap either way:** a holding cannot be moved into the ledger after
  creation. `UpdateInvestmentRequest` has no `accountId` and the Edit sheet has no field, so
  delete-and-re-add is the only route. This is why the user's RD cannot be fixed by clicking.
- `SOURCE_ELIGIBLE.TRANSFER` in `transactionForm.ts:151` is `['BANK','CASH']` — a frontend
  gate only. The backend's single transfer rule is same-account (`TransactionServiceImpl:105`).

---

## The user's October data fixes (all five re-verified against `:8080` on 2026-09-25)

They start using Kosh for real on **28 September**, so these outrank features. Every one below
was checked live on 2026-09-25 and every one is **still open**.

| What | Where it is | Why it matters |
|---|---|---|
| **Nine junk rows, ₹1,597** | txns **66–74**, all dated 2026-09-23: `test`, `test - 2`…`test - 4`, plus `fr`, `jghuig`, `gj` | Inflates today's spend, Real Balance and net worth. **Three more than earlier handoffs recorded** — the old note said "66–71, ₹1,597", but 66–71 sums to ₹1,100; 72–74 make up the rest |
| **Home Support → Utilities** | commitment **9**, `category: {id:10, Utilities}` | Should be Family Support. Distorts the fixed-spend baseline from month one |
| **"Emergenecy fund contribution"** | category **19** | Typo, visible everywhere it is used |
| **"Antropic claude subscription" archived** | commitment **14** | October carries no ₹2,373. Months → THE PLAN → "1 stopped" → *Start it again*. Rename to **Anthropic** while there — the spelling is wrong too |
| **Two bills share one name** | **47** = ₹2,648 (Mobile Mom, ends Feb 2027) · **48** = ₹3,998 (Health Insurance, ends Sep 2027), both "HDFC - Credit card EMI" | Not cosmetic. 3.3's unlock line cannot say which one ends, and `PlanChanges` detects supersessions **by name** — two rows sharing one is exactly its known collision case |

Unchanged from before, and not a fix the user can click:

- **The RD – Mom bill no longer exists.** The user deleted it (`plan_revisions`: `ENDED`,
  −₹1,000). October is not carrying a wrong ₹1,000, it is carrying **none**.
- **"RD settles as EXPENSE" cannot be fixed by editing the bill.** `SourceBillSync.java:149`
  sets it from the holding: no investment account means no destination, so `EXPENSE` is the
  only valid answer. The RD was added as "Outside the ledger". See the parked section above.

Claude cannot make these writes. Guide the user, then verify through the API.

## Goal pace — now more urgent than it was

Bangalore trip reads `ON_TRACK` with **₹0 saved, ₹12,000 needed by 31 Oct and nothing funding
it**. Emergency fund reads `ON_TRACK` while needing **₹15,182/month that does not exist**.
`GoalPace` measures *time elapsed* against *percent saved*, so a goal added yesterday is
always on track. Rule 3 — *never be confidently wrong* — broken where it matters most.

**1.4 makes this worse, which is the argument for fixing it next.** `GoalBehindRule` is one
of only four rules feeding crossings, so a wrong pace is now something the product *says out
loud at the moment of a write*, not something buried on a screen.

(1.5 invariant tests stay **frozen** under the user's standing no-tests rule.)

## WAITING ON THE USER

- ~~Go-ahead on the Today redesign~~ **done 2026-10-03** - built as `PulseMetrics`, three tiers.
- ~~The last ₹4,500 of the emergency-fund top-up~~ **done 2026-10-03** - settled from HDFC
  Salary, bill is `PAID` at ₹15,000, and the orphan risk is closed: `settle` refuses a paid
  instance, so txns 85 and 94 can never be counted against it again.
- **Whether to repair the EF top-up's payment record by SQL** — reconstructable exactly, not
  asked for.
- **Break up the commit pile on `uat-release`** - now past **50 paths** across eleven
  unrelated changes. Reminded six times; a branch was offered and declined.
- **⚠ The IDBI shortfall, re-read 3 Oct after the user moved ₹8,400 in:** it now holds ₹8,860
  against ₹14,836 of bills this cycle. The 5 Oct EMIs are covered; **TV+WiFi Recharge on 8 Oct
  is ₹5,976 short.** HDFC Salary holds ₹25,016 and moving it changes nothing in Real Balance.

- **Four data fixes** from the fresh start may still be open — check before raising: Home
  Support's category, category 19's spelling and parent, category 20's parent.
- **Two modelling questions**, now logged as FIX_BACKLOG 2.12 and 2.13: whether a goal's
  arithmetic reads rules or occurrences, and whether Petrol / Mobile recharges / Hair cut
  should be commitments at all.
- **One click on "I know"** on `/needs-you`, so 3.2's dismiss path runs once. It is a POST —
  the sandbox blocks it and it writes to their own notification state, so nothing else can
  verify it. Deferred by the user on 2026-09-25 ("later — carry on"); it blocks nothing.
- **A write that exercises "Towards a bill?"** — the row, the list and its empty state are
  verified on screen, but the settle itself has never run from here.
- **The two parked withdrawal decisions** (see PARKED above).
- **Migration freeze** — lifted six times, each explicitly and narrowly:
  `V18__plan_revisions.sql`, `V19__insurance_policies.sql`, `V20__insight_state.sql`,
  `V21__insight_state_dismissal.sql`, `V22__instance_amount_override.sql`, and
  `V23__commitment_instance_payments.sql` (2026-10-02, asked for: *"do this change and let's
  settle this completely"*). **Assume it is back on** and ask before writing another. Flyway applies a new
  migration on the devtools restart, so `mvnw compile` is usually enough.
- **Test freeze** — still in force. When it lifts, `ROADMAP.md` 1.5 should cover what 1.1 and
  1.2 introduced: a supersession links old rule to new; a `VARIABLE` amount change records a
  **null** effect rather than zero; an `INCOME` commitment's effect is negated; a snapshot's
  `plannedCommittedTotal` is null when any instance amount is unknown; a recorded EMI moves a
  loan's balance and an unrecorded one does not.
- ~~**An unbacked card statement.**~~ **Answered 2026-10-04 — the user settles the card's items
  individually from the bank, and the card itself is not modelled.** The ₹10,567 statement is
  **exactly** the four commitments planned on HDFC Money back: Antropic ₹2,373 + MOM - Mobile
  ₹2,648 + Health Insurance ₹3,998 + EMI - Processing fees ₹1,548. Settling each as an EXPENSE
  **from HDFC Salary** records the one real movement of money - the ₹10,567 that left the bank -
  and is correct. **The rule to hold: never also record the ₹10,567 as a transfer into the card**,
  which is the only way this double-counts (`FIX_BACKLOG` 3.3). Consequence accepted by the user:
  the card stays at ₹0 owed and the statement never reconciles, which is fine while the balance
  is cleared in full every month. *Claude first advised moving two of these onto the card and was
  wrong - that is the other model, and the arithmetic above is what settled it.*
- **Superseded note, kept for the reasoning:** HDFC Money back showed `Rs 10,567 to pay` next to `Rs 0 owed`,
  because the statement was recorded with no transactions behind it. The model expects swipes
  to be recorded as expenses on the card, with the statement as the reconciliation. Decide
  whether an unpaid statement should count towards `outstanding` on its own — Claude leans
  **no** (it would double-count once charges are recorded), but the statement-only workflow
  then reads as nothing owed.
- ~~**Cash wallet** is typed `BANK` with `includeInSpendable: false` … deliberate or
  accidental?~~ **Answered 2026-10-03: the intent was real, the mechanism was wrong.** See
  `USAGE_ISSUES` **U4** and §1a-ii above. It holds **₹4,740**, not ₹17,000. **Waiting on the
  user to set it to "Yes - day to day"** — that is a write to their own data and theirs to make.

## Never verified

- **1.2's recording path has never executed.** No EMI has fallen due. On **5 October**, when
  the first three fall due: (a) before settling, the loan should say *"an EMI isn't recorded"*
  on Money → Debts and its balance should **not** have moved; (b) settling should drop the
  balance by the principal part and clear the warning; (c) settling for **more** than the EMI
  should take the surplus off the principal and pull the debt-free date in.
- **0.3 has no policy recorded.** The single most important check in ADR-0016 is that adding
  one leaves **net worth unchanged at −Rs 2,75,594.98**. Until a policy exists, `LoanCoverLink`
  on the Health Insurance loan page is also invisible.
- **Month Close's "Kept — N of M"** needs a cycle closed *after* 2026-09-21. Every
  already-closed cycle has null counts by design.
- **Goal payment schedules** (`GET /goals` shows `schedule: []`), **bank statement import**,
  and **a full month close** have never been exercised on real data.
- **Postman has no saved response examples** for the folders added this session
  (**Plan history**, **Insurance**), because nothing had run when they were written.

## DON'T DO

- **Don't run git.** The user runs every git command themselves (they are learning). Claude
  tracks state and *reminds*: uncommitted work, unpushed branch, unmerged branch, pending pull.
  Flow: `feature/<name>` or `bug/<name>` off `uat-release` → `uat-release` (UAT) → `main`.
  *(2026-09-21: Claude broke this — ran `git checkout -- postman/...` to undo a reformat of
  its own edit. Read-only `git status`/`diff`/`log` is how state gets tracked; nothing that writes.)*
- **Ask before touching any file** — same branch or a new one.
- **Don't write Flyway migrations or SQL unprompted.** V18 and V19 were each asked for
  explicitly. Collect pending schema under DEFERRED SCHEMA and ask.
- **Don't patch the schema by hand.** Flyway owns it (ADR-0003) — raw DDL outside a migration
  leaves the schema history disagreeing with the database, and the next migration collides.
- **Don't write or run tests** until the freeze lifts. `mvnw test-compile` is fine; compiling
  is not running.
- **Don't modify the user's real data.** Read-only GETs against `:8080` are fine; never create
  test rows (there is no SQL available to clean them up).
- **Don't do money arithmetic in the browser** (`FRONTEND_CONVENTIONS` §4 rule 2). Two
  pre-existing violations were found and fixed this session by moving the sum server-side.
  Ordering and comparison client-side are fine; producing a figure is not.
- Don't restart the Vite dev server unless asked (`npm run dev` in `frontend/finance-ui`).
- Don't cite superseded docs as truth (`DOC_INDEX.md`).
- Don't build anything on the "not yet" list in `ROADMAP.md`.

## How to verify without asking the user to retest

Headless Chrome over CDP, with every non-GET to `*/api/*` failed so real data is never
touched — see memory `reference-cdp-browser-check`. Used throughout this session to catch
things that compiled and type-checked but were wrong on screen: a "0 stopped" tie, a
superlative applied to two equal months, every unlock silently vanishing. **Screenshot after
building; the build passing is not evidence that it works.**

## Git state at handoff (2026-09-25)

- Branch **`feature/financial-os-reassessment-phase-3`**. Phase 1's work is committed —
  everything uncommitted is Phase 3.
- **24 uncommitted paths.** The user commits and pushes; Claude does not run git, not even to
  undo its own edit (that rule was broken once, on 2026-09-21).
- New files not yet tracked: `insight/CalmVoice.java`, `insight/InsightSilencer.java`,
  `insight/rules/GoalFundingUnclearRule.java`, `insight/rules/RateMismatchRule.java`,
  `V21__insight_state_dismissal.sql`.
- Backend and frontend both compile and build clean. The backend is **running** with V21
  applied; Spring DevTools restarts it on `mvnw compile` (wait on `/api/v1/health` with an
  until-loop, not `sleep`).

## DEFERRED SCHEMA

**One pending, asked for but not approved — do not write the migration without asking.**

```sql
-- FIX_BACKLOG 2.14 - when a holding's money becomes reachable.
ALTER TABLE investments ADD COLUMN matures_on DATE NULL;
```

Wanted 2026-10-03: the user is keeping **RD - Mom**'s ₹9,000 but stopping contributions, and it
is *"withdrawable after 3 years — that means Jan 2029"*. Nothing in the backend models that date
(`grep maturity|maturesOn|unlockDate|lockedUntil` → nothing). The destination already exists:
Ahead's money-unlock calendar, which today is built only from commitments ending
(`ForecastServiceImpl.unlocksFrom`). **Until the DDL is applied, do not add the `@Column`** —
`ddl-auto=validate` means the backend will not boot. The `note` field is the interim home.

V18-V23 were each asked for explicitly and are all applied. List any new pending schema change
here rather than writing a migration unprompted.

## Known bugs, found and deliberately left

- **`CommitmentServiceImpl.createFromInvestment` starts the bill in whatever cycle is
  *current*** (`cycleService.resolveCurrent().getStartDate()`, `dueDay = 1`). Adding the RD on
  21 Sept produced a bill starting **28 Aug** — a month the user is not using.
  `createFromLoan` gets this right by using the loan's own first due date. Either ask for the
  start month or default to the *next* cycle.
- **`PlanChanges` detects a supersession by matching `name` + `activeTo === dayBefore`.**
  Breaks if a bill is renamed in the same edit; collides when two bills share a name.
  `supersededSubjectId` (ADR-0015) is exact and should replace it.
- **An unknown path returns 500, not 404.** `GET /api/v1/users/me` (the real path is
  `/api/v1/me`) and `GET /api/v1/commitment-rules` (the real path is `/commitments` — the
  frontend service is *named* `commitmentRuleService` but calls `/commitments`) both do it.
  Related: **a GET to a POST-only route returns 500, not 405** —
  `HttpRequestMethodNotSupportedException` is unhandled in `GlobalExceptionHandler`. One
  `@ExceptionHandler` covers the family.
- **Stray empty cycles exist for 2029** (Aug and Sep) — harmless, probably from navigating
  far ahead.
- **`AddCommitmentSheet` and `AddGoalSheet` have no "why" field**; only editing does. The API
  accepts `reason` on create for both (ADR-0015).
- **`Must pay?` could move behind a "More" disclosure** on the commitment form — it defaults
  to *Yes*, which is right for nearly every bill.

---

*Everything below is the record. Read it for reasoning, not to decide what to do next.*

## What this session built (2026-09-21 to 22)

Phase 1.1, 1.2 and 1.3 of the roadmap, plus UI work the user asked for while using it.
Oldest first.

## Phase 1.1 — what was built (2026-09-21)

Branch `feature/financial-os-reassessment-phase-1`, cut from `uat-release` by the user.
Backend + API + migration + a frontend surface. **No tests** (freeze). **Running and
verified in use**: V18 applied, and the log recorded four real revisions on 2026-09-21 -
two card EMIs added (+Rs 2,648, +Rs 3,998, "Follows the loan"), the Claude subscription
paused (-Rs 2,373) and restarted. The sign convention and the reason field both work.

**ADR-0015** `docs/architecture/decisions/0015-plans-are-versioned.md` — the decision, and
the reasoning for *not* doing full temporal versioning of the plan entities. The short
version: `activeFrom`/`activeTo` already answers "what was this bill worth in March?"
correctly. What was missing is the **narrative** — what changed, when, why, and what it
cost — and a revision log gives that without making every read path in the system
time-aware.

**New package `com.finance.plan`:**

| File | What it is |
|---|---|
| `domain/PlanRevision` | The decision. Append-only; deliberately *not* an `AuditableEntity` — a deleted commitment keeps its history |
| `domain/PlanFieldChange` | One field that moved, with a plain-language label and a `PlanValueKind` |
| `domain/PlanSubjectType` / `PlanRevisionType` / `PlanValueKind` | COMMITMENT\|GOAL · CREATED/AMENDED/SUPERSEDED/PAUSED/RESUMED/ENDED/SYNCED · MONEY/DATE/NUMBER/TEXT/FLAG |
| `PlanChangeDraft` | What a service hands the recorder. Each `money`/`date`/`flag`/`text` call skips a field that did not actually move, so a service can offer every field it touched |
| `PlanRevisionRecorder` | The single write door. `Propagation.MANDATORY` — the plan and its record change in one transaction or not at all |
| `PlanRevisionRepository` / `Service` / `Impl` / `View` / `Mapper` / `Controller` | Read side |

**Endpoints** (Postman folder **Plan history**, asserted, no saved examples yet):
- `GET /api/v1/plan-revisions` — the whole log, newest first
- `GET /api/v1/plan-revisions?subjectType=&subjectId=` — every version of one plan line
- `GET /api/v1/plan-revisions/cycles/{cycleId}` — what changed this month

**Recorded on ten write paths.** `CommitmentServiceImpl`: create, createFromLoan,
createFromInvestment, update, archive, unarchive, delete, syncLoanBills, syncSourceBills.
`GoalServiceImpl`: create, update, archive, unarchive, delete.

**Decisions inside the implementation worth knowing:**

- **`monthlyEffect` is what makes this a financial record rather than an audit trail.**
  "Changed Jio bill" is a diff; "Changed Jio bill, +₹150/month" is a decision with a price.
  `CommitmentMonthlyCost` spreads quarterly/annual over the months they cover, and
  **negates `INCOME`** — positive always means "more money needed each month".
- **Null is unknown, never zero**, everywhere: a `VARIABLE` commitment's effect, a cycle's
  `netMonthlyEffect` when any one part is unknown, a snapshot's `plannedCommittedTotal`.
- **Labels live with the domain, not in the plan package.** The commitment package is the
  only thing that knows `activeTo` reads "Last payment".
- **Accounts and categories are logged by name, frozen at capture time.** "Paid from:
  4 → 7" tells a person nothing.
- **A supersession does not log its own start-date move.** Splitting a rule shifts
  `activeFrom` by mechanism, not by decision; logging it would describe the plumbing
  (`CommitmentPlanFields.startingOn`).
- **`SYNCED` exists so the log cannot lie either way.** A loan's EMI change really does
  change the bill, but it was decided at the loan — `userDecision: false` lets "what did I
  decide?" exclude it while "what changed?" keeps it.
- **`reason` is optional on `POST`/`PATCH` for commitments and goals**, and never demanded:
  a forced "why?" produces "." as an answer.
- **The chain between split rules lives in `plan_revisions`**, not as a column on
  `commitments` — the revision *is* the relationship, and storing it twice gives two places
  to disagree. `findForSubject` matches either side, so one query returns every version.
- **`CycleServiceImpl.close`** now captures `PlanAdherence` — planned vs actual committed
  totals, commitments planned vs **kept** (the North Star's operational form), and how many
  times the plan changed during the cycle. A `SKIPPED` optional bill is excluded from both
  sides; counting it would make every month look overspent.
- **`GoalServiceImpl` takes the recorder via `@Autowired(required = false)`**, matching the
  existing optional-setter pattern there, so `GoalPaceIntegrationTest`'s bare service still
  builds.

**Frontend (added the same day):**

| File | What it is |
|---|---|
| `types/plan.ts`, `services/planRevisionService.ts` | Plumbing; new `PlanRevision` cache tag |
| `features/month/components/PlanDecisions.tsx` | **"What you changed this month"** — the decisions, their field lines, the reason in the user's own quotes, and what each cost per month |
| `features/month/components/MonthBriefing.tsx` | **The tab strip on Months**, at the **bottom**, after the plan and day-to-day spending: *What's different · What you changed · Commitments kept*. It sat under the summary first; the user moved it down, and they were right — you come to Months to settle a bill, and three tabs of context between the numbers and the work interrupt that. It is background on the month, not work in it. Matches Money's register strip, but local state rather than routes — a route would fight the `?cycle=` parameter. **Every tab always renders something**, including its empty state; a clickable tab that shows nothing reads as a bug. `PlanChanges` and `PlanDecisions` moved out of `PlanZone` into it. **Not wrapped in `Divided`** — the strip carries its own hairline, and a second one above it reads as a mistake |
| `routes/MonthPage.tsx` → `Maybe` | **No hairline directly under the summary card.** It closes with its own edge, so a rule straight after reads as a double line. Whichever section is first goes undivided — Needs you on the current month, the plan on any other — hence the conditional wrapper rather than dropping one `Divided` |
| `features/plan/components/StoppedBills.tsx` | **Fixes a dead end found in use 2026-09-21:** stopping a bill made it *unreachable*. The plan lists a cycle's occurrences; a stopped rule generates none, so it had no row, appeared in no list, and could only be reached by typing an id into the URL that nothing told you. `getCommitmentRules` never sent `includeArchived` (the backend supported it all along). Now a **"N stopped"** toggle sits in THE PLAN header, opening a folded list with *Start it again* |
| `PlanChanges.tsx` → plan-start baseline | **The month the plan begins reports no differences.** Most bills start in it, so comparing it with the month before announced the whole plan as a change — true, and useless. Detected from the **bulk** of starting bills, not the earliest `activeFrom`: one bill dated a month early would otherwise move the baseline and bring the noise back (which is exactly what happened in testing — see the `createFromInvestment` note below) |
| `lib/dates.ts` → `ordinalDay` | Fixes a live bug: `${dueDay}th` rendered **"on the 2th"** on screen. Right for 21 days of 28, wrong for the rest; the teens are the trap (11th/12th/13th, not 11st/12nd/13rd) |
| **`ifSkipped` removed from the UI** | Input gone from Add/Edit; display gone from plan rows and both detail pages. In use it filled with restatements of the bill's own name ("TV + WiFi will not work"), and on plan rows it *outranked* Mandatory/Optional — the one word that says whether a row can wait. **The column, the API field and existing answers all stay**: `EditCommitmentSheet` now omits `ifSkipped` from its PATCH rather than sending `""`, because removing a field from a form must not delete data. Reversible by restoring the `FormRow` and the four display sites |
| `CommitmentFields.tsx` / `AddCommitmentSheet.tsx` | **Add-commitment form wording**, from the user reading it cold. `Amount` → **`Same every time?`** (it picks fixed-vs-varies; the *next* row is the amount, so two rows were called the same thing) with options reworded to answer the question. Info icons dropped from `Due on` (the 1–28 range moved inline, where it's needed), `Paid from` and the fixed/varies row — 8 icons down to 5. `First payment`'s hint rewritten to state the **consequence** rather than the mechanic: it now says to pick the month you're starting from even for a bill paid for years, because an earlier month silently creates an unpaid entry in every month since |
| `features/monthClose/components/CloseStep.tsx` | **"Kept — 14 of 14"** beside "Saved", plus planned-vs-actual committed spend. Closing the cycle is when "did I keep to my plan?" is actually asked. Renders nothing when the figures are null (a cycle closed before this existed) — "0 of 0 kept" would read as a month where everything was missed |
| `features/plan/components/EditCommitmentSheet.tsx` | **"Why the change"** — optional, at the point of the decision. Without it every revision would be `reason: null` forever |
| `commitmentRuleService` / `goalService` | All 12 mutations invalidate `PlanRevision`, or the log is stale the instant it's written |

**`PlanDecisions` does not replace `PlanChanges`, and that was a deliberate call.** They
answer different questions: `PlanChanges` is "why does *this month* look different from the
last", derived from the bills' own dates, and works for months that haven't happened yet;
`PlanDecisions` is "what did I *decide*, when, and what did it cost". An amendment that
moves no date is invisible to the first by construction.

**Known gaps in 1.1, honestly:**
- **Screenshotted and click-tested** on 2026-09-21 via the headless-Chrome CDP script
  (see memory `reference-cdp-browser-check`): the three tabs render, the empty states read
  correctly, and a "What's different" row navigates to `/commitment-rules/{id}`. The
  *change log* itself still has no rows — `GET /plan-revisions` returns an empty page,
  correctly: it starts from the moment the table existed and cannot be backfilled. Make one
  commitment edit to see that tab populated.
- **`CloseStep`'s new block needs a cycle closed *after* 2026-09-21 to show anything.**
  Every already-closed cycle has null counts by design, so it renders nothing there.
- **The "Commitments kept" tab shows two different facts by design.** A *closed* cycle reads
  its snapshot — the frozen permanent record. An *open* one reads live `planProgress`
  (`settledCount`/`totalCount`, already server-computed) and is labelled "Settled so far",
  because calling a running count "kept" would claim the month is over.
- **Plan-vs-actual shows no gap figure**, only planned · actual · a verdict word. Computing
  the difference client-side would break FRONTEND_CONVENTIONS §4 rule 2 (no money
  arithmetic on the frontend). If the gap is worth showing, add it to the snapshot
  response where the maths is `BigDecimal`.
- No saved Postman examples, because the app has never run.
- `PlanChanges` still detects a supersession by matching `name` + `activeTo === dayBefore`.
  That heuristic breaks if the bill is renamed in the same edit, and collides when two
  bills share a name. `supersededSubjectId` is now exact and should replace it — a real
  bug fix, left alone here because it changes existing behaviour and wants a browser.
- `AddCommitmentSheet` and `AddGoalSheet` have no "why" field yet; only editing does. The
  API accepts `reason` on create for both.
- **`CommitmentServiceImpl.createFromInvestment` starts the bill in whatever cycle is
  *current*** (`cycleService.resolveCurrent().getStartDate()`, `dueDay = 1`). Adding the RD
  on 21 Sep produced a bill starting **28 Aug** — a month the user isn't using, since they
  begin in October. `createFromLoan` gets this right (it uses the loan's own first due
  date). Either ask for the start month or default to the next cycle.
- Nothing yet *uses* `monthlyEffect` at the moment of the write — that is 0.4.
- Loan and card edits are not recorded as plan revisions. Their *bills* are (as `SYNCED`),
  which is the cash-flow truth, but "I renegotiated this loan" is not itself in the log.

---
---

## Phase 1.2 - what was built (2026-09-21)

**A loan's balance now moves on evidence, not on the calendar.** It used to advance on the
EMI's due date whether or not the money had left - `AmortisationCalculator` said so plainly:
*"There is no way to record a loan payment in the product."* `loan_payments` had existed
unused since V5.

**No migration** - the table, entity and repository were all already there.

| File | What changed |
|---|---|
| `LoanPaymentRecorder` (new) | Files a settled EMI against its period. `Propagation.MANDATORY`, so the settlement and its record are one fact. Never throws: recording is a *consequence* of settling a bill, and a loan whose dates don't line up must not stop the user marking their rent paid |
| `CommitmentInstanceServiceImpl.settle` | Writes a `LoanPayment` when a `LOAN`-sourced bill reaches `PAID`. Not on a part-payment - that hasn't cleared the period |
| `AmortisationCalculator` | `balanceAfterPayments` amortises by **what was actually paid**, so overpaying takes the surplus off the principal; `periodFor` maps a due date to its EMI number. A payment short of the interest leaves the balance flat rather than growing it - capitalising unpaid interest is a lender's rule we don't have |
| `LoanServiceImpl.toView` | Outstanding, EMIs left and repaid all derive from recorded payments. Adds `unrecordedEmis` + `oldestUnrecordedDue` |
| `LoanPaymentRepository` | Native query joining `transactions` for the paid amounts (the link is a plain column, not a mapped association - the alternative was a service dependency into transactions and a likely bean cycle). A soft-deleted transaction is excluded: its money no longer exists, so the period reads unrecorded again |
| `CreditCardServiceImpl` / `LoanSummary` | Both switched off `emisElapsed`; the summary uses one bulk query rather than one per loan |
| `DebtsNeedsALook` | New attention card, second in priority: while an EMI is unrecorded, the balance, EMIs left and payoff date are all still describing last month |

**Verified against real data:** every figure identical before and after the switch - Bike
Rs 1,77,276/37 left, Education Rs 42,170/14, Coding Ninjas Rs 65,344/15, Mobile Mom
Rs 12,601/5, Health Insurance Rs 42,701/12; summary Rs 14,545 bank + Rs 6,646 card,
Rs 4,11,164 still to pay. That was the point of doing it now: all five loans have a first
EMI of 5 or 7 **October** against a 14 Sep checkpoint, so zero EMIs had elapsed and the
rule change moved nothing. After 5 October it would not have been free.

**Decisions taken by the user (2026-09-21):** recorded payments *and* flag what's missing
(not silent); an overpayment counts against principal.

## Phase 1.3 - what was built (2026-09-21)

**The protection primitive.** Nothing in the product could record *being covered*: health
insurance existed only as a `LOAN` account, because the premium was financed on a card.
That records the debt correctly and says nothing about the policy behind it - the app knew
Rs 3,998 left every month and had no idea what it bought.

**`V19__insurance_policies.sql`** - one table, written with the user's explicit go-ahead.

| File | What it is |
|---|---|
| `insurance/domain/InsurancePolicy` | Cover, premium, renewal, insurer, who it covers. Almost every field nullable on purpose |
| `InsuranceType` / `PremiumFrequency` | HEALTH/LIFE/MOTOR/HOME/OTHER; MONTHLY/QUARTERLY/HALF_YEARLY/ANNUAL/ONE_OFF |
| `CoverStatus` | LAPSED / RENEWS_SOON / ACTIVE / **UNKNOWN** - derived, never stored |
| `InsurancePolicyService` + repo, mapper, controller, DTOs | Full CRUD, archive, soft delete, `GET /summary` |
| `CommitmentSource.INSURANCE` + `SourceBillSync.applyPolicy` | The premium is an ordinary bill that **follows the policy**, as an EMI follows its loan |

**ADR-0016** records the decisions a future maintainer might undo. The load-bearing one:

> **Cover is never an asset.** On a net worth of -Rs 2,75,595, adding one health policy's
> Rs 5,00,000 cover would flip the number positive while changing nothing about the
> position. It is money you would *not have to find*, not money you have.

**Where I differed from the roadmap:** it said "migrate the health-insurance-as-loan
record". We did not. That loan is a **real liability** - Rs 42,701 genuinely owed to HDFC -
and deleting it to tidy the model would erase a debt. The policy is an *addition*, linked
by `loan_id` with `ON DELETE SET NULL`, because cover outlives the instalments.

**Verified:** V19 applied on restart, `GET /insurance-policies` and `/summary` both live,
and **net worth still reads -Rs 2,75,594.98** - unchanged.

## Ahead page rebuilt (2026-09-21)

Prompted by the user reading it cold: the helper text was unintelligible, the "Money
freeing up" card repeated the single row beneath it, and "Month by month" had no clear
purpose.

**The root cause was a contradiction, not copy.** Ahead showed October as **Rs 18,870
flexible**; Months showed **Rs 4,107** - Rs 14,763 apart. The forecast reads only the plan
as written, so it cannot see amounts already given to this month's variable bills, and it
misses a goal-funded bill with no fixed amount entirely. The helper text existed to excuse
that gap. Fixed by removing the overlap and telling the truth about the rest:

- **The current month is no longer listed.** Months knows it better; `months.slice(1)`.
- **A month with unknown amounts shows "up to Rs X"**, not "Rs X". Committed can only grow,
  so the free figure is a ceiling. This is the honest version of the old caption.
- **The heading says what the page is** in one line, instead of defending itself.

**"Money freeing up"** now gives the total and its breakdown different weight: a single
unlock is one sentence ("Rs 2,648 a month, once HDFC - Credit card EMI ends in March 2027");
several get a headline figure with the list under a `GroupBand`.

**A pre-existing money-arithmetic violation was fixed on the way.** The unlock total was a
client-side `reduce` over amounts, which FRONTEND_CONVENTIONS §4 rule 2 forbids. It is now
`ForecastResult.unlockedMonthlyTotal`, summed server-side in `BigDecimal`.

**"Month by month"** now answers *is there room, and why is this month different?* - the
free figure is the row's headline, the makeup is detail beneath, and notes in words carry
the reason: an annual item falling due, a bill ending, the most room ahead, the tightest
month, bills with no amount yet.

**A superlative is only shown when it is unique.** October and December are both
Rs 18,870, and the first version called October "the tightest month ahead" - picking a
winner out of a tie.

**Then reconciled properly (same day).** `ForecastServiceImpl` now reads the real
occurrences where a cycle has them - the same rows Months reads - so the two screens give
the same answer. October: **in Rs 57,700, committed Rs 41,093, set aside Rs 12,500, free
Rs 4,107, 0 unknown** on both. Verified against `GET /cycles/3/shape`.

What a month owes is the **union** of two things, and getting that wrong broke it twice:

1. First attempt read *only* the occurrences when any existed. A future cycle row can exist
   with a **partial** set of them - generated before a bill was added - so February 2027
   silently lost the card EMI, and with it the March unlock. Every unlock vanished
   (`unlockedMonthlyTotal` went to 0).
2. First attempt before that read *only* the active rules, which missed the archived
   Anthropic bill whose October occurrence is still owed - a Rs 2,373 gap.

So: every active rule that falls due, **plus** anything with a real occurrence whose rule is
no longer active. The occurrence's own amount wins (that is where an estimate for a varying
bill lives); a `SKIPPED` occurrence is excluded, exactly as Months excludes it.

**Month by month now opens with the next month only**, the rest behind "Show 10 more" - the
next month is the one you can still act on, and eleven rows of context pushed the goals off
the screen.

## Card available credit fixed (2026-09-22)

The user spotted it: HDFC Money back read **Rs 1,31,000 available, 0% used** while carrying
Rs 55,302 of EMI principal on that same card - and a Rs 10,567 statement due.

`availableCredit` was `creditLimit - outstanding`, where `outstanding` is only the card
account's posting balance. EMIs converted onto a card are modelled as separate `LOAN`
accounts, so their balances never touched it. A lender blocks that principal against the
limit until it is repaid, so it is not credit you can spend.

Now `limit - outstanding - emiPrincipalBlocked`, with the blocked figure derived from
**recorded payments** (the same rule as the loan's own page, ROADMAP 1.2) so the two cannot
disagree. Shown as its own deduction on the card page rather than folded in silently.
Deliberately **not floored at zero** - over the limit is a real state, and "0 available"
would hide it.

Card now reads: limit Rs 1,31,000 - blocked Rs 55,302 = **Rs 75,698 available, 42% used**.

**Still open on that card:** the Rs 10,567 statement has no transactions behind it, so
`outstanding` is Rs 0 while a bill is genuinely due. The model expects swipes to be recorded
as expenses on the card, with the statement as the reconciliation. Worth deciding whether an
unbacked statement should count towards outstanding, or whether the user should record the
charges.

## Investments row overlap fixed (2026-09-22)

`LedgerRow` gives its action slot a fixed **5.5rem** column. `InvestmentRow` puts *two*
buttons in it (Edit + Value), which overflowed left and sat on top of the amount -
"Edit" printed across "Rs 5,000". `WorklistRow` had already hit this with its Skip +
Settle pair and passes `actionWidth="7.5rem"`; `InvestmentRow` passed nothing. Now it does.

Worth knowing for any future row with two actions: the default column fits one.

## What the 2026-09-20 reassessment session produced

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
- **`ROADMAP.md`** - honest state table, Phases 1-8 with impact assessment, the explicit
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
