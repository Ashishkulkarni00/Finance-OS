# Continue here (rewritten 2026-11-09)

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

### 2026-11-11 — Today's top section redesigned from the user's brief (Sonnet): BUILT, review on phone
Everything above "Needs you" only (Needs you and below untouched). tsc + vite build pass; checked headless at
360/390/430 (light + dark) and a 1280 desktop. Not on a device.
- **Hero** (`SpendToday`): the figure at the new `display` size (64 phone / 56 at <=380px / 80 desktop) with a
  smaller **raised** rupee (`Amount` display role), caption in plain words - A "left to spend today", B "to spend
  each day until salary" (replaces "a day until salary on ..."), C "short until salary" - then the date with a
  calendar icon, "Day 15 of 31", and a slim month-progress rule (`cycleProgress().fraction`, dates only).
  Help icon on the figure's row. **No greeting, no illustration, no wordmark** (the brief forbids decoration;
  the user's reference image had them - deliberately not copied).
- **`SalaryPanel`** (new): one soft teal-wash panel - "17 days to salary", "due Sat, 28 Nov", then two stats:
  while there is room, Spent today / Today's share; once used, Today's share (used) / Below your usual (a day,
  only when recovery is STRETCHED). Short month: countdown only plus the "Nothing is blocked" line. No chevron
  (it goes nowhere). Server fields only: `daysToSalary`, cycle end, `roomToday`, `spentToday`, `perDayLess`.
- **`WhereYouStand`** (new, replaces `PositionStatement`, now deleted): a white card (hairline + soft shadow),
  rows with round washed marks in the app's domain hues (held = accent, reserved = `--goal`, committed =
  `--commit`, cards = `--debt`), deductions with a muted minus, hairline, then **Free until salary** on a teal
  band with the figure at hero size. Kept: below-zero accounts named under Held; "includes Rs X you could skip"
  under Committed; Owed on cards only when owed. Hints under each label are wide-screen only.
- The earlier tries at the date line (chips / gradient / orange) are gone; the per-account toggle and the "a day"
  row are gone. Plain-grey rule superseded: the date now lives in the hero's date row.
**Open:** the Today group header still truncates "Wednesday, November ..." (below, untouched).

### 2026-11-11 — Today: soft date chips, and the working on the page (Sonnet)
User: colour the day/date/days-to-salary softly; show held / reserved / committed on the landing page
instead of behind a tap. Built (tsc + vite build pass; checked headless, light and dark; not on a device):
- Under the figure: two `accent-wash` chips - "Wed, 11 Nov - day 15 of 31" and "17 days to salary"
  (`TodayPage` builds them; the second is `financialState.daysToSalary`).
- **The bottom sheet is gone.** `SpendToday` renders `PositionStatement` (bare, `compact` on phone = no notes
  column, dense rows, `caption="Where you stand"` with the "Show accounts and bills" toggle on that line):
  Held across accounts / - Reserved / - Committed / (- Owed on cards) / = Free until salary, then a closing
  "÷ 17 days to salary - a day Rs48" row (hidden when short). The recovery catch-up sentence moved to a
  caption under it. Per-account / per-bill lines are still one tap (the toggle), not a sheet.
- `PositionStatement` gained `compact` and `caption`; `Breakdown` is no longer used by Today.
**Note:** in state B the closing row repeats the hero's figure on purpose - it is the proof of it.

### 2026-11-11 — Today opens on the figure, in the title's place (Sonnet)
No "Today" title. The room figure is the first thing on the page (`display` size, now 64px phone / 80px
desktop), the help icon on its row (`corner`), the date + day count directly under it (`meta`), then the
sentence and the one-line working. `SpendToday` renders the `sr-only` `<h1>Today</h1>`; `TodayPage` has no
header (a welcome line shows above the figure only after setup). The desktop one-line subtitle was dropped.
tsc + vite build pass, checked headless on a phone viewport.

### 2026-11-11 — Two small follow-ups (Sonnet)
- Net worth is red again when negative (see below). Gotcha: `cn` only joins classes, so an explicit
  `text-ink` beats `emphasiseNegative`'s `text-critical`; pass ink only when positive.
- **Today's figure is bigger:** new `display` type step (`--text-display` 52px phone / 64px desktop, hero
  stays 32/40) and `Amount role="display"`, used only by `SpendToday`. Reuse it only for a page's one answer.

### 2026-11-11 — Money > Overview rebuilt in the same grammar (Sonnet): BUILT, user to review on phone

User: "apply same principles to the Money overview page". Same rules as Today/Month: no boxes, Ledger row
shape, one fact once, the figure then its working as ruled rows. tsc + vite build pass; checked headless
(light/dark, all five Money tabs). Not tried on a device.
- **Header:** `MoneyLayout` title row now carries each tab's help icon + add button (`TabToolbar` portals
  into `actionsSlot` via outlet context; falls back inline outside the layout). The row that held two
  small controls is gone on phone. A tab with two buttons (Cards) wraps them to their own right-aligned
  line instead of overflowing.
- **`NetWorthZone` rewritten:** Net worth, **red when negative - the user wanted it back** ("it immediately brings attention"; the
  ink version was reverted the same day; M1 in MOBILE_AUDIT is still open about whether investments belong in it), then Owned / - Owed as ruled
  rows (replaces the "owned - owed" sentence and the "How is X worked out?" Breakdown trigger). "Not counted:
  Rs2,23,384 held outside your accounts" now sits directly under the working. Then "In bank and cash" under a
  `SectionRule` as Held in N spendable accounts / - Set aside / Yours to move. The old "Held - 3 accounts"
  beside a register of four was `CashPosition` counting spendable accounts only; the label now says so.
- **Needs a look** (`NeedsALookZone`): tinted cards -> `LedgerRow` rows with a `RowMark`; names and both
  sentences wrap. **Cash & bank / The rest of your money:** card boxes removed, `SectionRule` headers,
  leading marks, notes wrap to two lines (`LedgerRow` `wrapMeta`, `MetaFacts` `wrap`).
- New shared `components/RowMark.tsx` (28px tinted mark; `NeedsYou` uses it too).
**Not done:** Cards, Debts, Investments and Insurance tabs still have their old boxed layouts (only the shared
header changed). Cash wallet shows a bank icon because the account is typed BANK in the data.

### 2026-11-11 — Month header, switcher and top figure reworked (Sonnet): BUILT, user to review on phone

User: Month's header, the month navigator and the clarity of what the top says; everything from
"Needs you" down is fine and untouched. Second round: "the Month heading should just be the current
month" and "the plan | so far toggle is not going well". tsc + vite build pass; checked headless
(light/dark; current, past, upcoming month; stepping back three months keeps name and body in step).
Not tried on a device.
- **`CycleSwitcher` is the page header** (renders the `<h1>`; `MonthPage` no longer has its own). The
  title is the month name in `text-page` ("November"; reads "Month: November" to screen readers; says
  "Month" while the cycle loads). Step buttons + the help button (`trailing` prop) sit on the title row.
  One line under: dates · This month/Past/Upcoming · day count, "Back to <current month>" on the right.
  Document title still comes from the route (`AppShell`), so nothing else depended on the old heading.
- `MonthHero` is the one top block at every width. **Hero = spent outside the plan** ("Everyday
  spending so far ₹14,580 of ₹15,971 this month leaves room for", bar, "91% of it used · 48% of the
  month gone") - the old hero read "Flexible ₹15,971" as money left when 91% was spent. The remainder
  is deliberately NOT printed (client subtraction; no server field).
- **Toggle removed.** `MonthHero` shows only the plan, as a ruled `Statement` under a small
  "How the month adds up": Comes in / - Committed / - Set aside / = Room for everyday spending (notes
  under rows on wide screens only). What actually moved is a new closed section, `MoneyInOutSection`
  ("What moved so far" / "What moved" for a past month; summary "₹X in - ₹Y out"), first among the
  closed sections at the bottom. Past/upcoming and negative/no-income months have no hero; the
  statement's last line is the answer, with its note under it.
- `MonthAnswer`: Past is one line ("Paid X of Y planned - n of m commitments settled", hidden when
  nothing was planned); Upcoming is one line ("15 payments planned - 2 still need an amount").
- Deleted `MonthShape.tsx`, `CycleInOut.tsx` (folded into MonthHero / MoneyInOutSection).
**Not done / for the user:** "Where day-to-day money went" (₹25,654) and the hero's spent (₹14,580) are
different server measures with no explanation on the page; August (past, nothing recorded) says "needs
your salary - add it in the plan below". Wording to confirm: "Everyday spending" (our word replacing
"Flexible").

### 2026-11-11 — Today rebuilt in the Ledger's grammar (Sonnet): BUILT, user to review on the phone

Implemented `design/TODAY_HERO_SPEC.md` steps 1-6. `tsc -b` + `vite build` pass; checked headless at
390x844, light and dark. **Not clicked through on a real device** (the headless run blocks writes).
- New: `components/DateRule.tsx`, `components/SectionRule.tsx`, `today/components/NeedsYou.tsx`,
  `today/components/TodayEntries.tsx`. `LedgerRow` gained `wrapPrimary`; `DayGroup` gained `sticky`
  (default true, so the Ledger is unchanged) and now renders through `DateRule`.
- Rewritten: `SpendToday` (no card, states A-D, one derivation line that opens the Breakdown),
  `BeforePayday` (DateRule groups + LedgerRows), `TodayPage` (order and rhythm).
- Deleted: `PositionTrio`, `TodayStatus`, `WayBack` (folded into NeedsYou / the Breakdown sheet).
- Needs-you count now equals the nav badge (the dated shortfall is no longer hidden from it).
- **Decision made on the user's "implement it":** state B shows `perDay` ("₹48 a day until
  salary") once today's share is used, not "-₹1,044".
**Open nits, not done:** Needs-you explanations are clamped to 2 lines so a few end in "..."
(spec §4.3; unclamp if the user dislikes it). The Today group's header line 2 ("Wednesday,
November ...") truncates when it has two trailing figures - same as the Ledger, left alone so the
Ledger stays identical. Add button still covers right-aligned amounts at the page end (audit V1).
**Next:** user checks on the phone; then MOBILE_AUDIT P-list / M1-M3 as they decide.
**Don't:** touch StandingPanel; add per-date totals in Before payday (client arithmetic); let a
Needs-you row tap run a `CONFIRM` action (it writes).

### 2026-11-11 — Fixed: Month switcher name didn't match the figures below it

User on phone: stepped back to September, the body showed September, the label said October.
**Cause:** RTK Query's `data` keeps the *previous* argument's result while a new one loads, so
the switcher's cycle (`useGetCycleQuery`) and each per-cycle zone lagged independently. Over the
phone's slower link they visibly disagreed. **Fix:** `currentData` everywhere a query is keyed
by cycle:
- `useSelectedCycle`: falls back to the just-resolved cycle for the name.
- `MonthPage`, `CycleInOut`, `FlexibleSpendingSection`, `MonthHero`, `MonthShape`,
  `PlanDecisions`, `MonthBriefing`, and Summary's `WhereItWent` month chips.
- Loading is now `isFetching && !currentData`.

Re-ran the CDP stepping script: label and body now always show the same month (or the body is
loading). **Rule for new code:** any query keyed by a cycle or month the user can switch uses
`currentData`, not `data`.

### 2026-11-11 — Fixed: Add on phone threw "crypto.randomUUID is not a function"

The phone opens the dev server over plain http on the LAN, which isn't a secure context, so
`crypto.randomUUID` doesn't exist there. New `lib/uuid.ts` `randomUuid()` falls back to
`crypto.getRandomValues`; it's used for the transaction Idempotency-Key (the only call site).
No other secure-context-only APIs in `src`. tsc + vite build pass. The user retests on the phone.

### 2026-11-11 — Mobile audit done, waiting on the user (no code touched)

User parked automation and asked for a detailed phone inspection. `design/MOBILE_AUDIT.md`:
- **Top risk is R1:** "what's left / owed / needs you" shows different numbers under
  different names on Today, Month and Money. Examples: Free ₹2,176 vs ₹2,751 vs Yours to move
  ₹4,776; Owed ₹3,07,071 vs Still to pay ₹3,68,782; badge 3 vs banner 2 vs "2 of 6".
