# Continue here (rewritten 2026-09-23)

**This top block — down to the `---` — is the whole handoff contract. A session started
with the single word "continue" must be able to act on it with no other input.** Everything
below the rule is the record of how we got here: read it when you need the reasoning, not
before you start.

Read next: `FINANCIAL_OS.md` (what we're building), `ROADMAP.md` (what's next and why),
`SESSION_HANDOFF.md` (how to work with the user), `DOC_INDEX.md` (which docs are true).
Everything else under `docs/` is history unless `DOC_INDEX.md` lists it as living.

---

## NEXT ACTION

**Start ROADMAP Phase 3 - Attention + Opportunity, unified.** Branch
`feature/financial-os-reassessment-phase-2`, **still not pushed** (Phase 2 + the goal-pace
fix are all uncommitted).

| # | |
|---|---|
| 3.1 | New rules in the insight engine: idle cash, subscription drift, rate mismatch (saving at 6% while paying 22%), goal underfunded early |
| 3.2 | **Dismiss / snooze** - the `insight_state` columns already designed in ADR-0017. Needs **V21**, so ask before writing it |
| 3.3 | **A voice when healthy** - "nothing needs you; here's what moved" |
| 3.4 | Threshold crossings from 1.4 become first-class attention items |

**Exit:** something worth saying every week, and never said twice.

**Phase 2 is closed and goal pace is fixed (2026-09-24).** The blocker that stood in front of
Phase 3 is gone: the engine's existing goal rule no longer makes a false claim, so adding
four more rules on top of it is now safe.

## Goal pace - fixed 2026-09-24 (was the oldest known correctness bug)

**It measured the calendar, not the money.** Pace compared the share of the target saved
against the share of time gone since the goal was created. That called the emergency fund
`ON_TRACK` at 16.5% saved with 2.56% of the time gone - while it needed **Rs 15,182 a month
that exists nowhere in the plan** - purely because Rs 33,000 happened to be in the account on
the day the goal was made. And a goal added yesterday was *always* on track, because no time
had passed yet.

**It now measures funding against requirement.** `GoalServiceImpl.funding()` sums the bills
that actually pay into the goal; `pace()` compares that with `requiredPerMonth`. This is
exactly the test `GoalPace`'s own javadoc used to describe as "the better test… needs a bill
linked to its goal, which doesn't exist yet" - goal-funded bills (`CommitmentSource.GOAL`) do
exist now, so the note was stale rather than wrong.

**Three judgements inside it:**
- **Only bills that *fund* count.** A goal-linked bill settled as an EXPENSE is a payment the
  goal is *for* - a trip's bookings - and paying for the trip does not save for it.
- **One-off top-ups are excluded.** Money once is not money a month. Counting the Rs 17,000
  and Rs 30,000 EF top-ups as monthly funding made the EF look funded at Rs 47,000/month.
  The `isOneOff` rule moved to `CommitmentMonthlyCost` so the forecast and the goal engine
  share one definition rather than keeping a third copy (the frontend has one too).
- **A varying contribution makes the pace UNKNOWN, never a guess.** What goes in each month
  is then the user's decision, and no honest claim can be read off the plan (ADR-0006).
- **No tolerance.** Rs 10,000 against Rs 15,182 needed is not "roughly on track"; it is
  Rs 5,182 short, every month.

**Live now:** Bangalore trip **BEHIND** (needs Rs 12,000/mo, funded Rs 0) - Emergency fund
**UNKNOWN** (needs Rs 15,182/mo, one varying funding bill). Both were verified through the
API and on screen.

**User-visible:** the insight no longer says *"0% saved with 12% of the time gone"* - a fact
about the calendar that names nothing to change. It says **"Nothing is funding it yet.
Rs 12,000 a month reaches Rs 12,000 by 31 Oct."** The goal page gained a **"Going in a
month"** row beside "Set aside a month", so a goal can no longer state a requirement while
staying silent about whether anything meets it.

**Follow-ups this opened, none urgent:**
- A goal whose funding varies now produces **no insight at all** (`GoalBehindRule` fires only
  on BEHIND/OVERDUE). The EF - the user's most important goal - is therefore silent. A rule
  saying *"we can't tell whether X is on track; its contribution varies"* belongs in **3.1**.
