# Today, rebuilt in the Ledger's grammar (spec, 2026-11-11)

**Status: built 2026-11-11 (Sonnet), checked headless only; see CONTINUE_HERE.** Opus wrote this; it is meant to be implemented as written
(Sonnet). It **supersedes `UI_UX_REVAMP_PLAN.md` §4.1** where they differ. Phone first; the
desktop gets the same single column.

User, 2026-11-11: *"check the ledger page, how clean and neat it seems. Same way I want you to
think for the Today page and make it our hero of the app … your standing section I like at the
bottom, however for the rest …"*

---

## 1. Why the Ledger reads clean: six rules to copy

Measured on the 390px phone screenshots, Ledger next to Today.

| # | Ledger does | Today does now |
|---|---|---|
| L1 | **One kind of container: none.** Rows sit on the page ground, separated by hairlines. | Six: a bordered hero card, a tinted red band, a bordered card holding a paragraph, a card with a tinted beige box inside it, a grey pill band, and side-scrolling cards. |
| L2 | **One row shape.** A 28px tinted mark, the name, one muted line under it, and the amount on the right. Every row has it. | Each block has its own shape: a sentence, a three-column grid, list rows, a warning box with a button, a pill. |
| L3 | **Structure from type, not boxes.** A day starts with a large numeral ("11"), the weekday under it, and a hairline running to the day's total. | Plain bold section titles over cards. |
| L4 | **Colour is rare and means one thing.** A tinted wash in the leading mark. Amounts are ink; only income is green. | Orange hero, orange words in the sentence, red band, beige box, orange "Amount unknown", teal progress rule, teal link, green salary shown twice. |
| L5 | **Nouns and figures, almost no sentences.** | Four paragraphs on the first screen: the hero sentence, the shortfall explanation, the "tighter than usual" reason, and the step text. |
| L6 | **Every fact once.** | 17 days appears 4×, 28 Nov 5×, ₹57,700 2×, ₹2,600 2×. The needs-you count reads 3 (badge), 2 (band) and 1 (the row). |

**The rule for Today:** every block on the page is either a **row** in the shape of a
`LedgerRow`, or a **group header** shaped like `DayGroup`'s. The one exception is the hero
figure. Standing stays exactly as it is.

## 2. What the person opens Today to learn, in order

1. **Can I spend, and how much?** This is the hero.
2. **Is anything wrong, or is there something I have to do?** This is "Needs you".
3. **Did what I just spent land, and what has today cost?** This is "Today": the Ledger's own
   day group for today. Nothing currently answers it. After adding an entry, the person
   leaves Today for the Ledger to check it went in.
4. **What leaves before payday?** This is "Before payday".
5. **How do I stand over years?** This is "Your standing", unchanged and last.

Number 3 is the new section and the main reason Today becomes the app's home. The page you
spend from is also where you see what you spent, and it is where the "Again?" chips
(MOBILE_AUDIT M3) will go if approved.

## 3. The page

Phone, 390px, with the user's real data from 11 Nov:

```
Today                                              [?]
Wednesday, 11 November · day 15 of 31

₹48                                   ← hero, 40px/500, accent
a day until salary on Sat 28 Nov
Today's ₹116 share is used · about ₹263 a day under your usual

₹816 free until salary ÷ 17 days                   ›   ← whole line opens the Breakdown
──────────────────────────────────────────────────────

Needs you ────────────────────────────────────── 3
[!] Mobile recharges was due 10 Nov          ₹199  ›
    Record it if it's paid
[!] IDBI Saving won't cover Petrol on 27 Nov       ›
    Move money
[!] Emergency fund contribution needs an amount    ›
    Due 28 Nov · from HDFC Salary

11  Today ───────────────────── −₹1,160   ₹1,100 moved
    Wednesday, November 2026
[↗] Drinks                                     −₹160
    Cash wallet
[⇄] Hdfc salary - cash wallet                   ₹100
    …up to 5 rows…
    All 5 in the Ledger →

Before payday ──────────────────────── ₹2,600 to leave
27  Fri · in 16 days ─────────────────────────────────
[▤] Petrol                                    ₹2,000
    from IDBI Saving account · won't be covered        ← amber, words only
28  Payday · Sat · next month starts ─────────────────  ← numeral in accent
[▤] Emergency fund contribution          needs amount
    from HDFC Salary
[↙] Salary credit                           +₹57,700
    into HDFC Salary
    13 more after payday: see the month →

Your standing                                     ← unchanged
[ If income stopped ] [ Owed ] [ … ]
```

