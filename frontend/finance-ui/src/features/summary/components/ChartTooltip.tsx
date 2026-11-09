import type { ReactNode } from 'react';
import { formatMoney, type Money } from '@/lib/money';

/**
 * The hover card every Summary chart uses - one look, one place. It prints only the server's
 * own strings (ADR-0022 §2): callers pass `Money`, never a number Recharts computed.
 */
export function TooltipCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-[13rem] rounded-lg border border-line bg-surface px-space-3 py-space-2 text-caption shadow-sm">
      <div className="mb-space-1 font-medium text-ink">{title}</div>
      <div className="flex flex-col gap-[2px]">{children}</div>
    </div>
  );
}

export function TooltipLine({ label, colour, value, strong }: { label: string; colour?: string; value: Money | null | undefined; strong?: boolean }) {
  return (
    <div className={strong ? 'mt-space-1 flex items-center justify-between gap-space-4 border-t border-line pt-space-1' : 'flex items-center justify-between gap-space-4'}>
      <span className="flex items-center gap-space-2 text-ink-soft">
        {colour && <span className="inline-block h-[10px] w-[10px] rounded-[3px]" style={{ background: colour }} />}
        {label}
      </span>
      <span className={strong ? 'num font-medium text-ink' : 'num text-ink'}>{formatMoney(value)}</span>
    </div>
  );
}

/** Shared axis styling - recessive, no box (ADR-0022 §3). */
export const AXIS_TICK = { fill: 'var(--ink-muted)', fontSize: 12 } as const;
