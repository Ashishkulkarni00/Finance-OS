# This Month — UX Specification

**Written 2026-09-10.** The *how* for the concept in `docs/product/MONTH_EXPERIENCE.md`.
Binding for the redesign. Follows `DESIGN_SYSTEM.md` and `UI_UX_PRINCIPLES.md`; where this
document is silent, those govern.

Direction: **The Briefing** — verdict and crux first, attention second, evidence third,
outlook last.

---

## 1. Screen structure

Six zones, in priority order. Zones 3 and 6 are conditional. Nothing is behind an accordion.

```
┌────────────────────────────────────────────────────────────────────┐
│ 1  CYCLE BAND       28 Aug ─────●──────── 27 Sep · day 14 · 17 left │  one line + rule
├────────────────────────────────────────────────────────────────────┤
│ 2  THE CRUX         ₹20,657 free for the next 17 days              │  hero
│                     On track. About ₹1,215 a day.                   │  verdict sentence
├────────────────────────────────────────────────────────────────────┤
│ 3  NEEDS YOU        (only when Tier 1 is non-empty)                 │  attention
│                     ⚠ Emergency fund restoration · overdue 2 days   │
├────────────────────────────────────────────────────────────────────┤
│ 4  THE PLAN         ₹23,700 of ₹28,500 settled · 7 of 8            │  progress + list
│                     [obligations, ordered by attention]             │
├────────────────────────────────────────────────────────────────────┤
│ 5  SPENDING PACE    ₹11,583 of ₹18,000 flexible used · 45% elapsed  │  pace + deviations
├────────────────────────────────────────────────────────────────────┤
│ 6  OUTLOOK          On this pace you'll finish around ₹4,200 up.    │  projection
└────────────────────────────────────────────────────────────────────┘
```

Ordering rationale: the crux answers the visit; attention is the only thing that can require
action *today*; plan and pace are the evidence behind the verdict; outlook is context, not a
call to act — and is the least certain figure on the page, so it sits last.

---

## 2. Zone 1 — Cycle band

Establishes *now* in one line. Not a chart, not a feature — a rule with a marker.

```
28 Aug ──────────────●───────────────── 27 Sep
day 14 of 31 · 17 days to salary
```

- Filled portion = elapsed, in `--accent`; remainder in `--line`. 2px, full width.
- Marker: a 6px dot at today's position.
- Caption below in `--ink-muted`, `text-caption`, tabular.
- **Last 3 days of the cycle:** caption becomes `3 days to salary` in `--attention`.
- **After the end date:** band is fully filled, caption reads `This cycle has ended`, and the
  close-cycle invitation appears at the foot of the page (never a modal, never a nag).

---

## 3. Zone 2 — The crux

The screen's one hero. Mirrors Today's hero pattern so the two read as one product.

```
FREE FOR THE REST OF THIS CYCLE
₹20,657                                    ← 44px, --accent, tabular
On track. About ₹1,215 a day for 17 days.  ← 15px, --ink-soft
₹8,316 of that keeps your emergency fund on plan.   ← caption, only when applicable
```

### Verdict states

Copy is generated from computed facts; every sentence carries its own justification.

| State | Trigger | Sentence |
|---|---|---|
| **Unknown** | A mandatory amount is missing | *"One amount is missing, so this isn't certain yet."* Crux renders `—`. The blocking item is named with a link. |
| **Strained** | Free < 0, or an account is projected short before a due date | *"Tight. ₹2,300 short before the 27th — the SIP on the 13th is the pinch point."* |
| **Watch** | Free > 0 but daily allowance is well below the user's own recent pace | *"Workable, but tighter than your usual — about ₹410 a day."* |
| **On track** | Comfortable against pace | *"On track. About ₹1,215 a day for 17 days."* |
| **Ahead** | Projected to finish notably up | *"Comfortable — you're running about ₹3,100 ahead of your usual pace."* |
| **Early** | Days 1–2 | No verdict. *"₹28,500 is committed this cycle. ₹20,657 is free after it."* |

Tone rules (`UI_UX_PRINCIPLES.md` §11): "Tight", never "bad". "Ahead of your usual", never
"overspending". The verdict never praises or scolds — it states.

Motion: the crux uses the existing 250ms count-up **on change only** (`useAnimatedMoney`).

---

## 4. Zone 3 — Needs you (Tier 1)

Rendered **only when non-empty**. When empty it is replaced by a single quiet line at the
end of Zone 2 — an achievement, not a void (`UI_UX_PRINCIPLES.md` §14):

> *Nothing needs you. Next up is the SIP on the 13th.*

Each Tier 1 item is a **card**, not a row — it earns the extra weight:

```
┌─ ⚠ ───────────────────────────────────────────────────────┐
│ Emergency fund restoration                    ₹8,000       │
│ Overdue by 2 days                                          │
│ Your emergency reserve stays below plan while this waits.  │  ← consequence
│ [ Settle ]                              Why this matters ⓘ │
└────────────────────────────────────────────────────────────┘
```

