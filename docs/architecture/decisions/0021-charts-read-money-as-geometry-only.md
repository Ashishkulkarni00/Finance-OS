# ADR-0021 — Charts turn money into geometry, and nothing else

**Status:** Accepted
**Date:** 2026-10-24
**Context:** `FRONTEND_CONVENTIONS.md` §4 rule 2 · `DESIGN_SYSTEM.md` §8 · ADR-0001 · ADR-0006 · `TECHNICAL_ARCHITECTURE.md`

---

## Context

Summary is the first screen in the product with charts on it. A chart needs a bar height,
and a bar height is a number derived from money — which runs straight into the rule the
frontend has held since the first screen:

> **The frontend never does money arithmetic.** Every derived figure comes from the
> server; if a screen needs a total, that's a server endpoint, not a JS sum.
> — `FRONTEND_CONVENTIONS.md` §4 rule 2

Taken literally, that rule makes charts impossible. Taken loosely, it stops being a rule:
"it's only for the chart" is exactly how a `reduce` over an array of money strings gets
written, and the forecast's unlock total had to be moved to the server for precisely that
reason after the UI had been summing it in the browser.

There is also a stale decision in the way. `TECHNICAL_ARCHITECTURE.md` lists **Recharts**
as the charting library, chosen before any chart existed. It is not installed, and its
defaults — gridlines, a legend box, a bordered axis — are the opposite of what
`DESIGN_SYSTEM.md` §8 requires. Adopting it would mean fighting its defaults on every
chart forever.

## Decision

### 1. The boundary is *printed figure* versus *pixel*, and it is drawn in one file

`Number()` over a money string is allowed in **`components/charts/chartScale.ts`** and
nowhere else outside `lib/money.ts`. Everything that module exports returns a **fraction
between 0 and 1** or a CSS percentage string. It is structurally incapable of producing
something that could be printed.

Every figure a user reads on a chart — in the readout, in the takeaway sentence, in the
statement beneath it — is a server figure rendered through `Amount` or `formatMoney`.

The test for any future chart code: *could this number end up in front of a person?* If
yes, it comes from an endpoint. If it can only ever be a height, an offset or a path
coordinate, it belongs in `chartScale`.

### 2. A chart that needs a total needs an endpoint

Unchanged, and the reason the boundary above is narrow rather than a general exemption.
`GET /review/months` returns each month's `committedShare` and `leftOver` already
computed, and `samePoint.spendChange` as a figure rather than two figures to subtract,
because all three are *read*.

### 3. Charts are hand-built from HTML and inline SVG — Recharts is not adopted

Columns are HTML and CSS: at this size a column chart is boxes and baselines, and CSS
gives crisp hairlines at any width with no viewBox arithmetic and no stroke distortion.
The debt curve is inline SVG, because a path is a path.

This adds no dependency, and it means §8's rules — no gridlines, no legend box, no axis
border, direct labels, a takeaway sentence above every chart — are the default rather
than something overridden. `TECHNICAL_ARCHITECTURE.md`'s Recharts row is superseded by
this record.

### 4. A chart never invents a value it was not given

An unrecorded month is drawn as an explicit dashed gap at the baseline, never as a
zero-height column: zero and unknown are different facts, and a zero-height bar reads as
"nothing happened" (ADR-0006). `toNumber` returns 0 for null purely so the geometry does
not throw — the *drawing* branches on `recorded`, not on the number.

The same applies to a split the data cannot support: a month from before the plan existed
has `planTracked: false`, and its column is drawn as one undivided band rather than as a
column that is 100% day-to-day.

## Consequences

- One file to audit for money arithmetic in the browser, rather than a rule that quietly
  erodes every time a chart is added.
- `TECHNICAL_ARCHITECTURE.md`'s charting row is history; this record governs.
- Every new chart owes a takeaway sentence and a figures table beneath it. The table is
  not decoration — it is where the numbers are, and it is what makes the chart readable
  to someone who cannot see it or cannot distinguish its fills.
- A categorical palette used for chart fills is validated in both light and dark mode
  before shipping, against the surface it sits on, rather than reused from the domain
  hues — those are tuned for 3px rules and status dots. See the note above `--chart-*`
  in `index.css` for the one failure that forced separate tokens.