- Planned one-off top-ups do **not** reduce `requiredPerMonth`. Correct for a *rate*, arguably
  wrong for *feasibility*: the Rs 47,000 of EF top-ups genuinely do shorten the road. Left
  alone deliberately - it is a pre-existing question, not something this change caused.
- ROADMAP **5.1 is now half done**; the remaining half is required/month against what is
  actually free, which needs the goal engine to read cash flow.

## Today-page motion (2026-09-24)

Asked for: "10-20% more perceived life, not 200% more animation." Built as **CSS only** -
no motion library. Framer Motion is ~50KB gzipped to do opacity and transform, which the
compositor already does without a React re-render, and this project's stack is deliberately
small.

- **Tokens in `index.css`** (`--motion-fast|normal|emphasis|stagger`, two easings) so no file
  invents timing. `DESIGN_SYSTEM.md` §10 now carries them.
- **`.reveal` / `.reveal-shell`** - opacity + 8px rise, delay via `--reveal-delay`. Opt-in
  everywhere: shared components (`StatementRow`, `LedgerRow`, `InsightRow`) take a
  `revealDelay` prop and animate only when given one, so Months and the Ledger are untouched.
- **`AnimatedCollapse`** - grid `0fr → 1fr`, not a measured pixel height. Nothing to re-measure
  when a figure wraps, and no jank.
- **Order:** shell 420ms → label → figure (+70ms) → day rate (+140ms) → summary rows 55ms
  apart → Needs you / Coming up (+600ms).
- **`useAnimatedMoney` was left exactly as it was.** It already animates *on change only*,
  never on mount - which is both the old rule and the user's §4.

**The design system said the opposite, and that was resolved rather than ignored.** §10 banned
"staggered card entrances". The request asked for a 55ms stagger. Those are different things -
one is cards announcing themselves, the other is an 8px rise you notice only by its absence -
so §10 was **revised, not repealed**, and now says which is which. A doc left contradicting
the code is the thing that rots.

**Accessibility:** the global `prefers-reduced-motion` reset already flattened durations. It
did **not** zero `animation-delay`, so a staggered element would have sat invisible behind
`both` for the length of its delay - motion reduced into a blank screen. Fixed, and verified
by emulating the setting: delays `0.66s → 0s`, nothing below full opacity.

**Verified on screen:** mid-flight sampling shows the cascade (`1.00, 1.00, 0.96, 0.00, 0.53,
0.00…` resolving to all `1.00`); the collapse transitions `0px → 263px`; the settled page is
pixel-identical to before, which is the point.

**Also touched, because §8 and §11 named them:** `Button` gained a 0.98 press, `LedgerRow`'s
chevron moves 2px on hover, the sidebar's Add control presses. All shared - flagged for the
user, easy to revert.

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

**Still open from that conversation:** the user also asked for a **toast** (top-right, ~5s,
dismissible) and **remove/dismiss** from the list. Neither is built. My advice on record:
`QUIET` may auto-fade but `HELD` must not; the Room delta belongs in the toast only and
**not** in the list, or the list becomes a second transaction log; and "remove" has to mean
*dismiss/snooze* recorded in `insight_state`, because the rules re-derive truth on every read
and a deleted row returns within seconds. Dismiss needs **V21** (two columns) and is
ROADMAP 3.2 pulled forward. The user has not answered those three questions.

**NEXT: verify it.** Everything below is the honest limit of what is known.

- Backend and frontend both compile and build clean; `mvnw test-compile` passes; the app
  boots with V20, so `ddl-auto=validate` accepted the entity; reads are unchanged
  (`/position` still ₹9,497 · Room ₹1,899.40) and carry no `effect` key.
- **No effect has ever been produced.** It needs a POST, which the sandbox blocks and which
  would write to real data. `insight_state` is empty.
- **Ask the user to record one small real expense**, then check: the response carries
  `effect`, `insight_state` gains rows, and a second identical write reports **no** started
  crossing — that last one is the whole feature, and is what would catch a broken diff.

**Expect on the very first write:** everything currently true is announced as though it just
started, because nothing was recorded before. Today that is exactly one insight
(`goal:6:pace`), so it is harmless — but it is also **the wrong warning**, see below.

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

## The user's October data fixes (still outstanding)

They start using Kosh for real on **28 September**, so these outrank features. **Two of the
four changed on 2026-09-22 — re-read before acting:**

