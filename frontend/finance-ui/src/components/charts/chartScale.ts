import type { Money } from '@/lib/money';

/**
 * Geometry for charts - and the **only** place in the product where a money string becomes
 * a number outside `lib/money`.
 *
 * <p>FRONTEND_CONVENTIONS §4 rule 2 says the browser never does money arithmetic, and a
 * chart is not an exception to it. The distinction this module rests on: a *figure* is
 * money and comes from the server; a *bar height* is a pixel, and no one reads a pixel as a
 * rupee. So nothing here ever returns something that gets printed - every function returns
 * a fraction between 0 and 1, and every number a user actually sees on these charts is a
 * server figure rendered through `Amount` or `formatMoney`.
 *
 * <p>If a chart ever needs a *total* of several columns, that is a server endpoint, not a
 * `reduce` in here. The forecast's unlock total was moved server-side for exactly that
 * reason.
 */

/** A money string as a plain number, for geometry only. Unknown and unparseable both give 0
 *  height - which is why an unrecorded month is drawn as an explicit gap instead, never as a
 *  zero-height bar that would read as "nothing happened". */
export function toNumber(value: Money | null | undefined): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export interface Scale {
  /** The top of the plot in the data's own units - the chart's one printed axis value. */
  max: number;
  /** A value as a fraction of the plot height, 0-1, clamped and never negative. */
  fraction: (value: Money | null | undefined) => number;
}

/**
 * A scale whose top is the largest value given, so the tallest column fills the plot.
 *
 * <p>Deliberately not a "nice" rounded maximum. A rounded axis is for reading values off
 * the chart, which these charts never ask anyone to do - the figures are printed in the
 * statement underneath. Filling the plot instead means the *shape* is as legible as the
 * data allows, which is the only reason a chart is here at all (DESIGN_SYSTEM §8).
 */
export function scaleOf(values: (Money | null | undefined)[]): Scale {
  const max = values.reduce((highest, value) => Math.max(highest, Math.abs(toNumber(value))), 0);
  return {
    max,
    fraction: (value) => {
      if (max <= 0) return 0;
      const n = Math.abs(toNumber(value));
      return Math.min(1, n / max);
    },
  };
}

/** A percentage string for a CSS height or offset. Rounded to 2dp - sub-pixel precision in
 *  a percentage is noise, and the rounding is on geometry, never on money. */
export function percent(fraction: number): string {
  return `${(Math.min(1, Math.max(0, fraction)) * 100).toFixed(2)}%`;
}
