import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Money } from '@/lib/money';

/**
 * Small shared pieces for the Summary charts (2026-11-09 revamp). Colours are the `--viz-*`
 * tokens in index.css - a validated categorical order, light and dark. Text never wears a
 * series colour: identity comes from the swatch beside it.
 */

export const SERIES = {
  committed: 'var(--viz-1)',
  flexible: 'var(--viz-2)',
  invested: 'var(--viz-3)',
} as const;

export function Swatch({ colour, className }: { colour: string; className?: string }) {
  return <span aria-hidden className={cn('inline-block h-[10px] w-[10px] shrink-0 rounded-[3px]', className)} style={{ background: colour }} />;
}

/** Always present for two or more series - identity is never colour alone. */
export function Legend({ items }: { items: { label: string; colour: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-space-4 gap-y-space-1 text-caption text-ink-soft">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-space-2">
          <Swatch colour={i.colour} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The figures behind a chart, folded. They used to sit open under every chart and the page
 * read as tables with pictures attached (user, 2026-11-09). Still one tap away - they are
 * the table view that makes each chart readable without colour or sight.
 */
export function FiguresToggle({ children, label = 'Show the figures' }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-space-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-space-1 self-start text-caption text-accent underline-offset-4 hover:underline"
      >
        {open ? 'Hide the figures' : label}
        <ChevronDown size={13} strokeWidth={1.75} aria-hidden className={cn('transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && children}
    </div>
  );
}

/** "₹12.4K", "₹1.3L" - for labels on marks, where a full figure would not fit. The exact
 *  figure is always in the tooltip and the table. Display formatting, not arithmetic. */
export function compactMoney(value: Money | null | undefined): string {
  if (value == null) return '—';
  const n = Number(value);
  const sign = n < 0 ? '−' : '';
  const a = Math.abs(n);
  // "9.0K" reads as false precision on an axis - a trailing .0 is dropped.
  const trim = (x: string) => x.replace(/\.0$/, '');
  if (a >= 100000) return `${sign}₹${trim((a / 100000).toFixed(a >= 1000000 ? 0 : 1))}L`;
  if (a >= 1000) return `${sign}₹${trim((a / 1000).toFixed(a >= 10000 ? 0 : 1))}K`;
  return `${sign}₹${Math.round(a)}`;
}

/** A small headline figure: label, value, and one line of context. */
export function StatTile({ label, value, sub, children }: { label: string; value: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-space-1 rounded-xl border border-line bg-surface p-space-4">
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">{label}</span>
      <span className="text-section text-ink">{value}</span>
      {children}
      {sub && <span className="text-caption text-ink-muted">{sub}</span>}
    </div>
  );
}