- **R2 alarming headlines:** Money's net worth is −₹2.13L in red, but it excludes ₹2.23L of
  investments. The insurance premium is stored as ₹42,701/month, probably an annual figure;
  real data, not touched.
- **Others:** R3 the same alert in 3 places; R4 Ahead buried under More and titled "Goals";
  V1 the FAB covers right-aligned amounts.

Fix list P0-P4. **Waiting on:** M1-M3. **Next if the user says go:** P0 items 1 and 3 + the P3
craft pass need no decision and no schema. Verify with the CDP script (scratchpad
`mobile/audit.mjs` pattern, see memory reference_cdp_browser_check). **Don't:** edit the
insurance record (real data). Ask the user to correct it themselves.

### 2026-11-11 — Automation: SaaS options researched, waiting on the user (no code touched)

User: automation is **for the SaaS, not for them personally**. The personal Gmail-IMAP plan is
withdrawn. `AUTOMATION_PLAN.md` now compares the SaaS channels:
- **Account Aggregator:** needs RBI/SEBI/IRDAI/PFRDA regulation (e.g. SEBI RIA) or a partner
  FIU; per-fetch fees; Fold reports bad HDFC transaction IDs and no joint accounts.
- **Email forwarding address:** no licence; every bank and card.
- **Upload:** CSV already exists.
- **SMS:** stays a trap.
- **Pay-intent capture.**

Recommendation: launch on forwarding + upload, add AA later. Build one source-agnostic engine
(observations → commitment matching → Inbox). The engine is the moat.
**Waiting on:** S1-S4 (§8). S3 (build the engine now against the CSV upload) is the one that
would start work. **Don't:** start any channel adapter or parser before S1, or treat the
pricing/licence numbers as confirmed (they come from vendor blogs).

### 2026-11-11 — Today's Standing is now "Your standing" tiles (screenshot-verified, phone + desktop)

User asked for something other than the folded list. `StandingPanel` rewritten: always-visible
row of five tiles - If income stopped (opens runway basis in a Sheet), Owed (debt basis in a
Sheet), Usual month (→ /summary, hidden until a baseline exists), Flexible this month "whole
cycle, not what's left" (→ /month), Net worth (→ /money/accounts, in ink not red - the
2026-11-01 "nothing is making sense" lesson). Phone: horizontal `ScrollStrip`, snap with
`scroll-px-space-4`; desktop: 5-column grid. The open/closed state and its
`kosh.today.standing.open` key are gone; MetricRow/WhyLabel/Basis removed with the old layout.

### 2026-11-11 — Add form: no "Investment" type for new entries

User asked to drop it. `TransactionFormFields` filters INVESTMENT out of the type switch unless
the entry being edited already is one (so old investment entries still open and edit). SIP/RD
instalments are recorded via their commitment's "Record it" (settleAs INVESTMENT). Caveat told to
the user: a one-off lump sum can now only go in as a Transfer to the investment account, which
the Month "Invested" line does not count. Backend unchanged; Ledger filter still lists Investments.

### 2026-11-11 — Heroes come out of their cards on Month and Money (screenshot-verified)

User: Month and Money tops felt like "cards everywhere". **Rule now (phone):** a page's headline
figure sits on the ground, unboxed, with a hairline three-across `FactStrip`; cards are for
lists and the sections below. (Today's hero card and detail-page hero cards unchanged - not
raised.) Month: new `MonthHero` (phone only) = Flexible + pace + one strip with a
"The plan | So far" switch (plan: comes in / − committed / − set aside; so far: money in / out /
left over + "Every entry →") - replaces the two stacked cards; desktop keeps `MonthShape` +
`CycleInOut` (MonthShape's phone branch removed). Money: `m-card` removed from NetWorthZone and
the Debt/Investment/Cover/Cards standings; Net worth's "owned · owed" now sits straight under
the figure.

### 2026-11-11 — Month's "Coming up" now reads like the Ledger (screenshot-verified, phone + desktop)

User: liked the Ledger; asked for Month's sorting/organisation to match. `PlanZone` by-date view:
Ledger-style toolbar (segmented By date | By category chip, Categories icon, + Add), sticky
`PlanDayHeader` per date (day figure, weekday, "1 day overdue"/"in 16 days", rule, server
outstanding + "to pay"/"not settled"; amber when passed, accent today/tomorrow), rows lead with the
Ledger's `TypeMark` (exported from `TransactionRow`) instead of a `DateBlock`, secondary is
"Category · Must-pay/Optional". Income is no longer a block above the list: expected income sits
in its day (`ExpectedIncomeRow`), received income goes to Done (`ReceivedIncomeRow`); Done lists
both in date order. `IncomeBlock` removed. By-category view keeps GroupBands with a "Coming in" group.

### 2026-11-11 — Phone pass over every screen: cards everywhere (screenshot-verified, light + dark)

The phone layout rule now, so new screens follow it:
- **Worklist pages (Today, Month, Goals, Money › Overview):** title *above* a card -
  `<SectionHeader overCard>` + `.m-card` on the body.
- **Detail pages, Summary, Money's other tabs:** each section *is* a card with its title inside.
  Detail pages get it from CSS (`.detail-page > section`, `.detail-page > .detail-group > section`
  in index.css); Money tabs from `.divided > section`; Summary sections carry `m-card` themselves.
  Detail heroes (hero + FactStrip) are an `m-card` div on all six detail pages.
- Month's sum on phones: Flexible as the hero, pace bar, then Comes in / − Committed / − Set aside
  as ruled lines (`MonthShape` phone branch; desktop unchanged).
- Today › Before payday: payday's date group is a "Payday · Sat, 28 Nov — next month starts" band,
  because items due on payday belong to the next cycle.
- Skipped commitments no longer offer "Settle this" on their page.
- **CSS trap:** the zero-border re-asserts in index.css must out-rank the unlayered two-class
  hairline rules - single-class ones are doubled (`.max-md\:border-t-0.max-md\:border-t-0`).
- Seen, not fixed: Bike loan page says "Next EMI 5 Oct" while its schedule's next is 5 Dec (two
  due dates passed) - looks like a stale/wrong derived date; not a layout issue, worth a look.

### 2026-11-11 — Today's Standing panel restyled (screenshot-verified, phone + desktop)

`StandingPanel` `MetricRow` is now a self-contained block: label + figure on one line, the note
full width beneath (the old `display: contents` grid kept the note in the label's half-width
column, so on a phone one-line notes wrapped to four). Runway's bordered pill → plain
"up to 2.5 months". Each row draws its top rule, so Net worth's heavier rule no longer stacks on
a hairline. Labels/figures medium weight; Basis totals bold. `first:border-t-0` added to the
index.css zero-border re-assert list.

### 2026-11-11 — Skip any commitment for one month, with a reason (BUILT, DDL applied)

**Trap learned:** the backend runs under DevTools, so `mvnw compile` restarts the user's live
app - with a new `@Column` that means it goes down until the DDL is applied. Warn before compiling.
User asked 2026-11-11: "this month I am not doing Zerodha SIP, I want to skip it."
- Backend: `SkipReason` enum (MONEY_NEEDED_ELSEWHERE · NOT_NEEDED · PAID_ANOTHER_WAY · POSTPONED ·
  OTHER - no "cancelled": ending a commitment is a plan edit). `POST …/skip` takes optional
  `{reason, note}`; must-pay now skippable but needs `reason`; `sourceType=LOAN` refused (lender
  debits anyway); paid/linked still refused; unskip clears both. Reason/note on the list and
  detail responses. Old `skip(id)` kept as a default method (OptionalBillsIntegrationTest).
  `mvnw compile` + `test-compile` pass; tests not run. Postman: new request after "Skip an
  optional bill", 200 + 422 examples.
- Frontend: `features/month/skipReasons.ts` (labels + `canSkip`, mirrors the server rule);
  `SkipSheet` asks why every time (chips + optional note, note required for "Something else"),
  shows the freed amount and a must-pay's own "If skipped" line. **Skip lives only on the
  commitment's own page** (tap the row → "Skip this month" beside "Settle this") - the user
  didn't want it on the Month row beside Settle (2026-11-11). Done row reads "Skipped · Money
  needed elsewhere" with the note; the commitment page shows the reason too. Sheet opens with
  focus on the name (`data-autofocus`), so the phone keyboard doesn't cover the reasons.
- DDL applied by the user 2026-11-11; backend back up on the new code (GET shows `skipReason`).
  Sheet verified on screen; the skip write itself not yet exercised (writes blocked in checks).

### 2026-11-11 — Today on phones is cards, not prose (built, screenshot-verified light + dark)

User: "today page is looking like some wikipedia information". Phone only (`max-md`/`md:hidden`;
desktop unchanged): `.m-card` in index.css (white surface, hairline, 18px radius, phone only).
Hero card = label + "17 days to salary" chip, figure, one short line, then two list rows
("How it's worked out ›" opening the Breakdown, "Next salary +₹57,700"). `PositionTrio` is three
across with one-word labels on phones (positive state - not seen on real data, which is short).
Way back, Before payday and Standing each sit in a card under a rule-less title; Way back's
catch-up sentence is a one-line "Put back next month · ₹325 a month" chip.

Same day, every page's top summary went into a phone card: Month (the sum, and "So far this
cycle"), Ledger's fact strip, all five Money tabs' standing blocks, Summary's "Which way things are
moving". `SectionHeader overCard` = title above a card, rule only on wide screens. `FactStrip`
carries `fact-strip` so its rules run to the card edge. Emphasis: Month's Flexible in accent,
"Spent so far" figure and "Left over" bold, net worth's owned · owed line in ink medium, Summary
headlines medium. **Real bug fixed:** the unlayered retina hairline rule (index.css "Hairlines")
beat every `last:border-b-0` etc., so on actual phones the last row of every list drew a stray
line; the zero-width utilities in use are now re-asserted after it - a new `*-0` border variant
needs adding there too. That exposed a second bug: callers that wrap each `LedgerRow` in a div
(Transaction/Loan/Investment/Worklist/goal rows) made every row "last", erasing all dividers; the
wrappers now carry `.row-wrap` and index.css restores the rule on non-last wrappers.

Ledger's top totals (`StatedView`) now show only when the list is narrowed (category, account, type
or search) - the user: unfiltered they repeat Month. Filtered, they're the answer and exist nowhere else.

### 2026-11-10 — Mobile design pass (built, screenshot-verified at 390px, light + dark)

Reviewed every main route, the overlays and detail pages in headless Chrome at phone width
(scratch script, writes blocked). Fixed: `LedgerRow` has a dedicated phone layout (identity ·
name/secondary/one-line meta · figure with action under it; no chevron) - every register and the
Month worklist inherit it; `MetaFacts` collapses to "Dining · IDBI" in phone rows (`.row-compact`
in index.css); page subtitles hidden on phones; Ledger header actions icon-only, search full width
first; Month switcher one full-width control with the day count under it; `SectionHeader` /
`Disclosure` never break their titles; `FactStrip` goes three across for three facts; detail
headers reorder (name, identity line, then actions) and step the name down to 26px; Today's
shortfall state no longer repeats −₹ three times; Money tab toolbar right-aligned; Summary chart
shorter; goal % rounded. Not done: the Add FAB still overlaps the right edge of rows while
scrolling (by design - it never hides); Money's toolbar is still its own row under the tabs.

### 2026-11-10 — Month/Ledger polish + OPEN: skip a must-pay commitment, with a reason

Built (type-checks, not eyeballed): Ledger rows coloured by type (`TransactionRow.tsx` `TONE`);
Month page — "How the month adds up" moved up and always open, "Needs you" full width and
limit 2, the current-month "Still to pay" block removed (`MonthAnswer` keeps only the INCOMPLETE
blockers), Skip now opens `SkipSheet` (shows the amount it frees) instead of firing on one tap.

