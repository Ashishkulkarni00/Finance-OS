import type { ReactNode } from 'react';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney, formatPercent } from '@/lib/money';
import { cn } from '@/lib/cn';
import { useGetCycleShapeQuery } from '@/services/commitmentInstanceService';
import type { CycleResponse } from '@/types/cycle';
import type { CycleShapeResponse } from '@/types/commitment';

/** One column of the derivation: operator, label, figure, and the line under it. */
function Term({ op, label, children, note }: { op?: string; label: string; children: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-space-1">
      <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">
        {op && <span className="num mr-space-1 text-ink-soft" aria-hidden>{op}</span>}
        {label}
      </span>
      {children}
      {note && <span className="text-caption text-ink-muted">{note}</span>}
    </div>
  );
}

function flexibleNote(shape: CycleShapeResponse): string | undefined {
  if (shape.state === 'NO_INCOME') return 'needs your salary - add it in the plan below';
  if (shape.flexible != null && Number(shape.flexible) < 0) return 'bills and savings are more than what comes in';
  if (shape.state === 'INCOMPLETE') {
    return `at most - ${shape.unknownAmountCount} ${shape.unknownAmountCount === 1 ? 'bill needs' : 'bills need'} an amount`;
  }
  return 'for everything else this month';
}

/**
 * The month in one line - PRODUCT_AUDIT §4 "Snapshot": what comes in, what's already
 * spoken for, what's set aside, and what that leaves; then how much of it is used against
 * how much of the month has gone. Every figure and fraction is the server's
 * (`GET /cycles/{id}/shape`); nothing is added up here.
 *
 * <p>Pace is stated, never judged: "60% used · 45% of the month gone" - the reader draws the
 * conclusion (never "over budget").
 */
export function MonthShape({ cycle }: { cycle: CycleResponse | undefined }) {
  const { data: shape, isLoading, isError } = useGetCycleShapeQuery(cycle?.id ?? 0, { skip: !cycle });

  if (isError) {
    return <p className="text-caption text-ink-muted">The month’s outline couldn’t load. Refresh to try again.</p>;
  }
  if (isLoading || !shape) {
    return <Skeleton className="h-16 w-full" />;
  }

  const stillExpected = Number(shape.incomeStillExpected) > 0;
  const negative = shape.flexible != null && Number(shape.flexible) < 0;
  const showPace = shape.spentShare != null && shape.cycleElapsed > 0;

  return (
    <div className="flex flex-col gap-space-4">
      <div className="grid grid-cols-2 gap-space-4 sm:grid-cols-4">
        <Term
          label="Comes in"
          note={
            shape.state === 'NO_INCOME'
              ? 'no salary planned'
              : stillExpected
                ? `${formatMoney(shape.incomeStillExpected)} still expected`
                : 'all arrived'
          }
        >
          <Amount value={shape.expectedIn} role="section" className="text-ink" />
        </Term>
        <Term op="−" label="Committed" note="bills, EMIs, card payments">
          <Amount value={shape.committed} role="section" className="text-ink" />
        </Term>
        <Term op="−" label="Set aside" note="savings and investments">
          <Amount value={shape.plannedSavings} role="section" className="text-ink" />
        </Term>
        <Term op="=" label="Flexible" note={<span className={cn(negative && 'text-attention')}>{flexibleNote(shape)}</span>}>
          <Amount value={shape.flexible} role="section" className={negative ? 'text-attention' : 'text-ink'} />
        </Term>
      </div>

      {shape.state !== 'NO_INCOME' && (
        <div className="flex flex-col gap-space-2">
          {showPace && (
            // Two server fractions drawn as widths: how much of flexible is used, and a
            // tick for how much of the month has gone.
            <div className="relative h-1.5 w-full rounded-full bg-sunken" aria-hidden>
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(100, (shape.spentShare ?? 0) * 100)}%` }}
              />
              <div
                className="absolute -top-1 h-3.5 w-px bg-ink-soft"
                style={{ left: `${Math.min(100, shape.cycleElapsed * 100)}%` }}
              />
            </div>
          )}
          <p className="num text-caption text-ink-soft">
            Spent so far <Amount value={shape.spent} role="caption" className="text-ink" /> outside the plan
            {showPace && <> · {formatPercent(shape.spentShare)} of flexible</>}
            {shape.cycleElapsed > 0 && shape.cycleElapsed < 1 && <> · {formatPercent(shape.cycleElapsed)} of the month gone</>}
          </p>
        </div>
      )}
    </div>
  );
}