The ₹199 above stands in for whatever `impact` the insight carries. Copy shown in quotes in
§4 is final. Copy shown only in this sketch is illustrative.

## 4. Each block

### 4.1 Header (unchanged)

Keep `Today` + `?` and the date line. Remove `PageSubtitle` on phone (`max-md:hidden`), as
Ledger already does.

### 4.2 Hero: no card, on the ground

**Remove the `m-card`.** The hero sits on the page like Ledger's rows. The figure is the only
large type above the fold; it needs no box.

States. Every value is a server field and nothing is computed:

| State | Condition (comparisons only) | Figure | Line 1 | Line 2 (only if it has content) |
|---|---|---|---|---|
| **A. Room today** | `roomLeft > 0` | `roomLeft`, accent | "left to spend today" | "of today's {roomToday} share", only when `spentToday > 0`. When nothing is spent, line 2 is "Nothing spent yet today." |
| **B. Share used** | `roomLeft ≤ 0` and `realBalance ≥ 0` | **`perDay`**, accent | "a day until salary on {salaryOn}" | "Today's {roomToday} share is used", then " · about {perDayLess} a day under your usual" when recovery is `STRETCHED` and has a `SPEND_LESS` step with `perDayLess` |
| **C. Short** | `realBalance < 0` | `realBalance`, attention | "short until salary on {salaryOn}" | "More is due before salary than you have free. Nothing is blocked." (as now) |
| **D. Unknown** | position `INCOMPLETE` | `UnknownState` + `PositionBlockers` | as now | as now |

**Why B changes the figure (a reversal of 2026-11-10; call it out to the user):**
"−₹1,044" under the label "Spend today" can't be acted on. It's a verdict on a moment
that's already over, and it's the loudest thing on the app's home screen, in amber. Once
today's share is gone, the useful question is what each day is worth from here, and
`perDay` answers it. What spent today's share isn't lost: the Today group below shows the
spend as −₹1,160, with its rows.

The spent amount is **never** printed in the hero, in any state. It belongs to the Today
group's header (L6).

**Remove from the hero:**
- the "17 days to salary" chip, because the derivation line says it;
- `ProgressRule`;
- the phone "How it's worked out" row, because the derivation line is the trigger;
- the "Next salary +₹57,700" row and the desktop "Then salary … not counted" sentence,
  because the salary is the last row of Before payday (L6).

**Derivation line** (replaces `PositionTrio` on every width): one row, full width.

```
{realBalance} free until salary ÷ {daysToSalary} days          ›
```
- Before it: `--rule` hairline (`border-t border-line`, `pt-space-3`). After it:
  `border-b border-line pb-space-3`.
- `realBalance` uses `Amount role="row"` in ink. "free until salary ÷ N days" is text-label in
  ink-soft. The ÷ is ink-muted.
- **State A:** append ` = {perDay} a day from here`. The hero there is `roomLeft`, so `perDay`
  is new information.
- **State B:** stop at the days. The hero above is the result, so printing it again breaks L6.
- **State C:** the line is just `{daysToSalary} days to salary`. The hero is already the
  shortfall.
- The whole line is the `Breakdown` trigger (`title="Where you stand"`, body
  `PositionStatement bare`). The trailing `ChevronRight` 16px is ink-muted.
  `className="trigger-row"`, min-height 44px under `pointer: coarse`.
- `PositionTrio.tsx` becomes unused. Delete it.

### 4.3 Needs you: rows, not a band

Replaces `TodayStatus`'s tinted band. Same items, new shape.

- **Group header:** a `SectionRule` (new, §5) with label "Needs you" and trailing the
  **count**, in `num text-caption text-ink-soft`.
- **Rows:** `LedgerRow`.
  - `leading`: a 28px rounded-md mark (same size as `TypeMark`) with `AlertTriangle` 15px.
    `bg-attention-wash text-attention`, or `bg-critical-wash text-critical` for CRITICAL.
    Both tokens exist in `index.css`, with dark-mode values.
  - `primary`: `item.title`.
  - `secondary`: `explanation`, at most 2 lines (`line-clamp-2`). When `action` exists, the
    second line is replaced by `action.label` in text-caption accent ("Move money"), so the
    row says what tapping it does.
  - `amount`: `impact` when present, else none.
  - **Tap:** `useInsightAction(item).act()` for every action kind **except `CONFIRM`**,
    which writes as soon as it's called; tapping a row must never write. A `CONFIRM` item,
    or one with no action, opens the Needs-you panel (`showNeeds()`), where the explicit
    button is.