**DONE 2026-11-11 (see top entry) - was OPEN:** they want to skip *any* commitment for one month (e.g. petrol) and
flag why, with the money released. Today the backend refuses must-pay (`skip()` in
`CommitmentInstanceServiceImpl`, `INSTANCE_NOT_SKIPPABLE`) and stores no reason. If agreed:
`POST /commitment-instances/{id}/skip` takes `{reason, note?}`; loan-sourced instances stay
unskippable; DEFERRED SCHEMA `commitment_instance.skip_reason VARCHAR(30) NULL`,
`skip_note VARCHAR(200) NULL` (backend won't boot until applied). Reasons to offer: not needed
this month · paying another way · postponed · cancelled. Show the reason on the Done row.

### 2026-11-10 — Today polish (built, type-checks, not eyeballed in a browser)

User-requested: page `<h1>` bigger everywhere (`--text-page` 22→38px, phone 20→30px, tighter tracking, in
`index.css`); Today's three numbers redesigned as one visible sum — new
`features/today/components/PositionTrio.tsx` (free ÷ days = a day, replaces `FactStrip` there
only); the Needs-you status band and WayBack now `w-full` (they were capped at `--width-read`
while the shortfall note under a payment row was full width). Next: user eyeballs `/` at desktop
and phone width; if the bigger h1 crowds `DetailPage`'s back-button row, tune it there.

### ★ 2026-11-09 — now on `feature/complete-ui-ux-revamp`: complete UI revamp

The user asked for a complete UI/UX revamp on this branch. Brief: `design/UI_UX_REVAMP_BRIEF.md`
(analysis-first, backend untouched). **Plan: `design/UI_UX_REVAMP_PLAN.md` - Revision 2,
the final version for approval (user's review round done: Breakdown registry, pending-delete,
native `<dialog>`, notification tiers, capped-backoff connectivity, release gate G1, Part 12
manual acceptance checklist, dates fixed to Mon 9 Nov 2026, Kosh as the product name, Add
button always visible). Not approved, nothing built.** Found while revising: FIX_BACKLOG 1.15
was fixed in code 2026-11-07, but no runtime check is recorded - that is gate G1 (Part 11). User decision this session: **detail on demand** ("Rank the answer,
fold the proof, never lose it"), which revises DESIGN_SYSTEM §1 / UI_UX_PRINCIPLES §5.

- **IMPLEMENTATION STARTED 2026-11-09 (user: "start the implementation according our plan").**
  Appendix A decisions are unanswered, so the plan's defaults apply (Kosh; labels Ledger/Summary/
  Debts unchanged; Standing closed; pay day read-only; first close blocked by G1).
  - **Phase 1 (tokens & type v3) - code done, compiles (`tsc` + `vite build`), contrast
    script passes all pairs light+dark (`$TEMP/contrast.mjs`; one fix: `--attention-wash`
    -> #fdf6ec). NOT yet viewed in a browser (backend was down) - Part 12 T1/A1/A2 still owed.**
    **COLOURS REVISED 2026-11-09 (user): a mint-tinted ground and a beige ground were both rejected; the v2 neutrals (#FAFAF9 ground etc.) are RESTORED and kept. Freshness = highlights (plan §5.4a), not tinted backgrounds. Do not tint backgrounds again. Also added `--on-accent` (dark-mode buttons had white text on bright teal).**
    Changed: `index.css` (washes, info, shadows, `--surface-raised`, `--width-read/wide`,
    `text-page`/`text-sectiontitle`, dark tokens duplicated for `[data-theme]` forcing),
    `index.html` (pre-paint `kosh.theme` script, `viewport-fit=cover`), `lib/brand.ts` (`APP_NAME`),
    `SectionHeader` (sentence-case h2, `--line` rule), `Card` (softer edge), `Modal` title
    (no serif), `NavRail` (APP_NAME).
  - **Phase 1 ACCEPTED 2026-11-09** (backend up): tokens apply in light+dark on 8 pages, no console
    errors, no overflow at 1440; phone overflow is the known pre-Phase-3 gap.
  - **Phase 2 (overlays) built + browser-verified 2026-11-09:** `components/Sheet.tsx` (native
    `<dialog>`, side panel md+ / bottom sheet phone, drag handle, dirty guard auto-detected from
    input events + clicks on role=option/radio/switch/aria-pressed), `Dialog.tsx` (confirm; focus on
    Cancel; backdrop does nothing), `overlay/useModalDialog.ts`, `Breakdown.tsx` (native popover md+,
    Sheet on phone), `Modal.tsx` is now an alias of Sheet (25 call sites untouched), `lib/portalTarget.ts`
    (Select/InfoTip portal INTO the open dialog - the top layer hid them otherwise),
    `Statement` is container-responsive (notes fold under the row below 36rem), `useMediaQuery`.
    B1 wired on Today (`SpendToday` -> Breakdown{PositionStatement bare}); formula verified in
    `PositionServiceImpl:231`: real = held - reserved - committed - cardDues. Verified: Add/goal/loan/
    commitment/account sheets open, focus on first field, Tab never reaches a page element, Esc clean
    closes + restores focus, dirty Esc -> discard dialog, select-only edit counts as dirty, dropdown
    visible above sheet, Breakdown figures = server, Esc closes + focus returns.
    **Not done in Phase 2:** Drawer (built with Needs-you in Phase 5); B2-B5 wiring (Phases 5/7/10,
    each needs its backend check); HelpOverlay / HelpContextMenu still portal to body (fix in Phase 4);
    toasts sit under an open dialog (they appear after close; revisit in Phase 8 pending-delete).
    Real-device checks owed: iOS Safari for `<dialog>`/`popover`/`inert` (A8, user).
  - **Phase 3 (responsive shell) built, verified at 360/390/430/768/1024/1440:** `AppShell` (h-dvh, focus+title on route
    change, Suspense skeleton), `NavRail` (72px tablet / 232px desktop, Today badge = CRITICAL+ATTENTION only),
    `BottomBar` (+More sheet), `AddFab` (always visible, always Add transaction), `ConnectivityBanner` +
    `connectivitySlice` (2 failures -> banner, backoff 2/4/8/16/30s +-20%, paused when hidden, immediate on
    online/focus), `NotFoundPage`, `PageSkeleton`. **Connectivity retry timing and writes-disabled NOT yet tested
    (S2-S4 owed); per-figure stale marking waits for Phase 5/6.**
  - **OPEN: phone horizontal overflow inside `<main>` on /ledger (614px), /month (459), all /money tabs (421-434);
    Today/Goals/Summary/Needs-you/Help are clean at 390.** Cause not yet identified (was mid-probe). Fix in the page
    phases or sooner (Money tabs strip needs overflow-x-auto).
  - **Phase 1b "sleek pass" IMPLEMENTED 2026-11-09 (Sonnet), measured in headless Chrome.**
    Tokens (`index.css`): `--shadow-1/2/3`, `--scroll-thumb(-hover)`, type scale (hero 40/44 w500
    -0.025em, section 22/500, section-title 15/600, body 14/22, label 12.5/16, row 14/20 w500; phone
    hero 32, page 20), radii (md6 lg7 xl10 2xl14), scrim 32%, sheet radius 14, nav width 220, thin
    auto-hiding scrollbars (WebKit pseudo-elements; Firefox standard props; width 0 under
    `pointer: coarse`), `#app-main { scrollbar-gutter: stable }`, `.scroll-strip` + new
    `components/ScrollStrip.tsx` (edge fade only on the side with more content; used on the Money tabs,
    category heatmap, month figure table). Hairline block is **unlayered** at the END of index.css
    (the Tailwind utilities layer outranks `@layer base`; do not move it back).
    Components: Button 36/30 (44/36 under `pointer-coarse:`), Select field 36, FormRow 36, inline inputs 36,
    CycleSwitcher/Sheet/Breakdown icon buttons 32 (44 coarse), Select chip 28, Statement total rule 1px
    ink-soft + sentence-case labels, NavRail (34px items, 13.5px, 2px accent bar on the active item,
    wordmark 15/600), Sheet/Dialog use `--shadow-3`, popovers/menus/toasts `--shadow-2`.
    Sweeps: all 161 icon strokes 1.5 (5 small glyphs 1.75); 51 files' uppercase eyebrows -> `text-caption`;
    `border-ink`/`border-t-2`/`shadow-lg|xl`/bare `h-11` = 0.
    **Measured (1440, fine pointer):** sidebar 220, Add 34, nav item 34/13.5/400, hero 40/500/-1px, body
    14/22, section title 15/22/600, FormRow 36 (+rule), Save 36; coarse emulation: Save 44, close 44x44,
    scrollbar 0px. **K1 K2 K3 K4(code) K6 K7 pass. NOT verifiable headless: (a) the 0.5px hairline - even a
    plain `0.5px` border computes to 1px under CDP's emulated DSF; the rule is in the build and the media
    query matches - needs a retina/phone eyeball (K5/K8); (b) K8 the user's "fine and sleek" verdict.**
  - **Phase 3 finished the same session:** phone overflow FIXED on every page at 390 (LedgerRow is now a
    two-line flow below md and the grid from md up; page-header action groups wrap); connectivity
    verified: banner after the browser goes offline, probes back off ~2/4/7/19/29s (jitter), "Back online"
    on recovery; **writes are now refused in `baseQuery` while offline (code `OFFLINE`, nothing sent,
    sheet stays open with the entry and the reason)** - verified online vs offline. Per-figure stale marking
    ("as of 10:42" on the hero) is still owed (Phases 5/6).
  - **Regression after 1b:** p1 (8 pages x light/dark/phone, no errors), p2 (sheet behaviour), p3
    (Breakdown) all pass.
  - **Phase 4 (help consolidation) BUILT + verified 2026-11-09:** deleted 7 `*Primer`, 7 `*GuideSheet` and
    `components/PagePrimer.tsx` (15 files; their content already lived in the manual as each category's
    `how-*-works` hub topic - verified, not assumed). New `features/help/PageHelp.tsx`:
    `PageHelpButton topic=...` (32px icon, 44 on touch, opens the manual overlay at the page's topic) and
    `PageSubtitle` (the primer's headline sentence, permanent, 13px muted). Wired on Today, Month, Money >
    Overview, Debts, Investments, Goals, Ledger. `HelpOverlay` is now built on `Sheet` (native dialog:
    inert page, Esc, focus to the title and back to the `?`, animates); `HelpProvider` keeps it mounted so
    it can animate out. `HelpContextMenu` portals via `topLayerTarget()` so a right-click menu inside a
    sheet is visible. **Verified on 7 pages x 1440/390:** icon present, no "How X works" link, no primer
    close button, subtitle present, overlay opens at the right topic, Esc closes + `?help=` removed + focus
    back on the icon; menu inside the Add sheet is on top and "Read help" opens help above the sheet.
    Regression: p1 24/24 no errors, p2 sheets, overflow sweep 12/12 clean at 390.
    **Leftovers (harmless, not removed):** `help/retrofit.ts` `termsOf(..., onlyPrimer)` and the `primer`
    flag in `help/types.ts` are now unused by any page; delete them with the manual's next pass.
    The Cards / Insurance / Needs-you pages never had a primer, so they have no `?` yet (Phase 5/10).
  - **Sleek pass ACCEPTED by the user 2026-11-09 ("it does pass sleekness").** K8 closed.
  - **Phase 5 (Today + Needs-you panel) BUILT + verified 2026-11-09 against the live server:**
    * `routes/TodayPage.tsx` is one FULL-WIDTH column (user asked to expand it right as well; sentences, the status band and Way back are capped at `max-w-(--width-read)`; strip/Before payday/Standing span the page), LEFT-ALIGNED to the page edge (it was centred; the user noticed the extra left inset vs other pages, fixed - every page's content now starts at x=305 @1440; do NOT use `mx-auto` on reading columns): h1 + `PageHelpButton` + subtitle + date line;
      `SpendToday` (hero = roomLeft, sentence, progress rule, `FactStrip` Free until salary | Days to
      salary | A day from here, "How is X worked out?" -> Breakdown B1, "Then salary ... expected");
      `TodayStatus` (amber band naming the top urgent item + "and N more", opens the panel; red only
      for CRITICAL; or the all-clear line with its reason); `WayBack` (self-hides); Before payday
      (`BeforePayday` shows the first 5 rows + "Show all N", rows carrying a shortfall always show);
      `StandingPanel` CLOSED by default (the user's earlier "open by default" is superseded by plan 4.1).
      Old `InsightList` rail ("Also worth a look") removed from Today.
    * **Needs-you is a panel, not a page:** `features/attention/NeedsYouPanel.tsx` (on the new
      `components/Drawer.tsx`, a no-dirty-guard Sheet) mounted once in `AppShell`, driven by `?needs=1`
      (`lib/needsPanel.ts`, preserves other params). Polls 30s only while open and focused. Entry
      points verified: status band, nav badge (a real button beside the link; also in `BottomBar`),
      `/needs-you` (now `<Navigate to="/today?needs=1">`), `InsightList` "see all" on Month (opens it
      over /month), the toast fallback destination. Badge = CRITICAL+ATTENTION only (4 live = 4).
    * **Stale marking:** while `connectivity.offline` the hero loses its accent, prints "As of HH:MM. May
      be out of date.", the Breakdown carries the same line, and the Add form's affordability note is not
      asked (`TransactionFormFields`). `formatClock` added to `lib/dates.ts`.
    * New `components/FactStrip.tsx` (label over figure, hairline rules, 2x2 on a phone) - reuse it for
      Month/Money answer blocks (plan 5.8.6 #4).
    * Deleted: `NeedsYouPage`, `DayStatus`, `FreeUntilSalaryHero`, `CommitmentRulesSection`,
      `HistorySection`, `StandingZone`.
    * **Verified:** column 720px, hero 40px (32 on a phone), fact figures = API (3,168 / 19 / 167),
      Standing aria-expanded=false, breakdown opens/closes, panel opens/closes with `?needs=` added and
      removed, offline hero grey + stamp then restored, phone: no overflow, 2-column facts, badge opens
      the bottom sheet. Regression: p1 24/24, p2, p3, help (14/14), overflow 12/12.
    * **Not exercised (no data to):** "Show all" with more than 5 payments before payday (live data has
      exactly 5), the red CRITICAL band colour, an empty Needs-you list.
  - **Phase 6 (Add transaction) BUILT + verified 2026-11-09 (plan 4.3):**
    * `AddSheet` is a 440px side sheet (`Sheet size="narrow"`, new prop; full-width bottom sheet on a phone).
    * Type selector is a compact one-line segmented control (h-32, 40 on touch), labels only. **Colour
      change:** the red Expense / green Income tinting of the selector and the amount is REMOVED -
      DESIGN_SYSTEM 4 rule 3 and plan 5.4 say expenses are not red and income is not green; the old
      code comment called it deliberate but the binding docs forbid it. Amount is ink, 40px/500 (32 on a
      phone), also used by `SettleCommitmentSheet`.
    * New `features/transactions/addMemory.ts` (localStorage, try/catch, ids only): last account per
      entry type (applied on open and when the type changes, re-validated against live eligibility) and
      the last 4 categories per type, shown as chips under Category. Saved on every successful save.
    * Date row: Today / Yesterday chips + a native date input; `max` = local today.
    * **Save & add another** keeps the sheet open with type, account and date; clears the rest; prints a
      `role=status` line ("Recorded ₹180 · Lunch. Add the next one.") because the toast sits behind an
      open sheet; focuses the amount; `Sheet cleanToken` stops the discard guard asking over a blank form.
      **Ctrl/Cmd+Enter** saves + closes from anywhere in the form. Plain Enter still advances fields.
    * Phone bottom sheet publishes `--kb-inset` from `visualViewport` so the footer sits above the
      keyboard (`.sheet-panel { bottom: var(--kb-inset) }`) - **logic only; needs a real phone to confirm.**
    * **Real defect found + fixed: "today" was UTC in 8 places** (`todayIso` x4, onboarding x2, GoalFunding,
      SettleCommitmentSheet.shiftIso). Between 00:00 and 05:30 IST the Add form defaulted to yesterday and
      its `max` blocked today. All now use `todayLocalIso` / `shiftIsoDays` (`lib/dates.ts`).
    * "Towards a commitment?" is unchanged: it already appears (and only appears) when the server-side
      candidates for the chosen account/type exist; nothing is ever preselected (never guess).
    * **Verified (stubbed POST /transactions in-page, nothing written):** width 440, segmented 5 labels,
      amount 40px/500 ink and autofocused, remembered account + chips applied, Yesterday sets 2026-11-08,
      Income uses its own remembered account, Save & add another / Esc-on-blank / Ctrl+Enter all behave,
      remembered ids stored after save. Phone (touch emulation): segmented fits (68px each), buttons 44px,
      chips 36px, no overflow. Offline save still refused before sending. Regression: p1 24/24, sheets, p4.
    * **Not verified:** a real save end-to-end (needs the user: plan Part 12 N1/N2/N4), the keyboard
      inset on a real phone, the request body (stub artifact).
  - **Phase 7 (Month) BUILT + verified 2026-11-09 against the live server (plan 4.5, 4.13, 4.15):**
    * `routes/MonthPage.tsx`: full-width left-aligned page; h1 + help + subtitle + `CycleSwitcher` + a
      caption ("28 Oct – 27 Nov · day 13 of 31"). Order: `MonthAnswer` -> Needs you (max 3, the rest in
      the panel) -> `PlanZone` titled "Coming up" (current month) or "The plan" -> three CLOSED folds
      (How the month adds up = `MonthShape` + `CycleInOut`; Where day-to-day money went; About this
      month = `MonthBriefing`).
    * `MonthAnswer` replaces `MonthOverview` + `MonthCrux` + `CycleBand` (deleted). Current month hero =
      **`position.breakdown.committed` ("Still to pay before salary")**, then "N of M commitments
      done" + ProgressRule (integer ratio) + `FactStrip` (Free until salary | Paid so far | Days to
      salary) + two Breakdown links. **NEVER derive still-to-pay as plannedTotal - settledTotal: live,
      that is 5,594 vs the server's 5,100.** Past = "How the plan went"; upcoming = "Planned ahead".
    * **Breakdown B5 verified + shipped** ("What's in ₹5,100?"): server lines `needsYouTotal` 3,100 and
      `upcomingTotal` 2,000, server total `committed` 5,100 (they reconcile today; the UI prints the
      server's three numbers and adds nothing). B1 reused for Free until salary.
    * `PlanZone` split: `PlanRows.tsx` (rows, income block, bandDate) + `PlanZone.tsx` (orchestrator,
      293 lines). By-date view now lists only dates with something still to do (band = open count +
      the server's OUTSTANDING total for the date); **Done is a closed fold** (`Done · 14`, paid,
      received or skipped). By-category view keeps paid rows inline (a review lens). Header controls
      wrap on a phone; "Manage categories" is now "Categories"; the settled-progress text/rule moved
      into the answer block.
    * New `components/Disclosure.tsx` (persisted open state, children mount on first open) - reuse for
      every "detail on demand" fold. New `lib/releaseGates.ts`: **`MONTH_CLOSE_ENABLED = false`**; the
      "Close this month" card is not rendered until gate G1 (plan Part 11) passes. The `/month/close`
      route still exists. Flip the flag as the LAST step of G1.
    * Settle sheet copy fixed (plan 4.15): with `confirmedAmount > 0` it no longer says "link that entry
      instead"; it says what is already counted and offers linking only a further, unlinked payment.
      (Compiles; not exercised - needs a part-paid commitment past its due date.)
    * **Verified:** header/caption, hero 5,100 = API, "14 of 17" = API, facts 3,168 / 87,368 / 19, B5
      content, Needs-you 3 cards + "3 of 7 - see all", plan rows, Done 14 rows, all folds start closed and
      open to the right content, no close card (current/past/upcoming), past shows "How the plan went",
      upcoming hides day-to-day, phone: no overflow, 32px hero, 2-col facts. Regression: p1 24/24,
      overflow 12/12, help 14/14, sheets, Needs-you entry points.
    * **Not verified:** a real commitment settle/skip/edit from the new layout (writes - user, plan Part 12
      M3-M5), the part-paid settle copy, the by-category view after the refactor (compiled only).
  - **Phase 8 (Ledger + safe delete) BUILT + verified 2026-11-09/10 (plan 4.4, 6.6):**
    * **Pending-delete flow:** `features/ledger/pendingDelete.ts` (thunks `requestDelete` / `undoDelete` /
      `sendDelete` / `dismissDelete`, timers OUTSIDE React so they survive navigation) +
      `uiSlice.pendingDeletes` (`pending -> sending -> deleted | failed`) + `PendingDeleteHost` (bottom-
      centre toast; above the bar on a phone). Edit sheet's Delete opens a `Dialog` (alertdialog, focus
      on Cancel) -> the sheet closes -> the row stays visible, dimmed, struck through, "Deleting…" -> 6s
      Undo toast -> the request is sent ONLY when the window closes -> "Entry deleted." only after the
      server's 2xx (404 -> "That entry was already deleted."; other error -> row restored + Retry /
      Dismiss). Single-flight (a pending id refuses a second request; the mutation has a
      `fixedCacheKey`). No optimistic cache edit; figures refetch via the mutation's tags. Offline:
      the Delete button is disabled and `requestDelete` refuses. Tab close/reload inside the window:
      `beforeunload` prompt while pending or in flight; leaving cancels (nothing was sent). The
      Dialog's wording ("If it paid a commitment, that commitment shows as unpaid again") is TRUE:
      `TransactionServiceImpl.delete` soft-deletes and calls `settlementReleaser`. `TransactionResponse`
      has no commitment link, so the wording is generic by necessity (backend gap, not asked for).
    * **Verified (DELETE stubbed in-page, nothing removed from your data):** confirm dialog + Cancel;
      pending state with figures unchanged and 0 requests sent; Undo -> 0 requests after 8s; navigate
      to Today inside the window -> toast persists, exactly 1 request; success toast then cleared;
      500 -> failure toast + row restored + Retry -> 2nd request -> deleted; 404 wording; offline ->
      Delete disabled; reload inside the window -> `beforeunload` shown, after leaving the entry is
      untouched and 0 requests. (After the stubbed success the row reappears 5s later because the stub
      did not really delete - expected.)
    * **Ledger page:** h1 + help + subtitle + Import statement / Categories links; `StatedView` is now a
      `FactStrip` (Money out | Money in | Entries | Moved between your accounts) + one scope sentence
      (all server fields); `FilterBar`: period chips + Filters (n) button + search always visible,
      account/category/type in a collapsible row that opens by itself when the page arrives filtered;
      "Show older" -> "Load older". Filters remain in the URL (`useLedgerFilters`).
    * **Colour rule applied:** no red/green in the Ledger rows, type marks, amounts or day figures
      (arrows + a muted +/- say the direction). New phone fix: effect toasts now sit above the bottom
      bar / Add pill (`max-md:bottom-...`). baseQuery's offline message now says "Can't make changes".
    * **Verified:** facts = API (56,599 / 1,06,433 / 65 / 1,04,277), filters closed by default then
      open to 3 selects, `?category=` arrives open with "(1)" and "Clear filters", phone: no overflow,
      2-col facts, 28px chip row. Regression p1 24/24, overflow 12/12, sheets, Add form, offline refusal.
    * **Not done in Phase 8:** 4.4a Import stepper and 4.4b Categories sheet restyle (functional as-is,
      deferred to Phase 15 polish); the sticky compact header (5.8.6 #12) - day headers are still
      sticky; "Load older" is a button (no virtualisation, fine at 50/page).
  - **Phase 9 (detail-page template) BUILT + verified 2026-11-10 (plan 4.8, 4.16):**
    * New `components/detail/DetailPage.tsx`: `DetailPage` (full-width left-aligned `reveal-shell`, back
      link - "Back" when there is in-app history, else "Back to <parent>"), `DetailHeader` (h1 + chips +
      one identity line + actions), `DetailHero` (label / big figure / one sentence), `ArchivedNotice`
      (the undo for archive/stop: shown instead of the danger zone, with Unarchive / Start it again),
      `DangerZone` + `DangerItemProps` (Archive/Delete LAST, never in the header, each row says what will
      happen and asks again in a `Dialog`), `DetailLoading`, `DetailError` (a 404 reads "We couldn't
      find this <thing>. It may have been deleted." + a way back; other errors keep Retry).
    * Migrated all six: **Account** (hero balance + as-of; facts Available/Minimum/Opening; working
      folded; Archive/Delete in the danger zone), **Loan** (hero Outstanding today; sentence debt-free /
      EMIs left / repaid; facts EMI | Still to pay in all | Rate; Details + Schedule kept; Statement and
      Loan terms folded), **Credit card** (hero Owed now; facts limit / available / unbilled; Current
      bill stays primary; "The card" and Statements folded; **statement delete now uses a real Dialog
      instead of `window.confirm`**), **Goal** (hero Saved + progress bar; facts Target / Set aside a
      month / Going in a month; Payments, Funding, Saved-in kept; working folded; Archive/Delete in the
      zone), **Commitment** (hero Still to pay/arrive; facts Expected | Paid so far | Due; the primary
      action - Settle / Record / Confirm - moved from the page bottom into the header; the old "Back to
      Months" link is gone), **Commitment rule** (hero Amount; facts Recurs / Due / From; Stop it in the
      danger zone, Start it again via `ArchivedNotice`).
    * **Verified (live data, 1440 + 390):** every hero equals its API field (Cash wallet ₹80, HDFC loan
      ₹1,69,810, card ₹0, Emergency fund ₹71,735, commitment ₹0, rule ₹2,373); all six pages start at
      x=305 and are 1040 wide (same left edge as every other page); folds start closed; danger zone
      lists Archive/Delete on account and goal, Stop it on the rule; bad ids show the 404 wording for
      account and loan; Delete / Archive dialogs open as `alertdialog` with focus on Cancel and were
      cancelled (nothing archived or deleted); phone: no overflow on any of the six. Regression: p1
      24/24, overflow 12/12, help 14/14, sheets, Month, delete flow.
    * **Not exercised (would change data):** actually archiving / unarchiving / deleting an account or
      goal, stopping a rule, deleting a card statement, settling from the new commitment header button
      (user - plan Part 12 P2, M3).
    * **Known thin spots:** an account with nothing extra shows a one-fact strip (Opening balance only);
      `Cash wallet` has no Breakdown (not in the registry - correct). Account/Loan `Explained` InfoTips
      kept where the old page had them.
  - **Phase 10 (Money) BUILT + verified 2026-11-10 against the live server (plan 4.7, 4.7a-d):**
    * `MoneyLayout` now owns the page title (h1 "Money") and the tab strip; each tab starts with
      `features/money/components/TabToolbar` (one-sentence subtitle + `PageHelpButton` + the tab's own Add
      button) and then its answer. All tabs are full-width, left-aligned (x=305 @1440), no boxed panels.
    * **Overview:** `NetWorthZone` is now a hero (Net worth, -₹2,09,567) + sentence (owned / owed) + the
      server's debt-progress line from `/momentum` ONLY when direction is BETTER ("₹33,021 of principal
      repaid since 14 Sep.") + the existing "Approximate" and "Not included" notes + a `FactStrip` of
      the cash position (Held | Set aside | Yours to move | Owed on cards) + **Breakdown B4 shipped**:
      Owned / Owed / Net worth = the server's `totalAssets`, `totalLiabilities`, `netWorth`; verified in
      `PositionServiceImpl.currentNetWorth` (assets - liabilities) and live (97,503.90 - 3,07,070.91 =
      -2,09,567.01). Then `NeedsALookZone`, `CashBankRegister` (full list, unchanged) and the new
      `RegistersSummary` ("The rest of your money"): one `LedgerRow` each for Credit cards / Debts /
      Investments / Insurance (count, one status, the register's own total), each linking to its tab.
      Deleted `CardsSection`, `DebtsSection`, `InvestmentsRegister`.
    * **Cards:** hero Owed on credit cards + facts (Bills to pay | Credit available | Card EMIs a month);
      the card list stays; **Debit cards and "Credit card or debit card?" are closed `Disclosure`s**
      (the explanation still exists at the point of need, just not as two boxes on every visit).
    * **Debts:** `DebtStanding` = hero Leaving every month + facts (Still to pay in all | Inside a card bill
      | Loans); card EMIs are never added into the monthly figure (invariant 4). **Investments:**
      `InvestmentStanding` = hero Put to work so far + facts (Worth today | Grown by +₹/% | Ready if you
      need it | Growing for later); gain/loss is a sign and a word, NOT green/red; "Where it's put" is a
      closed fold. **Insurance:** `CoverStanding` = hero Covered for + facts (Costs you a month - blank,
      never ₹0, when a premium is unknown | Policies | Renewing soon | Lapsed).
    * **Verified (1440 + 390):** every tab's hero and facts contain the matching server figures (net
      worth, cash position, credit-cards, loan summary, investment summary, insurance summary); tabs
      highlight correctly; B4 popover = API; registers rows navigate (Investments row -> /money/investments);
      no overflow on any tab on a phone. Regression: p1 24/24, overflow 12/12, help 14/14, sheets,
      Needs-you, detail pages. Help topics for Cards (`cards.statements-and-paying`) and Insurance
      (`cover.what-cover-is`) exist.
    * **Not done in Phase 10:** the tab is still "Debts" (Appendix A #4 unanswered; rename is one label in
      `MoneyLayout` + the breadcrumbs "Debts" in `DetailPage` backLabel); `InvestmentsCheckIn` max-3
      and the `Divided` hairlines between sections on Debts/Investments/Insurance were left as they
      were; no Breakdown for the other tabs' totals (not in the registry - correct); the keep-an-eye
      "Needs a look" cards on each tab were not restyled.
  - **Phase 11 (Goals) BUILT + verified 2026-11-10 against the live server (plan 4.9):**
    * `routes/PlanPage.tsx` (route stays `/ahead`): full-width left-aligned `reveal-shell`; h1 "Goals" +
      `PageHelpButton goals.how-goals-works` + Add a goal + subtitle. Order: `GoalsSection` (goals with
      the server's feasibility verdict in its own words) -> "Money freeing up" (contextual headline, now
      section-size, not a second hero) -> a column of CLOSED `Disclosure`s: A common order for spare
      money (`SuggestedOrder`), Where the freed money could go (`UnlockChoices` - its
      `/decisions/unlock-options` call now runs only when opened), Got a lump sum? (`LumpSumPlanner`),
      Months ahead (the 12-month forecast; keeps "Show N more"). `AheadForecast` lost its `goals` slot
      and its intro block; it is now only the forecast pieces.
    * No money arithmetic or verdict logic was touched: the verdict wording, feasibility ordering and
      all figures are the server's.
    * **Verified:** header (h1, help, Add a goal, x=305, 1040 wide); 1 goal row = API; the verdict line is
      the API `reason` ("Needs ₹1,28,265 beyond what the plan puts in by 31 Aug 2027 ..."); freeing-up
      headline lists the API's two unlocks (MOM - Mobile 2,648; Health Insurance 3,998) with ₹6,646;
      all four folds start closed and open to the right content (5 steps = API 5, lump-sum input
      present, month rows + toggle); the goal row opens /goals/1; phone: no overflow. Regression: p1
      24/24, overflow 12/12, help 14/14, sheets, detail pages 6/6, Money tabs.
    * **Not exercised:** picking among several unlock chips with more than two unlocks, a lump-sum run
      (it calls a read-style POST that the harness blocks), an empty goals state.
  - **Phase 12 (Summary) BUILT + verified 2026-11-10 against the live server (plan 4.10):**
    * `routes/SummaryPage.tsx`: full-width left-aligned `reveal-shell`; h1 "Summary" (NOT renamed -
      Appendix A #2 unanswered) + subtitle; **the serif editorial headline and long intro are gone**; the
      thin-data note shows only under 3 recorded months (live data has 3, so it is hidden today).
      **No help icon: there is no manual topic for Summary and a `?` onto "still being written" is worse
      than none** (add a `summary.*` topic to `help/content` to get one).
    * **The 6-tile `SummaryTiles` grid is deleted** (DESIGN_SYSTEM 14), along with `StatTile` in
      `viz.tsx`. Each figure it carried is already in the sentence of its own section (owed / interest /
      clear-by date in Debt; this month vs same day last month in Month; committed share in Where the
      money goes); net worth lives on Money.
    * Order: Momentum strip ("Which way things are moving", words + arrows) -> four questions, each
      with its takeaway sentence ABOVE the chart: **Am I keeping more than I spend?** (`MonthByMonth`),
      **Where does the money go?** (`WhereItWent`), **Is debt going down?** (`DebtDown`), **Did the plan
      hold?** (`PlanKept`). Closed folds: "When each loan ends" (`PayoffTimeline`, inside Debt),
      "How each category moved" (`CategoryHeatmap`, its multi-month fetch now only on first open,
      its own header removed). Every "Show the figures" table is kept.
    * **Verified:** header (x=305, no tiles, no help icon); five section titles in order; momentum items
      3 = API 3 and every headline string present; 4 Recharts SVGs render; the debt sentence equals
      `/review/debt-trajectory` (₹3,07,071, 5 Oct 2029, ₹57,496 interest); the month sentence is the
      API's same-point comparison (₹9,902 more than by day 14); heatmap opens with 30 cells; payoff
      timeline opens with its SVGs; phone: no overflow. Regression: p1 24/24, overflow 12/12, help
      14/14, sheets.
    * **Not exercised:** the under-3-months thin note and the "no clear-by date" / "Not enough to draw
      the curve" empty states (live data has 3 months and complete loans).
  - **Phase 13 (Onboarding + Month close) BUILT + verified 2026-11-10 (plan 4.11, 4.6):**
    * New `components/StepProgress.tsx` (named steps: a row of names from tablet up, "Step N of 5 ·
      <name>" + a thin bar on a phone; `role=progressbar` with `aria-valuetext`). `StepDots` deleted.
    * **Onboarding** (`routes/OnboardingPage.tsx`, still outside `AppShell`): focus layout with its own
      wordmark; steps Pay day / Accounts / Income / Commitments / Set aside; a sticky foot strip
      (`features/onboarding/components/OnboardingStrip`) from step 2: Held − Set aside − Promised (− Owed on
      cards) = Free until salary, every figure from `/position` (never from the forms; INCOMPLETE shows
      the server's reason). The three inline `RealBalancePreview`s were removed (file deleted). The
      existing "I'll add this later" links now carry TRUE consequences: no accounts -> figures stay
      empty; no salary -> the month can't be set against income; no commitments -> "free" looks higher
      than it is; no set-asides -> that money counts as free. (The plan's wording "will read incomplete"
      was not true for these, so it was not used.) Finishing goes to `/today` with router state
      `{welcome:true}`; `TodayPage` shows ONE serif line ("Welcome to Kosh. Here is what you can spend
      today.") and clears the state, so refresh/Back does not repeat it.
    * **Month close:** `AppShell` has a focus mode for `/month/close` (no sidebar, bottom bar or Add pill, no
      bottom padding). `MonthClosePage`: Exit (X) + "Closing 28 Aug – 27 Sept" + `StepProgress`
      (Balances / Resolve / Review / What moved / Close) + a sticky Back/Continue bar. **`CloseStep` takes
      `enabled={MONTH_CLOSE_ENABLED}`: while the gate is off the last step says "Closing is switched off for
      now" and renders NO close button, so typing `/month/close` cannot close a month.** When the gate
      opens, the same step shows the original "Ready to close?" + Close button unchanged.
    * **Verified (writes blocked, 0 attempted):** close flow at 1440 through all five steps (no nav, no Add
      pill, titles/progress correct, Back and Exit work, no Close button, sticky bar); onboarding through
      all five steps (named progress, wordmark, no shell nav, strip "Held ₹18,269 − Set aside ₹10,001 −
      Promised ₹5,100 = Free until salary ₹3,168" = `/position`), landing on Today with the welcome line
      in Instrument Serif, gone after refresh; phone: no overflow on either flow, no bottom bar on close.
      Regression: p1 24/24, overflow 12/12, help 14/14, sheets, Today, Month.
    * **Not exercised:** onboarding on an EMPTY account (needs a dev database; the skip captions only render
      when a step has nothing), the Close button once the gate opens, a real close.
    * **G1 reminder for the user:** the close UI is finished, but stays switched off until the three gate
      steps in plan Part 11 are done (restart on a build containing the 1.15 fix, read-only check of
      `GET /review/months`, explicit approval). Flip `MONTH_CLOSE_ENABLED` in `lib/releaseGates.ts` last.
  - **Phase 14 (Settings) BUILT + verified 2026-11-10 (plan 4.17):**
    * `routes/SettingsPage.tsx` at `/settings` (inside `AppShell`; tab title "Settings · Kosh"): full-width
      left-aligned `reveal-shell`, sections capped at 34rem. **Your name** (`displayName`, `PATCH /me`
      via `useUpdateMeMutation`, Save disabled until changed, server error shown, "Saved." status;
      email shown read-only), **Appearance** (radiogroup: Match my device / Light / Dark -> new
      `lib/theme.ts`: `applyTheme` sets/removes `data-theme` on <html> and `localStorage kosh.theme`;
      read before first paint by the script in `index.html`), **Pay day** (read-only "The 28th of every
      month." + why it can't be edited yet - Appendix A #5 default), **What Kosh remembers on this
      device** (`clearRemembered()` removes every `kosh.*` localStorage key EXCEPT `kosh.theme`, after a
      `Dialog` confirm; reports how many were cleared).
    * Reachable from the sidebar footer (Settings above Help; icon-only on the tablet rail) and the
      phone's More sheet (Goals | Summary | Settings | Help; More lights up on /settings).
    * **Verified (PATCH /me stubbed in-page; the real name "Owner" was never changed):** title/h1/x=305; four
      sections; input = API `displayName`; Save disabled until edited then sent exactly 1 PATCH and showed
      "Saved."; theme: system -> `data-theme` absent and ground #FAFAF9; Dark -> attribute `dark`, stored,
      ground #0C0A09, SURVIVES RELOAD with Dark still selected; Light -> `light`; System -> attribute and
      key removed; pay day text = ordinal of `/me.cycleStartDay` (28th); reset dialog focus on Cancel,
      then removed 11 `kosh.*` keys including two test keys and KEPT `kosh.theme`; phone: More sheet
      lists Settings, page has no overflow. Regression: p1 24/24, overflow 12/12, help 14/14, sheets,
      onboarding/close flows.
    * **Not done:** editing the pay day (deliberately); a Settings help topic (no manual page exists, so no
      `?` icon); currency/timezone are not shown (they are fixed, INR / the user's zone).
  - **Phase 15 (Polish and audit) BUILT + verified 2026-11-10 (plan Part 9 row 15):**
    * **Contrast** (rendered walker over 14 routes x light+dark, incl. detail pages): fixed (a) the
      amber nav badge and solid StatusPill used white text on bright dark-mode fills (1.9-2.2:1) -> new
      `--on-solid` token (white in light, `#1c1917` in dark; Tailwind `text-on-solid`); (b) light
      `--attention` darkened `#b45309` -> `#a94d08` (5.0:1 on its own 8% tint, was 4.5); (c) `DateBlock`
      month label lost its `opacity-80`. **Result: no failing text left.** The only remaining reading is
      the *disabled* "Save name" button (exempt under WCAG). Decorative `aria-hidden` ₹ glyphs are
      excluded by design.
    * **Roles:** every route has exactly one h1 + one main, no unnamed buttons/links, no unlabeled
      inputs, all toggles carry `aria-expanded`; tab titles correct.
    * **Keyboard:** tabbed Today/Month/Ledger/Money/Summary/Help (13-54 stops each): every stop has a
      visible ring. **Fixed:** `Select` trigger had `outline-none` and no replacement (now uses the global
      ring; `row` variant offsets inward), Ledger search chip and Help search box now show
      `focus-within` border + ring. Add dialog and Needs-you: focus lands inside, 25-40 Tabs stay inside,
      Esc closes and focus returns to where it was.
    * **Layout:** 18 routes (incl. detail, Settings, Help, onboarding, close, 404) at 360/390/430 phone,
      200% (720px) and 400% (360x225): no page or `#app-main` sideways scroll (the only wide spans are
      truncated text inside `overflow-hidden`).
    * **Reduced motion:** zero elements animate or transition on Today/Month/Ledger/Money.
    * **Performance:** at 4x CPU throttle the first load settles in 1.8 s (Today), 3.2 s (Month), 2.9 s
      (Ledger). `vite build`: main chunk 588 kB (170 kB gz: React, router, RTK Query, shell); only
      `SummaryPage` (400 kB, Recharts) is over 250 kB and it is lazy and route-only. Nothing else > 85 kB.
      Possible later win: split the main chunk's RTK endpoints by feature - not worth it now.
    * **Regression:** p1 pages no errors, 0 console errors in all runs.
    * **Left as-is on purpose:** `help/retrofit.ts termsOf(onlyPrimer)` and the `primer` flag in help
      content (harmless, small); `Divided` wrappers on Debts/Investments/Insurance; InvestmentsCheckIn
      max-3; Import stepper (4.4a) and Categories sheet (4.4b) restyle; Money "Needs a look" card restyle.
      All cosmetic; none block release.
  - **USER-ONLY STEPS (cannot be done headless):** (1) eyeball the 0.5px hairlines on a retina screen / real
    phone (K5, K8); (2) iPhone Safari: dialog, popover and `inert` behaviour, keyboard avoiding the Add
    sheet; (3) real writes with the backend: archive, delete + undo, settle, save name; (4) onboarding on
    an empty account; (5) release gate G1 before enabling Month Close (restart, read-only check, your OK);
    (6) answer Appendix A: final name, Ledger/Summary renames, Debts -> Loans, pay-day editing.
  - **NEXT ACTION: the revamp is feature-complete.** Ask the user which they want: commit and merge
    `feature/complete-ui-ux-revamp` (they run git), the optional Phase 16 (keyboard go-to shortcuts, offline
    capture queue), or the Appendix A decisions. Do not start Phase 16 unprompted.
  - **Uncommitted** (user commits): everything above + the two design docs.
- **Waiting on the user:** start the backend (IntelliJ) for browser checks; Appendix A's 6 decisions, one at a time
  (Kosh final?; Ledger→Activity & Summary→Progress; Standing closed by default; Debts→Loans;
  pay day read-only; G1 checks + first close).
- **Next once approved:** Phase 1 (tokens & type v3, contrast-checked) → 2 (Sheet/Dialog/
  Drawer/Breakdown) → 3 (responsive shell) → 4 (help consolidation). Add the plan to
  DOC_INDEX §1 and rewrite DESIGN_SYSTEM as v3 at that point.
- **Uncommitted:** both docs above + this edit. `feature/month-summary` work - check
  whether the user committed/merged it before this branch was cut (`git log`).
- Everything below this block is the previous branch's record.

---

On branch **`feature/month-summary`**. Since 2026-11-08 the user works in **auto mode**:
decide and act, ask only when intervention is genuinely needed (git, real data, SQL/tests,
the open product decisions below).

### 0. State on 2026-11-09 - everything verified live; one approval and one commit pending

**Verified at runtime 2026-11-09** (the user's IntelliJ hot-reloads, so every fix below is live):
all eight new endpoints by read-only GET, and Ahead / Plan > Goals / Today / Needs you / Summary
by headless Chrome with writes blocked in-page (`$TEMP/kosh/cdp/check.mjs` pattern - note:
CDP `Fetch` interception broke Vite's dynamic imports, use `Page.addScriptToEvaluateOnNewDocument`
to wrap `fetch` instead; and match text case-insensitively, section headers are CSS-uppercased).

**Fixed during verification:**
- **FIX_BACKLOG 1.20 - auto-matched EMIs never reached their loan** (real bug, predates this
  work). `CommitmentAutoMatcher.link` now writes the payment row and the loan payment like
  manual settle. Backfill endpoint `POST /loans/{id}/reconcile-payments` built, **not run**.
- **Runway disagreed across screens** (Today 2.5 months vs new screens 1.9). One rule now:
  `RunwayCalculator.calculateAhead(cycle, resolver)`, used by financial-state, lump sum and
  suggested order.
- Unlock options: loans paid off before the money arrives, loans on their last EMI, and goals
  due before it are no longer offered.
- What changed: routine clears (bill paid, amount typed), flickers under 10 min, and warnings
  live again are filtered - 18 rows became the 4 that are news.
- Wording: suggested-order goals step ("Of 2 goals: 2 fit if things go as usual or better"),
  feasibility gives the per-month figure, WayBack's lone step reads "Spend a little less",
  1-month buffer counts as done when "at most" can't plausibly tip it.

**Waiting on the user:**
1. **Reconcile run 2026-11-09 for loans 1, 2, 5 (user approved those three).** 6 EMIs recorded
   (Bike needed a second pass - see below); re-runs return 0. Net worth −2,36,935 → **−2,15,314**,
   owed 3,34,442 → 3,12,821. Loans 6 and 7 reconciled too (user approved), 1 each. **Every loan now 0 unrecorded**; net worth **-2,09,564**, owed 3,07,071; Momentum debt = BETTER, "₹33,021 of principal repaid since 14 Sep". Nothing pending here.
   **Second bug found doing it:** `findTop6ByCommitmentIdAndUserIdOrderByDueDateDesc` returns
   *future* months for long-running bills once future cycles exist (stray 2029 cycles), so
   history read as empty. Replaced with `findTop6...AndDueDateLessThanEqual...` in both drift
   calculators (likely why 2.16 was only ever "verified silent"), the reconciler (all due), and
   the two instance-history views. `GoalServiceImpl:409` left (one-off booking bills).
2. **Commit** everything on `feature/month-summary` (`git status` lists ~65 files).
3. **Lift the schema freeze for 4.1 / 5.2 / 6.1?** DDL is under DEFERRED SCHEMA. Ask once.

**2026-11-09 - user decisions:** schema freeze stays (4.1 / 5.2 / 6.1 skipped until end of MVP).
**New target: improve the app's UI, screen by screen, starting with Today.** Done so far:
- Today: removed the dotted leaders from the Free until salary / ÷ days / a day from here
  breakdown (`SpendToday.tsx`, `<Statement leaders>` → `<Statement>`). User: "small faded line
  to its amount ... looking weird". `Statement` still supports `leaders`; nothing uses it now.
- Today > Before payday: removed the rule after each day heading ("tomorrow ────") in
  `BeforePayday.tsx`. Row borders kept.
- Today: top band's right track 28rem → 26rem to match the rail below (`SpendToday.tsx`,
  `TodayPage.tsx`) - measured: both dividers at x=929 (1440px) and x=801 (1280px).
- Today > Standing: open by default, "Hide" remembered per browser in localStorage
  (`kosh.today.standing.open`, try/catch). Closed label: "Show · this month, safety, what you owe".
- **Today done (user: "today seems fine"). Now: Ledger / add-transaction form.**
- Add form: per-type labels via `TRANSACTION_TYPES[].words` (`transactionForm.ts`) - Expense
  Spent on / Paid from; Income Received for / Received into; Transfer Reason / Move from / Move to;
  Investment Invested in / Paid from / Held in; Refund Refund of / Credited to. Help guide
  (`help/content/spending.ts`) updated to match.
- Today top-left warning card: explanation clamped to 2 lines (`InsightRow` new `clamp` prop,
  `line-clamp-2`, full text on hover; only `DayStatus` passes it). Measured 32px = 2 lines at
  1440px and 390px.
- Months top card, "So far this cycle": `Statement dense` (new prop, py-space-2 rows), Saved %
  folded into the Left over label, shorter footnote. Band height 260 → 187px; content left 149 /
  right 187 (was right 260).
- Needs you: `InsightList` new `limit` prop; Months passes `limit={2}`. The see-all link is
  semibold `text-attention` with → when items are hidden (everywhere, incl. Today), muted when
  the list is complete. Live: 2 cards, "2 of 7 — see all →" in #b45309.
- **Commitment add/edit simplified** (`CommitmentFields.tsx`, `PaymentMonthPicker.tsx`,
  `AddCommitmentSheet.tsx`, `EditCommitmentSheet.tsx`, `commitmentForm.ts`): "What" → Name;
  "Same every time?" + "How much" → one Amount row with Same/Changes every time chips; Starts =
  one dropdown "November 2026 · due 5 Nov"; Ends = one dropdown "Keeps going" / "March 2027 · 5
  payments" (`LastPaymentPicker`, frequency-aware); Category / Must pay / Note folded under
  "More details" (summary on the closed row); Add's "This time" only for changing amounts; Edit's
  "From when" + "Why" + apply note only after a plan field changes (`planChanged`: amount/type/
  frequency/day/accounts/start/end/link - not name/category/must-pay/note). Help content
  (monthly-plan, income, MonthGuideSheet) updated. Verified in headless Chrome: add form rows,
  chips toggle, fold opens; edit: rename keeps Why hidden, amount change shows From when + Why.
- Category moved back out of "More details" and **required for Payment and Income** (schema refine
  in `commitmentForm.ts`): settling a bill copies the commitment's category into the Ledger entry,
  and EXPENSE/INCOME entries require one server-side - without it the user was asked every month.
  Must pay stays folded (defaults Yes). Edit error labels renamed (Name, Amount). Note: zod object
  refines only run once base fields pass, so the category message appears after day/account.
- Money overview: "Approximate" line now judges LOAN accounts by the loan's own `confidence`
  (net worth reads derived loan outstanding since 1.5, not the account's opening balance) -
  6 names → 2 (Education loan, SIP - Zerodha), both genuinely estimated (`NetWorthZone.tsx`).
- Money > Needs a look shortfall card names the first *uncovered* payment and the shortfall:
  "IDBI Saving account won't cover Petrol on 27 Nov · Holds ₹3,912; by then it would be ₹1,188
  short" (was naming the covered ₹600 recharge) (`NeedsALookZone.tsx`).
- Investments: a ₹0 monthly contribution now means "stopped" everywhere - no "not in your plan"
  prompt (`InvestmentPlanPrompt`, `InvestmentsPage`, `InvestmentsCheckIn`, `billSources`), and the
  row reads "Monthly · Stopped" (`InvestmentRow`). RD - Mom: ₹9,000, stopped, withdrawable Jan 2029
  (still only in its note - `matures_on` is DEFERRED SCHEMA). Its "not valued yet" prompt is
  genuine: the user enters the RD statement value via Value.
- Money tab "Cover" renamed **Insurance**: route `/money/insurance` (`/money/cover` redirects),
  tab label, page eyebrow + title "What you're covered for", help category title and its
  "Open Insurance" links. "Cover for" (the sum assured) kept inside the policy form - that is
  the right insurance term there. Help category id stays `cover`.
- Goals page (/ahead) reordered: Money freeing up (headline + what ends) → Goals (header, primer,
  goals with verdicts, suggested order) → **Where the freed money could go** (chips pick which
  unlock) → Lump sum → Month by month. `AheadForecast` takes a `goals` slot (rendered on forecast
  loading/error too); `UnlockCalendar` split into summary + `UnlockChoices`. Feasibility verdict
  is now its own inset panel (bg-sunken, label line, sentence) under each goal. Order verified live.
- **Summary revamped** (dataviz skill followed; palette validated with its script, light+dark):
  new `--viz-1..5` + `--viz-seq-0..6` tokens in index.css (committed blue, day-to-day orange,
  invested aqua). `SummaryTiles` (6 stat tiles, committed-share meter) replaces `WhereYouStand`
  (deleted). Month by month = one stacked column chart (committed/day-to-day/invested vs income
  rule) + legend; `ColumnChart` tones now use `--viz-*`. `WhereItWent` rewritten: month chips,
  tall segmented bar of the month, ranked category bars split planned-bill vs day-to-day (new
  `GET /review/months/{id}/categories` hook). New `CategoryHeatmap` (category × month, sequential
  blue, store-based multi-month fetch). Debt down: statement + list replaced by `PayoffTimeline`
  (bar per loan to its last EMI on a shared year axis). Every table folded behind "Show the
  figures" (`viz.tsx` FiguresToggle). Verified by DOM measurement at 1280px (order, 30 heatmap
  cells, no overflow). Headless screenshots render blank on this machine - not usable.
  **Known app-wide gap:** below ~640px the nav rail still takes 240px (every page), not Summary-specific.
- **Recharts adopted** (`recharts@3.10.1`, pinned) - **ADR-0022** supersedes ADR-0021 §3 (Highcharts
  rejected: commercial licence; Kosh is meant to be sold). Month by month is now
  `InOutChart.tsx`: per month a "Came in" bar beside a stacked out bar (committed / day-to-day /
  invested, or one neutral "went out" for pre-plan months), unrecorded months skipped, y-axis
  ₹30K/₹1.2L ticks, custom tooltip printing only server strings (ADR-0022 §2). Verified live:
  bar heights 136/139/250px for In, tooltip on October shows all five figures. `ColumnChart` is
  now unused. Candidates for Recharts next: debt curve (`TrendLine`) if the user wants hover there.
- **All Summary plots now Recharts** (user: "everywhere ... highcharts no"): Month by month =
  Income | Expenses (committed/day-to-day/invested stack) | **Left after expenses** (can go
  below zero) - `InOutChart`; month split = `SplitBar`; categories = `CategoryBars`; debt =
  `DebtCurve` (area + payoff dots); loans = `PayoffTimeline` (horizontal bars to last EMI, year
  ticks). Shared hover card `ChartTooltip.tsx` (server strings only). Old `ColumnChart`,
  `TrendLine`, `chartScale` deleted. Heatmap stays hand-built. All 5 hover-tested live.
Headless screenshots render blank (CDP `captureScreenshot` on this machine) - verify UI by DOM
queries instead (`$TEMP/kosh/cdp/peek.mjs` pattern) until that's solved.

**Next if none of that is answered:** FIX_BACKLOG impossible-state family, or Phase 7.

### 1. ROADMAP 4.4 (unlock redirection) - first slice of the session

The user committed 1.5 / 1.19 / 2.16 / 4.2 in `570d818`. What is left in the tree is 4.4:

- **Backend** `decision/UnlockDecisionService`, `UnlockOption`, `dto/UnlockOptionResponse`,
  `DecisionController` - `GET /decisions/unlock-options?amount=&startsOn=`. No schema.
- **Fixed today, found by reading the live response:** interest saved was `EMI x count`
  on each path. The final payment is partial, so the faster path was overcharged by up to
  a whole EMI - IDBI showed **₹0 saved while clearing 8 months sooner**, Mobile Mom ₹0, Bike
  understated (₹21,755 vs ₹25,940), Fibe overstated (₹4,864 vs ₹4,309). Now
  `AmortisationCalculator.totalInterest` sums the real interest; corrected figures checked in
  jshell against the compiled class. Postman asserts a loan clearing sooner saves > ₹0.
- **Labels** are the loan's account name ("Mobile Mom"), not the lender - two loans were both
  "HDFC - Credit card".
- **`startsOn`** (new): an unlock in February is costed from February - each loan/goal carried
  forward at its own pace first; anything cleared by then drops out, including the ending
  loan itself (it was being offered as a home for its own freed EMI).
- **Frontend** `features/ahead/components/UnlockOptions.tsx`, wired into Ahead's *Money
  freeing up*: two registers (loan / goal) never merged into one ranking, "keep it" last.
  With several unlocks, each row is the switch. Also `AffordNote.tsx` (4.2 fix: number-vs-
  string stale check, and an error line instead of silence) and `mcp-server` tools
  `kosh_afford` / `kosh_unlock_options`.
- **State:** backend compiles, `tsc` + `vite build` clean. **The running backend (from the
  user's IntelliJ) is the pre-fix build** - it ignores `startsOn` and still shows the wrong
  savings. Needs a restart from IntelliJ, then: `GET /decisions/unlock-options?amount=2648&startsOn=2027-02-28`
  should not list Mobile Mom, and every loan with `clearsMonthsSooner > 0` saves > ₹0. Then
  click-check Ahead via the CDP script.

### 1b. "Build everything" run (user, 2026-11-08 night) - progress log, newest last

The user asked to complete every remaining roadmap item in auto mode, one go, writing this
handoff if the session runs out. Order chosen: 5.1 -> 4.3 -> 3.4 -> 6.2 -> 5.3 -> 6.4; the
schema-needing items (4.1, 5.2 allocation, 6.1) get DDL under DEFERRED SCHEMA instead.
**All of it compiles; none of it has run** (the backend in IntelliJ is the old build).

- ✅ **5.1 feasibility** - `goal/GoalFeasibility`, `GoalFeasibilityService`, `GET /goals/feasibility`.
  Free money = Real Balance (this month) / forecast `flexible` (later months) less usual spend
  (`SpendBaseline`). Goals judged by priority then date, each consuming its gap (5.2's contention,
  derived). Only a gap above the ceiling is `DOES_NOT_FIT`. UI: verdict line under each goal on
  Plan > Goals (`GoalsSection.tsx`). Postman added.
- ✅ **4.3 lump sum** - `decision/LumpSumService`, `LumpSumOption`, `LumpSumResult`,
  `GET /decisions/lump-sum?amount=`. Prepay (interest saved, months, EMI freed, runway after),
  goal (verdict before/after via `assessWith`), keep (runway). Invest = break-even rate only, no
  assumed return. UI: `features/ahead/components/LumpSumPlanner.tsx` on Ahead. Postman added.

- ✅ **3.4 What changed** - `insight/InsightChanges`, `GET /insights/changes`,
  `POST /insights/changes/{id}/acknowledge` (writes `dismissed_at` on cleared rows - no column).
  Flapping warnings collapse to one row with `occurrences`; `liveAgain` flagged. UI:
  `features/today/components/WhatChanged.tsx` on `/needs-you`. Postman added (filed in the
  Decisions folder by the insert helper - move to Insights when convenient).

- ✅ **6.2 recovery** - `recovery/RecoveryPlan`, `RecoveryService`, `RecoveryController`,
  `GET /recovery`. BROKEN (Real Balance < 0) / STRETCHED (less left than usual spend for the
  days remaining). Levers: defer optional (smallest that covers, else largest-first) ->
  release set-aside -> spend less per day; then catch-up months from future room above usual.
  Predicted on today's data: STRETCHED, gap ≈ ₹3,038 -> one SPEND_LESS step (~₹152/day under
  usual); RELEASE is offered only when BROKEN, so it never suggests the raid GOAL_RAIDED warns about. UI: `features/today/components/WayBack.tsx` at the top of Today's rail; silent
  when ON_COURSE. Postman added.

- ✅ **5.3 suggested order** - `goal/SuggestedOrderService`, `GET /goals/suggested-order`:
  1-month buffer -> debt ≥12% -> 3-month buffer -> dated goals -> cheap debt or investing.
  Statuses from runway, loans, feasibility; `current` = you are here. UI:
  `features/plan/components/SuggestedOrder.tsx` under Plan > Goals. Postman added.

- ✅ **6.4 month close closes the loop** - most of it already existed (ReviewStep: planned vs
  actual, didn't happen, skipped, differences, plan changes next month). Added: `CycleReview.carryOver()`
  / `carryOverCount()` (unpaid must-pay bills, null if one has no amount) on
  `GET /cycles/{id}/review`, and a "Closing the loop" band at the top of ReviewStep: kept N of M,
  and what carries into next month on top of its plan. Postman assertion added.

- ✅ **6.3 momentum** - `momentum/MomentumService`, `MomentumController`, `GET /momentum`; new
  derived query `CycleSnapshotRepository.findByUserIdOrderByCreatedAtAsc` (no schema). Directions:
  debt (UNKNOWN while EMIs unrecorded - on real data every loan has 2), next to finish, net worth
  and promises kept from the last two closed months (none closed yet -> UNKNOWN with the reason).
  UI: `features/summary/components/Momentum.tsx` on Summary under Where you stand. Postman added.

- ✅ **3.1 subscription drift** (as plan-amount drift) - `commitment/PlanAmountDrift`,
  `PlanAmountDriftCalculator`, `insight/rules/PlanAmountDriftRule`, `InsightType.PLAN_AMOUNT_DRIFT`
  (+ frontend union), `FinancialContext.planAmountDrifts`. Fixed bill, last two PAID payments
  both off the plan the same way by ≥5% and ≥₹50. More = ATTENTION (Today+Month), less = INFO
  (Month). `test-compile` passes. Idle cash still deliberately not built (see ROADMAP 3.1 note).

### 2. Still unverified at runtime (from earlier today)

- **`1.19`** `StrandedReservationRule` - to see it fire needs a ₹1 reservation on HDFC Salary
  (account 2) against archived goal 6, deleted after. **Needs the user's OK** (real data).
- **`2.16`** `PlanAccountDriftRule` - verified silent only. To see it fire without touching
  data: `MIN_CONSECUTIVE = 1` in `PlanAccountDriftCalculator`, restart, expect *Home Support*
  and *Emergency fund top-up*, set it back.

### 3. Open decisions — the user has not answered these; do not pick for them

- **May a closed cycle's figures change?** The only thing blocking `FIX_BACKLOG` **1.11**.
  `CommitmentBucketClassifier` reads the *planned* source, so an account's spendability
  checkbox silently restates a month's shape — and it is shared with `CycleReview`, which
  **recomputes live rather than reading `CycleSnapshot`**. If the answer is "no",
  `CycleReview` needs the snapshot before the classifier can move. *₹27,500 is
  **arithmetically correct** — the defect is that it moved retroactively, not that it is wrong.*
- **Commitment 43** (₹30,000 EF top-up) — **the user said "let it be" on 2026-10-03.**
  Parked, not pending. Do not raise it again unprompted.

### 4. Two things the data is saying right now, neither investigated

Both appeared on `/insights` after the 2026-11-08 restart and **neither has been looked at**:

- **`GOAL_RAIDED` — ₹10,001 came back out of Emergency fund** this cycle, with no plan asking
  for it.
- **`SHORTFALL` — IDBI won't cover Petrol on 27 Nov.** The IDBI problem has *moved*, not gone:
  it was Coding Ninjas on 5 Nov, now it is the end of the month. Same account, same cause —
  the money lives in HDFC Salary. This is the third month running. **Read the live projection
  before repeating the warning**; re-raising a solved problem is how a product teaches people
  to ignore it.

### 5. What to pick next (after 4.4 is verified)

1. **4.3 prepay vs save vs invest** waits on 5.1 (goal engine reading cash flow). 4.1 (remember
   the decision) is blocked by the migration freeze. So Phase 4's next buildable piece is
   **5.1's cash-flow reading**, or -
2. the rest of the impossible-state family `1.18` opened (bank below zero that isn't an
   overdraft, a bill settled for many times its plan, a goal over target) - small, no schema.
3. Look at the two live insights in section 4 first if the user is in the app that day.

### 6. Standing agreements that bit this session

- **The user runs every git command.** Claude tracks read-only and reminds.
- **No migrations, no SQL, no tests.** Both rules built this week were designed around it —
  derived insights, no schema, so the backend boots unchanged.
- **Never write to real data without asking.** Asked and granted twice on 2026-11-04/07: the
  ₹12,000 Myntra correction, and a ₹1 card overpayment to prove `CardCreditBalanceRule` fires,
  deleted immediately after. Both confirmed back to a clean state.

### Where a problem found in real use goes

**`product/USAGE_ISSUES.md`** — the product behaved correctly and the experience was still wrong.
`FIX_BACKLOG` is defects and missing capability. Cross-reference, never copy. **Do not fix
`USAGE_ISSUES` entries piecemeal** — they are solved in one considered pass, at the user's own
instruction.

---

## 2026-11-07 — The plan learns where the money actually goes (`FIX_BACKLOG` 2.16)

**Why.** *Clothes shopping* (₹12,000, Myntra) is planned from HDFC Salary and actually goes on
the HDFC Money back card. In October that mis-booked ₹12,000 of card spending against the
bank; in November it happened again and was only caught because the card ended up ₹12,411 in
credit. The product watched the same mistake twice and said nothing — while
`CommitmentInstanceView.settledFromAccount` ("where the money actually left from, when that is
not the bill's own account") was computed and displayed on screen the whole time, and never
reasoned about.

**Built**

- `commitment/PlanAccountDrift.java` — the finding: bill, both accounts, run length, last date.
- `commitment/PlanAccountDriftCalculator.java` — `@Component`, in the
  `GoalWithdrawalCalculator` mould so rules stay pure and never query. One existing
  `findTop6ByCommitmentIdAndUserIdOrderByDueDateDesc` per bill, bounded by the cycle's own
  commitments, then **one** batched `settlementFactsByIds` for every payment behind them.
- `insight/rules/PlanAccountDriftRule.java` — ATTENTION, undated, no rupee impact, so it can
  never outrank a bill about to bounce.
- `InsightType.PLAN_ACCOUNT_DRIFT` + the frontend union member.
- `FinancialContext.planAccountDrifts`, wired in `InsightService.buildContext`.

**Three decisions worth keeping**

- **Two in a row, never one.** The Settle sheet allows any account deliberately — *"Paid from
  is the plan, not a record"* — so a bill paid elsewhere once is ordinary. A warning on a
  one-off is noise, and noise is how a reader learns to skip the warning that matters. Paying
  from the planned account breaks the run, so correcting course clears the finding rather than
  leaving a standing accusation — the principle `GoalWithdrawalCalculator` applies by netting
  deposits against withdrawals.
- **The action opens the plan, it does not rewrite it.** Changing where a bill is paid from is
  a plan revision (ADR-0015) and belongs to the user on the page that records it, not to a
  button inside a warning. The engine suggests; the user acts.
- **A settled instance with no readable payment breaks the run.** Unknown is not agreement,
  the same way null is never zero.

**Found while wiring it:** `buildContext` was calling `instanceService.listForCycle` twice —
the cycle's whole worklist, the most expensive read in the insight context. Now read once and
shared.

---

## 2026-11-07 — `PlanAdherence` no longer counts a salary as a promise kept (`FIX_BACKLOG` 1.15)

Fixed **before any cycle was closed**, which was the entire reason it had a deadline: `close`
writes into `CycleSnapshot`, which is immutable.

**The real defect was where the filter lived.** `ReviewServiceImpl` had its own `billsOnly`,
so Summary read the right figure while `CycleServiceImpl.close` called the unfiltered
`PlanAdherence.from`. Two places had to remember the same rule and only one did.

- `PlanAdherence.billsOnly(instances, commitments)` is now the single implementation, and
  `PlanAdherence.from` **requires** the commitments — there is no overload that skips the
  filter, so the unfiltered call does not compile and a later caller cannot reintroduce the
  bug by forgetting it.
- `CycleServiceImpl` gained `CommitmentRepository` (a repository, not a service — no bean
  cycle through `PositionService`).
- `ReviewServiceImpl.billsOnly` delegates; its local income-id set and `java.util.Set` import
  are gone. `MonthReview`'s javadoc no longer calls the defect open.

**Verified by what did *not* change.** Summary was already filtering, so the correct outcome
was identical figures. `/review/months` before and after the restart: **4 months compared, 0
differences** — 28 Sept–27 Oct still 16 of 16 / ₹67,022, 28 Oct–27 Nov still 13 of 17 /
₹92,962. The filter moved; behaviour did not.

---

## 2026-11-05 — `CardCreditBalanceRule`: the first impossible-state check (`FIX_BACKLOG` 1.18)

A credit card cannot owe you money. On 2026-11-04 this user's card sat at **+₹12,411** for
hours — paid ₹21,430 against ₹9,019 of recorded charges — and Money, Cards and the Pulse all
reported it calmly while net worth counted it as an asset.

`CreditCardView.outstanding()` is already `-balance(card)`, so the test is
`outstanding().signum() < 0`. No schema, no query, no new endpoint.

**Observed firing on real data 2026-11-07**, with a ₹1 overpayment the user approved and which
was deleted immediately after:

> **HDFC Money back is ₹1 in credit** · ATTENTION · impact ₹1 · action *Open card* → `/cards/15`
> *"The card has been paid ₹1 more than the charges recorded on it. Usually that means a
> purchase hasn't been entered yet — a bill often covers things bought before you started
> recording them. It can also be a refund, or a payment larger than the bill. Until it is one
> or the other, this ₹1 is counted as money you have."*

Cleanup confirmed: transaction deleted, card ₹0.00, insight gone, HDFC Salary untouched.

**Worded "nearly always", not "impossible", deliberately.** A card really can sit in credit —
overpay, or take a refund after paying — so it names both causes and leads with the likelier.
Telling someone their refund is an error is how a warning gets dismissed, and the dismissal
would carry to the case that matters.

**The family this opens** is the point: the product had no concept of a figure that *cannot be
true*, only of one that is concerning. Next in it — a bank account below zero that is not an
overdraft, a bill settled for many times its plan, a goal holding more than its target.

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

**APPLIED BY HAND 2026-11-11** (the `@Column`s `CommitmentInstance.skipReason/skipNote` need it).
Because it was applied by hand, the eventual Flyway
migration (would be V24) must not re-add these columns - MySQL 8.0 has no `ADD COLUMN IF NOT EXISTS`.

```sql
ALTER TABLE commitment_instances
  ADD COLUMN skip_reason VARCHAR(30)  NULL,
  ADD COLUMN skip_note   VARCHAR(200) NULL;
```

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

**Three more designed 2026-11-08 (the "build everything" run) - also not approved, also do not
write without asking.** Each is the one table its roadmap item cannot do without; everything
derivable around them is already built. No `@Entity` exists for any of them yet, so the backend
still boots.

```sql
-- ROADMAP 4.1 - remember which option a decision took, and whether it was followed through.
-- Written by the decision screens (afford / unlock / lump sum) when the user picks; read by
-- Momentum ("you chose to prepay Fibe in Nov - done") and month close.
CREATE TABLE decision (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT       NOT NULL,
  kind          VARCHAR(20)  NOT NULL,          -- AFFORD | UNLOCK | LUMP_SUM
  amount        DECIMAL(15,2) NOT NULL,
  chosen_kind   VARCHAR(20)  NOT NULL,          -- PREPAY | GOAL | KEEP | SPEND | SKIP
  chosen_ref_id BIGINT       NULL,              -- loan / goal id; null for KEEP
  context_json  JSON         NOT NULL,          -- the options as shown, frozen (a decision is history, like CycleSnapshot)
  reason        VARCHAR(500) NULL,
  decided_at    DATETIME(6)  NOT NULL,
  followed_at   DATETIME(6)  NULL,              -- set when the matching transaction/plan change is seen
  deleted_at    DATETIME(6)  NULL,
  created_at    DATETIME(6)  NOT NULL,
  updated_at    DATETIME(6)  NOT NULL,
  INDEX idx_decision_user (user_id, decided_at)
);

-- ROADMAP 5.2 - allocate free money across goals. Feasibility already does the contention
-- (priority order, each goal consuming its gap); this stores only the user's chosen split,
-- as a share of free money, so it moves with the month instead of going stale as a rupee figure.
CREATE TABLE goal_allocation (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT        NOT NULL,
  goal_id      BIGINT        NOT NULL,
  share        DECIMAL(5,4)  NOT NULL,          -- 0.2500 = a quarter of free money; sum per user <= 1
  active_from  DATE          NOT NULL,
  active_to    DATE          NULL,               -- versioned like commitments (ADR-0015), never overwritten
  deleted_at   DATETIME(6)   NULL,
  created_at   DATETIME(6)   NOT NULL,
  updated_at   DATETIME(6)   NOT NULL,
  INDEX idx_alloc_user_goal (user_id, goal_id)
);

-- ROADMAP 6.1 - a promise: "I will put ₹5,000 aside this month", kept or missed. Kept/missed
-- is DERIVED at read time from transactions in the cycle (ADR-0011) - only the promise is stored.
CREATE TABLE promise (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT        NOT NULL,
  cycle_id    BIGINT        NOT NULL,
  kind        VARCHAR(20)   NOT NULL,           -- SET_ASIDE | SPEND_UNDER | PAY_DOWN
  amount      DECIMAL(15,2) NOT NULL,
  ref_id      BIGINT        NULL,               -- goal / loan / category, by kind
  note        VARCHAR(200)  NULL,
  deleted_at  DATETIME(6)   NULL,
  created_at  DATETIME(6)   NOT NULL,
  updated_at  DATETIME(6)   NOT NULL,
  INDEX idx_promise_user_cycle (user_id, cycle_id)
);
```

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