- Amber tint `color-mix(in srgb, var(--attention) 8%, var(--surface))` — never a red fill.
  **Red is reserved for the figure itself when genuinely negative**, per `DESIGN_SYSTEM.md` §4.
- Consequence text (`ifSkipped`) is **shown inline here and only here** — at Tier 1 it is
  decision-relevant; on a settled row it is noise. Consequence visibility is
  attention-driven, not uniform.
- One primary action per card. Never two competing buttons.
- Overdue framing states the fact and the effect, never blame: *"Overdue by 2 days"* +
  what it costs. No exclamation marks, no "!", no red banner.

Ordering within Tier 1: blocking-the-truth first (unknown amount, needs review), then
overdue by age, then due-today, then projected-shortfall.

---

## 5. Zone 4 — The plan

### 5.1 Progress line

One line, no chart:

```
THE PLAN                     ₹23,700 of ₹28,500 settled · 7 of 8
────────────────────────────────────────────────────────────
```

A 4px progress rule beneath, `--accent` fill on `--sunken` track. Both numbers always shown
(`DESIGN_SYSTEM.md` §6: never a bare percentage).

### 5.2 The list — ordered by attention, not status

Tier 1 items already appear above; they are **not repeated** here. The list carries Tier 2
then Tier 3, each row:

```
│ ▍ SIP — Zerodha              ₹2,500   Due in 3 days      ⓘ  ›
│ ▍ Netflix                      ₹649   Due 20 Sep         ⓘ  ›
│ ✓ Electricity                ₹2,850   Paid 2 Sep · ₹350 more than planned  ›
│ ✓ Bike loan EMI              ₹3,900   Paid 5 Sep                            ›
```

- **Accent bar** (3px) carries the tier: `--attention` (Tier 2 with time pressure),
  `--commit` (Tier 2 routine), and a `✓` in `--positive` replacing the bar for Tier 3.
- **Settled rows are muted** (`--ink-muted` primary text) — present, not competing.
- **Variance is surfaced inline on settled rows** where confirmed ≠ expected:
  *"₹350 more than planned"*. This is the cheapest real insight we have and is currently
  invisible. Under-spend gets the same treatment, in `--positive`.
- **Every row ends in a `›` chevron** — the clickability cue. Rows open the commitment detail
  page. The `ⓘ` is a separate, lighter affordance (see §7).
- No "Completed" collapse. Settled items stay visible; hiding them made "done" stop feeling
  like part of the same list.

Secondary line per row, in priority order of what's most useful:
1. Time pressure if any (*"Due in 3 days"*, *"Overdue by 2 days"*)
2. Variance if settled and different from plan
3. Otherwise the plain fact (*"Paid 5 Sep"*, *"Due 20 Sep"*)

---

## 6. Zone 5 — Spending pace

Answers "where is my discretionary money going" **without inventing a budget**
(`PRODUCT_STRATEGY.md` §5).

```
FLEXIBLE SPENDING            ₹11,583 of ₹18,000 · 45% of the cycle gone
────────────────────────────────────────────────────────────

Running ahead
  Dining out          ₹5,344     ahead of your usual pace
Everything else       ₹6,239     across 5 categories        ⌄
```

- The denominator is the **flexible pot** — `income − committed − reserved − invested` —
  what the cycle actually leaves for discretionary spending. Never a typed budget.
- **Pace comparison** = share of pot spent vs share of cycle elapsed. Needs no history, works
  from day 3.
- **Signal over completeness**: name only categories meaningfully ahead of pace. Everything
  else collapses to one line with a count, expandable. Ten balanced cards when two matter is
  the failure mode.
- Zero deviations is a real, good state: *"Nothing running ahead of pace."*
- Visually separated from Zone 4 by a `border-t` — it's a different question, not more list.

---

## 7. Interaction model

Three tiers of disclosure. **Visible → contextual → detailed**, never everything-behind-clicks.

| Level | Interaction | Shows | Where |
|---|---|---|---|
| **Visible** | none | Name, amount, timing, tier; consequence at Tier 1 | inline |
| **Contextual** | `ⓘ` click (hover reveals the icon on desktop) | *Why this is here* + *If it's skipped* + how the amount was set | popover, ~320px, dismiss on Esc / outside click |
| **Detailed** | row click (`›`) | Full detail page: rule, history across cycles, linked transaction, actions | `/commitments/:id` |

The `ⓘ` popover is the brief's "why should be interactive", done without leaving the page:

```
Why is this here?
Your planned monthly investment, set to leave IDBI on the 13th.

If it's skipped
A month of investing is missed.

Amount
Fixed at ₹2,500 by your commitment rule.
```

- The popover **never** contains an action — actions live on the row and the detail page.
  A popover that can mutate state is a trap on touch.
