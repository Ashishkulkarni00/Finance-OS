/**
 * Money on the frontend - the rules from FRONTEND_CONVENTIONS.md §4.
 *
 * 1. Money is a string end-to-end. Never `number` in a type, prop or store.
 * 2. The frontend never does money arithmetic. Every derived figure comes from the
 *    server; if a screen needs a total, that's a server endpoint, not a JS sum.
 * 3. `Number()` appears only here, inside formatMoney, for rendering.
 * 4. en-IN formatting - lakh grouping. Anything else reads as a foreign product.
 * 5. null renders as an em dash, never ₹0. Unknown and zero are different facts.
 */
export type Money = string;

const INR_WHOLE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const INR_PAISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const DIGITS_WHOLE = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
const DIGITS_PAISE = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export interface MoneyParts {
  /** True minus (U+2212) or empty - never a hyphen. */
  sign: string;
  /** Rendered separately so it can be set at 0.62em and muted - DESIGN_SYSTEM §3. */
  symbol: string;
  /** Lakh-grouped digits, no symbol. */
  digits: string;
  /** True when the value is unknown - render an em dash, never ₹0. */
  unknown: boolean;
  negative: boolean;
}

/**
 * Splits money into its renderable parts so the ₹ can be typeset separately from the
 * digits. DESIGN_SYSTEM §3 "Number craft": the symbol sits at 0.62em, muted and
 * baseline-aligned - a full-size, full-ink ₹ is what makes a figure look amateur.
 */
export function splitMoney(value: Money | null | undefined, opts?: { paise?: boolean; signed?: boolean }): MoneyParts {
  if (value == null) return { sign: '', symbol: '', digits: '—', unknown: true, negative: false };
  const n = Number(value);
  if (Number.isNaN(n)) return { sign: '', symbol: '', digits: '—', unknown: true, negative: false };

  const digits = (opts?.paise ? DIGITS_PAISE : DIGITS_WHOLE).format(Math.abs(n));
  const sign = n < 0 ? '−' : opts?.signed && n > 0 ? '+' : '';
  return { sign, symbol: '₹', digits, unknown: false, negative: n < 0 };
}

/**
 * Formats a money string for display. Whole rupees by default (DESIGN_SYSTEM §3);
 * pass `paise: true` only in ledger detail. `null`/`undefined` render as an em dash -
 * "unknown", never "₹0". A true minus (U+2212) replaces the formatter's hyphen.
 */
export function formatMoney(value: Money | null | undefined, opts?: { paise?: boolean }): string {
  if (value == null) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';

  const formatted = (opts?.paise ? INR_PAISE : INR_WHOLE).format(Math.abs(n));
  return n < 0 ? `−${formatted}` : formatted;
}

/** For a signed amount where the sign itself is the point (e.g. a delta). */
export function formatSignedMoney(value: Money | null | undefined, opts?: { paise?: boolean }): string {
  if (value == null) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  if (n === 0) return formatMoney(value, opts);
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${formatMoney(value, opts)}`;
}

const PERCENT = new Intl.NumberFormat('en-IN', { style: 'percent', maximumFractionDigits: 0 });

/**
 * Renders a server-computed ratio (savingsRate, committedShare, a category's share of
 * spend). These arrive as raw fractions - 0.42, not 42 - so interpolating one straight
 * into a template with a `%` sign shows "0.42%", which is a real bug this codebase has
 * already shipped once. Always go through here.
 */
export function formatPercent(fraction: number | null | undefined): string {
  return fraction == null ? '—' : PERCENT.format(fraction);
}

/** Compact form (₹1.2L / ₹4.5Cr) - only where a chart genuinely has no room for the full figure. */
export function formatMoneyCompact(value: Money | null | undefined): string {
  if (value == null) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';

  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)}L`;
  return formatMoney(value);
}