- **Show at most 3.** A 4th or later item becomes a final text row,
  "{n} more in Needs you →", which calls `showNeeds()`.
- **Which items:** every CRITICAL/ATTENTION item on the TODAY surface, **including the dated
  shortfall** that is currently `consumed` by the payment row. The count here **must equal
  the nav badge**; that fixes MOBILE_AUDIT R1's 3/2/1. The shortfall is said **fully** here
  (title, action, Move money). The payment row only flags it (§4.5).
- **All clear:** no group header. One line, as now: a tick and "Nothing needs you today.",
  with the reason under it and the `whatMoved` lines. No band.
- **Way back:**
  - In state B, a STRETCHED recovery whose only step is SPEND_LESS has already been said in
    the hero's line 2. Render nothing else.
  - A BROKEN recovery, or one with DEFER/RELEASE steps, renders its steps as **rows in this
    same group**, after the insights:
    - leading: a neutral mark (`bg-sunken text-ink-muted`, `Undo2` 15px);
    - primary: "{STEP_VERB} {label}";
    - amount: `amount`.
  - Its `reason` becomes the group's first line (text-caption, ink-soft, above the rows).
  - The catch-up sentence moves into the Breakdown sheet. It's detail, not a decision.
  - `WayBack.tsx`'s card and its separate section are removed.

### 4.4 Today: the Ledger's own day group (new)

- **Query:** `useGetTransactionsQuery({ dateFrom: todayIso, dateTo: todayIso, size: 6 })` and
  `useGetDaySubtotalsQuery({ dateFrom: todayIso, dateTo: todayIso })`. `todayIso` comes from
  the client clock, the same source `formatFullDate` uses. The backend already accepts
  `dateFrom`/`dateTo` on both (`TransactionController` lines 73 and 104).
- **Render:** `<DayGroup>` from `features/ledger/components/DayGroup`, **unchanged**, with
  the first 5 rows and today's subtotal. The header shows "11 Today", the rule, and −₹1,160
  and ₹1,100 moved.
- **Footer row:**
  - With 6 rows back (more than 5): "All {n} in the Ledger →".
  - With 1–5: "Open the Ledger →".
  - Either one links to `/ledger`, text-caption accent.
  - `n` is the page's `totalElements`.
- **Empty:** keep the DayGroup header (numeral, "Today", rule, no figure) and one muted line,
  "Nothing recorded yet today." Don't hide the group. An empty today is the cue to record,
  and the header shows the person where it will land.
- **Tap a row:** opens `EditTransactionSheet`, the same as Ledger (keyed by id; see that
  file's header note). Pending-delete dimming works as in `LedgerPage` (copy the `deleting`
  set logic).
- **Sticky:** DayGroup's header is `sticky top-0`. That's right inside the Ledger and
  harmless here, so leave it.

### 4.5 Before payday: in DayGroup's shape

Keep the data, `PREVIEW = 5`, show-all and the after-payday link. Change the shapes:

- **Section header:** `SectionRule` with label "Before payday", trailing
  "{committed} to leave". On phone and desktop alike: drop the long desktop variant with the
  salary date, because payday is in the list.
- **Date group header:** the same structure as `DayGroup`'s (numeral `text-section`, then
  weekday and when, then a hairline) **with no trailing figure**. A per-date total would be
  client arithmetic. Line 1 is the weekday ("Friday"); line 2 is `whenLabel` ("in 16 days").
  The numeral is attention when `daysBetween ≤ 1`, as the current `soon` rule does.
- **Payday group:** the same header. The numeral is in **accent**, line 1 is "Payday", and
  line 2 is "Saturday · next month starts". The `bg-sunken` pill band goes.
- **Rows:** `LedgerRow`.
  - leading: a 28px mark, `bg-sunken text-ink-muted`, with one icon per kind: COMMITMENT
    `CalendarClock`, LOAN_EMI `Landmark`, CARD_STATEMENT `CreditCard`. INCOME gets
    `ArrowDownRight` in `bg-positive-wash text-positive`, the same as TypeMark's income.
  - primary: the name.
  - secondary: "from {account}" or "into {account}" **without** the "Commitment ·" kind
    prefix (the mark says the kind). It wraps and is never truncated (MOBILE_AUDIT V2).
  - amount: ink, income green and signed. An unknown amount shows "needs an amount" in
    text-caption attention, not "Amount unknown".
  - `to`: `destinationFor(item)`, as now.
