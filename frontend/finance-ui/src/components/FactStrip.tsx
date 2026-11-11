import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Fact {
  label: string;
  value: ReactNode;
}

/**
 * The page's few supporting facts in one row (UI_UX_REVAMP_PLAN 5.8.6 #4): label over figure,
 * separated by hairline rules, no boxes. It replaces both a row of stat tiles and a short
 * Statement of two to four facts. On a phone it wraps two across, with the rules turned
 * horizontal.
 *
 * <p>Pass finished nodes (an `Amount`, a day count). The strip only lays them out, so it can
 * never do money arithmetic.
 */
export function FactStrip({ facts, className }: { facts: Fact[]; className?: string }) {
  const three = facts.length === 3;
  return (
    <dl
      className={cn(
        // `fact-strip`: inside a phone card the strip's rules run to the card's edges (index.css).
        'fact-strip grid sm:grid-flow-col sm:auto-cols-fr',
        // Three facts sit three across on a phone; two-by-two left the third orphaned on its own row.
        three ? 'grid-cols-3' : 'grid-cols-2',
        className,
      )}
    >
      {facts.map((f, i) => (
        <div
          key={f.label}
          className={cn(
            'min-w-0 py-space-3',
            three ? 'pr-space-3 sm:pr-space-4' : 'pr-space-4',
            i > 0 && 'sm:border-l sm:border-line sm:pl-space-4',
            three && i > 0 && 'max-sm:border-l max-sm:border-line max-sm:pl-space-3',
            !three && i >= 2 && 'border-t border-line sm:border-t-0',
            !three && i % 2 === 1 && 'pl-space-4 max-sm:border-l max-sm:border-line',
          )}
        >
          {/* Three across on a phone is ~105px a cell: let a label or a "16.5% a year" wrap rather
              than clip to "Minimum bala…". Money itself never wraps (Amount is nowrap). */}
          <dt className={cn('text-caption text-ink-muted', three ? 'max-sm:leading-4 sm:truncate' : 'truncate')}>{f.label}</dt>
          <dd className={cn('num mt-[2px] text-[15px] font-medium leading-6 text-ink', three ? 'max-sm:leading-5 sm:truncate' : 'truncate')}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