- `ⓘ` appears only where there is genuinely something to explain (a `why` or `ifSkipped`
  exists, or the amount is derived). Never a decorative icon on every row.

### No filters

Deliberate. See `MONTH_EXPERIENCE.md` §9 — attention ordering *is* the filter, and a
12-item list doesn't need a toolbar. Revisit above ~25 items.

---

## 8. Visual language: Actual / Planned / Projected

| State | Typography | Colour | Always accompanied by |
|---|---|---|---|
| **Actual** | tabular, normal weight | `--ink` | — |
| **Planned** | tabular, normal | `--ink-soft` | the word "planned" or a due date |
| **Projected** | tabular, normal | `--ink-muted` | **the words "on this pace" / "projected"** |

Never distinguish these by colour alone — it fails both accessibility and skim-reading.
The qualifier is in the copy, always.

---

## 9. States

| State | Treatment |
|---|---|
| **Loading** | Skeletons in each zone's final shape. Never a spinner over the crux. Zones resolve independently — the cycle band and crux should not wait on category spend. |
| **Empty — no commitments** | *"This cycle is a blank page."* + *"Add what leaves your account every month and the rest builds itself."* + [Add a commitment]. Crux still renders — free money is still true. |
| **Empty — nothing needs you** | Zone 3 replaced by one line naming what's next. An achievement. |
| **Empty — no flexible spending yet** | *"Nothing on day-to-day categories yet this cycle."* |
| **Unknown** | A mandatory unknown amount: crux renders `—`, verdict names the blocker with a link to resolve it. Amber, not red — nothing failed. |
| **Early cycle (days 1–2)** | Pace, outlook and verdict suppressed; the plan is stated instead, with *"Too early to project — check back in a few days."* |
| **Cycle ended** | Band full, close invitation at the foot; pace and outlook hidden (the cycle is over — that's Month Close's story now). |
| **Error** | Per zone, not per page: a failed category-spend query must not blank the crux. Plain sentence + retry. |

---

## 10. Responsive

Desktop is the built surface; this is the mobile intent, not yet implemented.

| | Desktop ≥1025 | Mobile ≤640 |
|---|---|---|
| Layout | Single column, 720px measure — this is a reading page, not a dashboard | Single column, full width |
| Zone 2 | Hero + verdict | **Must be above the fold on 375×667** |
| Zone 3 | Cards, full width | Cards, unchanged — highest priority content |
| Zone 4 | Rows with inline variance | Rows; variance drops to its own line |
| Zone 5 | Deviations + collapsed rest | Same |
| `ⓘ` | Popover on click, icon on hover | Bottom sheet, icon always visible |

The page is deliberately **not** a multi-column grid. It's a briefing, read top to bottom.

---

## 11. Accessibility

- Attention tier is conveyed by **grouping + label + icon**, with colour as reinforcement only.
- Crux has an `aria-label` spelling the figure naturally: *"Twenty thousand six hundred and
  fifty-seven rupees free for the next seventeen days."*
- The cycle band is `role="img"` with a text alternative; the caption already states it.
- Rows are keyboard-reachable and Enter/Space activate; the `ⓘ` is a separate tab stop with
  Esc to dismiss and focus returned to the trigger.
- Every actionable target ≥44×44.
- Motion respects `prefers-reduced-motion` absolutely — the count-up becomes an instant set.

---

## 12. What this needs from the backend

Computable today: crux (Real Balance + days), plan progress, category spend, cycle dates,
commitment status/consequence, variance inputs (`expectedAmount` and `confirmedAmount` both
exist).

Needs adding — all server-side, for the same reason `worklistGroup` is:

| Addition | Why server-side |
|---|---|
| `attention` tier + reason per instance | One definition shared by Month, Today's Needs You, and counts — otherwise they drift |
| `variance` on settled instances | Money arithmetic; never client-side |
| **Flexible pot** for the cycle | `income − committed − reserved − invested` — money arithmetic |
| **Spending pace** (spent vs pot, elapsed vs cycle) | Ratio over money |
| **Month-end outlook** + tightest point | The projection engine (`PRODUCT_STRATEGY.md` §3.1) |

Suggested shape: extend the existing `/cycles/{id}/action-summary` with attention counts, and
add one `/cycles/{id}/outlook` returning pot, pace, projection and pinch point.

---

## 13. Build order

Each step should be independently shippable and visibly better.

1. **Restructure** — six zones, crux + verdict (states we can compute today), attention
   ordering, no collapse, chevrons, variance inline. *No new backend beyond attention +
   variance fields.*
2. **Pace** — flexible pot + deviation detection replaces the current flat category list.
3. **Outlook** — projection, pinch point, and the strained/watch verdict states that depend
   on it.
4. **Explain** — the `ⓘ` popover, shared with the wider Explain system.
5. **Later** — "since you last looked", personal-history comparison, one-recommended-action.