- **The shortfall row:**
  - The mark becomes `AlertTriangle` on the attention wash.
  - " · won't be covered" is appended to the secondary line in `text-attention`.
  - **The inline warning box and its Move money button are removed.** Both live in Needs you
    (§4.3), so `useDatedWarnings` keeps finding the row but no longer `consume`s the insight.
- The `grid` / `display: contents` layout goes. `LedgerRow` aligns amounts the same way
  Ledger does.

### 4.6 Your standing: unchanged

`StandingPanel` keeps its header, its cards and its place at the bottom. That's the user's
call.

## 5. Shared pieces

- **`SectionRule`** (new, `src/components/SectionRule.tsx`), the non-date version of
  DayGroup's header:
  ```tsx
  <div className="flex items-center gap-space-3 pb-space-2 pt-space-3">
    <span className="text-label font-medium text-ink">{label}</span>
    <span aria-hidden className="h-px flex-1 bg-line" />
    {trailing && <span className="num shrink-0 text-caption text-ink-soft">{trailing}</span>}
  </div>
  ```
  Used by Needs you and Before payday. Standing keeps `SectionHeader`.
- **`DateRule`**: extract DayGroup's header (numeral, two lines, rule, optional trailing) into
  `src/components/DateRule.tsx`, with props `{ date, line1, line2, tone: 'ink'|'accent'|'attention', trailing? }`.
  DayGroup and BeforePayday both use it, so DayGroup's rendering doesn't change.
- **Page rhythm:**
  - `TodayPage` root: `gap-space-6` on every width (the same as Ledger's group gap). Drop
    `md:gap-10`.
  - Hero to derivation: `gap-space-4`.
  - No `m-card` anywhere above Standing.
  - Keep the reveal delays in reading order: hero 0, derivation 120, Needs you 200, Today 260,
    Before payday 320, Standing 380 ms.
- **Colour budget:**
  - Accent: the hero figure (A and B), today's numeral, payday's numeral, and links.
  - Attention: Needs-you marks, the shortfall row, "needs an amount", and the state-C hero.
  - Green: income amounts only.
  - Nothing else is coloured. No tinted band or box anywhere on the page.

## 6. Order of work (each step: `npx tsc -b --noEmit && npx vite build`)

1. `DateRule` + `SectionRule`; DayGroup refactored onto `DateRule` (Ledger must look
   pixel-identical).
2. Hero: `SpendToday` without its card, with states A–D, the derivation line, and the
   removals. Delete `PositionTrio`.
3. Needs you: replace `TodayStatus` with `NeedsYouRows` (same file is fine). Fold `WayBack`
   in. Stop consuming the dated shortfall.
4. Today group: new `TodayEntries.tsx` in `features/today/components`, with
   `EditTransactionSheet` mounted in `TodayPage`.
5. Before payday rebuilt on `DateRule` + `LedgerRow`.
6. `TodayPage` order, rhythm and reveal delays. Phone subtitle hidden.
7. Docs: mark `UI_UX_REVAMP_PLAN` §4.1 superseded by this file, and tick MOBILE_AUDIT
   R1 (count), V2 (truncation) and V5 (figure printed three times).

## 7. Acceptance (CDP headless, 390×844, light and dark, non-GET blocked)

- [ ] No element above Standing has a border-radius ≥ 12px with a border or a tinted
      background (no cards, bands or boxes).
- [ ] The Needs-you count equals the nav badge count.
- [ ] Each of these strings appears **at most once** above Standing: the days-to-salary
      number, the salary amount, the `committed` total, and today's spent total.
- [ ] State B on real data (11 Nov) shows ₹48, not −₹1,044.
- [ ] Recording an entry (in a real browser, by the user; the headless run blocks writes)
      puts it in the Today group without navigation, and the hero animates.
- [ ] Ledger is unchanged after the DayGroup refactor: screenshot diff of `/ledger`.
- [ ] No text in Before payday ends in "…" at 390px.
- [ ] tsc + vite build are clean.

## 8. Not in this spec

- "Again?" quick-repeat chips (MOBILE_AUDIT M3) are still the user's decision. If approved,
  they go directly under the Today group's header.
- The bottom-nav swap (M2) and net worth (M1) are unaffected.
- No backend changes. Every field used already exists.
