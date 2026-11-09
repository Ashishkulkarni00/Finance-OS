# ADR-0022 — Recharts for interactive charts (supersedes ADR-0021 §3)

**Status:** Accepted
**Date:** 2026-11-09
**Context:** ADR-0021 · `FRONTEND_CONVENTIONS.md` §4 rule 2 · the Summary revamp

---

## Context

ADR-0021 §3 chose hand-built HTML/SVG charts over Recharts. In use, the user found Month by
month hard to read (2026-11-09): income drawn as a 2px rule was "just a thin line", small
amounts (₹2,500 invested) were slivers, there was no y-axis, and nothing showed figures on
hover. Each of those is a solved problem in a charting library and a week of work by hand.

The user asked for Highcharts. **Highcharts is free only for non-commercial use**; Kosh is
meant to be sold, so it would need a paid licence. Recharts is MIT-licensed, React-native,
and supports React 19.

## Decision

1. **Recharts (pinned exactly, `recharts@3.10.1`) is adopted for charts that need axes and
   hover.** Simple figures that are not plots (meters, segmented bars, heatmap cells, the
   payoff timeline) stay hand-built - a library adds nothing there.
2. **ADR-0021 §1 and §2 stand unchanged.** `Number()` over money happens only to produce
   geometry for the library. **Every figure a person reads - tooltip, label, axis aside -
   is the server's string**, carried on the chart datum and printed through `formatMoney`.
   A tooltip never prints a value Recharts computed. Axis ticks are compact geometry labels
   (₹50K), not figures.
3. **Defaults are overridden to the design system**: hairline horizontal grid only, no axis
   box, the validated `--viz-*` colours, bars capped at 28px, legend below.

## Consequences

- One dependency (~100 KB gzipped). Acceptable for a screen the user called unreadable.
- Charts gain hover and keyboard tooltips without bespoke code.
- **Every plotted chart on Summary is Recharts** (user, 2026-11-09: "everywhere"): Month by month,
  the month's split bar, category bars, the debt curve and the payoff timeline. `ColumnChart`,
  `TrendLine` and `chartScale` were deleted. The category heatmap stays hand-built - Recharts has
  no heatmap - and every cell carries its figure in a hover title.
- ADR-0021 §1's single-file boundary for `Number()` no longer holds literally: the conversion now
  happens in each chart's row mapping, still for geometry only, never for printed figures.