- **The RD – Mom bill no longer exists.** The user deleted it (`plan_revisions`: `ENDED`,
  −₹1,000). October is not carrying a wrong ₹1,000, it is carrying **none**.
- **"RD settles as EXPENSE" cannot be fixed by editing the bill.** `SourceBillSync.java:149`
  sets it from the holding: no investment account means no destination, so `EXPENSE` is the
  only valid answer. The RD was added as "Outside the ledger". See the parked section above.
- **"Antropic claude subscription" is still archived** — Months → THE PLAN → "1 stopped" →
  *Start it again*, then rename to **Anthropic**.
- **Home Support ₹10,000 is categorised as Utilities** (should be Family Support) and category
  19 reads **"Emergenecy fund contribution"**. Both distort a baseline from month one.

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

- **One recorded expense**, so 1.4's effect path runs for the first time. Nothing else can
  verify it.
- **The two parked withdrawal decisions** (see PARKED above) — only when 1.4 is finished.
- **Migration freeze** — lifted three times, each explicitly and narrowly: `V18__plan_revisions.sql`,
  `V19__insurance_policies.sql`, and `V20__insight_state.sql` (2026-09-23, for 1.4 only).
  **Assume it is back on** and ask before writing another.
- **Test freeze** — still in force. When it lifts, `ROADMAP.md` 1.5 should cover what 1.1 and
  1.2 introduced: a supersession links old rule to new; a `VARIABLE` amount change records a
  **null** effect rather than zero; an `INCOME` commitment's effect is negated; a snapshot's
  `plannedCommittedTotal` is null when any instance amount is unknown; a recorded EMI moves a
  loan's balance and an unrecorded one does not.
- **An unbacked card statement.** HDFC Money back shows `Rs 10,567 to pay` next to `Rs 0 owed`,
  because the statement was recorded with no transactions behind it. The model expects swipes
  to be recorded as expenses on the card, with the statement as the reconciliation. Decide
  whether an unpaid statement should count towards `outstanding` on its own — Claude leans
  **no** (it would double-count once charges are recorded), but the statement-only workflow
  then reads as nothing owed.
- **Cash wallet** is typed `BANK` with `includeInSpendable: false`, holding Rs 17,000 of cash
  in hand. That is why October's Rs 17,000 emergency-fund top-up does not reduce what's free.
  Deliberate or accidental?

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

## Git state at handoff (2026-09-22)

- Branch **`feature/financial-os-reassessment-phase-1`**, cut from `uat-release` by the user.
- **116 uncommitted paths — 87 modified, 29 new.** Nothing has been committed across two
  sessions. The user commits and pushes; Claude does not run git. **They have asked to finish
  all of Phase 1 before pushing** — do not offer to commit partway.
- New and worth knowing about: `backend/.../com/finance/plan/`, `.../insurance/`,
  `V18__plan_revisions.sql`, `V19__insurance_policies.sql`, ADR-0015, ADR-0016,
  `frontend/.../features/cover/`, `MonthBriefing.tsx`, `PlanDecisions.tsx`,
  `StoppedBills.tsx`, `CoverPage.tsx`, `insuranceService.ts`, `planRevisionService.ts`.
- Backend and frontend both compile, lint and build clean. The backend is **running** with
  V18 and V19 applied; Spring DevTools restarts it on `mvnw compile`.

## DEFERRED SCHEMA

**Empty.** V18, V19 and V20 were each asked for explicitly and are all applied. List any new
pending schema change here rather than writing a migration unprompted.

## Known bugs, found and deliberately left

- **`CommitmentServiceImpl.createFromInvestment` starts the bill in whatever cycle is
  *current*** (`cycleService.resolveCurrent().getStartDate()`, `dueDay = 1`). Adding the RD on
  21 Sept produced a bill starting **28 Aug** — a month the user is not using.
  `createFromLoan` gets this right by using the loan's own first due date. Either ask for the
  start month or default to the *next* cycle.
- **`PlanChanges` detects a supersession by matching `name` + `activeTo === dayBefore`.**
  Breaks if a bill is renamed in the same edit; collides when two bills share a name.
  `supersededSubjectId` (ADR-0015) is exact and should replace it.
- **`GET /api/v1/users/me` returns 500**, not 404, for an unknown path. The real path is
  `/api/v1/me`.
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
