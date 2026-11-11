import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import { FactStrip, type Fact } from '@/components/FactStrip';
import { Skeleton } from '@/components/Skeleton';
import { formatPercent } from '@/lib/money';
import { cn } from '@/lib/cn';
import { useGetCycleShapeQuery } from '@/services/commitmentInstanceService';
import { useGetCycleSummaryQuery } from '@/services/cycleService';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { CycleResponse } from '@/types/cycle';
import type { CycleShapeResponse } from '@/types/commitment';

function flexibleNote(shape: CycleShapeResponse): string {
  if (shape.state === 'NO_INCOME') return 'needs your salary - add it in the plan below';
  if (shape.flexible != null && Number(shape.flexible) < 0) return 'bills and savings are more than what comes in';
  if (shape.state === 'INCOMPLETE') {
    return `at most - ${shape.unknownAmountCount} ${shape.unknownAmountCount === 1 ? 'bill needs' : 'bills need'} an amount`;
  }
  return 'for everything else this month';
}

type Lens = 'plan' | 'sofar';

/**
 * Month's answer on a phone (2026-11-11, second pass).
 *
 * <p>The first phone pass put the sum and "So far this cycle" in two stacked cards; the user
 * found the page "cards everywhere". This is the banking-app shape instead: the figure sits on
 * the page itself - Flexible, its pace bar, what's been spent - and one three-across strip
 * underneath carries the working. A two-way switch flips that strip between **the plan** (comes in
 * − committed − set aside) and **so far** (money in, money out, left over), so two halves of the
 * same question share one place instead of two boxes.
 *
 * <p>Every figure is the server's: `GET /cycles/{id}/shape` and `/summary`. Nothing is added up
 * here. Desktop keeps `MonthShape` + `CycleInOut` side by side.
 */
export function MonthHero({ cycle, showSoFar }: { cycle: CycleResponse | undefined; showSoFar: boolean }) {
  const { data: shape, isLoading, isError } = useGetCycleShapeQuery(cycle?.id ?? 0, { skip: !cycle });
  const { data: sofar } = useGetCycleSummaryQuery(cycle?.id ?? 0, { skip: !cycle || !showSoFar });
  const [lens, setLens] = useState<Lens>('plan');
  const doc = useDocAnchor('month.shape');

  if (isError) {
    return <p className="text-caption text-ink-muted">The month’s outline couldn’t load. Refresh to try again.</p>;
  }
  if (isLoading || !shape) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const negative = shape.flexible != null && Number(shape.flexible) < 0;
  const showPace = shape.spentShare != null && shape.cycleElapsed > 0;
  const midMonth = shape.cycleElapsed > 0 && shape.cycleElapsed < 1;
  const stillExpected = Number(shape.incomeStillExpected) > 0;
  const active: Lens = showSoFar && sofar ? lens : 'plan';

  const planFacts: Fact[] = [
    { label: stillExpected ? 'Comes in · some due' : 'Comes in', value: <Amount value={shape.expectedIn} role="row" /> },
    { label: '− Committed', value: <Amount value={shape.committed} role="row" /> },
    { label: '− Set aside', value: <Amount value={shape.plannedSavings} role="row" /> },
  ];
  const soFarFacts: Fact[] = sofar
    ? [
        { label: 'Money in', value: <Amount value={sofar.incomeTotal} role="row" /> },
        { label: 'Money out', value: <Amount value={sofar.expenseTotal} role="row" /> },
        { label: 'Left over', value: <Amount value={sofar.net} role="row" emphasiseNegative className={Number(sofar.net) < 0 ? undefined : 'text-positive'} /> },
      ]
    : [];

  return (
    <section className="flex flex-col" {...doc}>
      <span className="text-caption text-ink-muted">Flexible this month</span>
      <Amount value={shape.flexible} role="hero" className={cn('mt-space-1', negative ? 'text-attention' : 'text-accent')} />
      <span className={cn('mt-space-1 text-caption', negative ? 'text-attention' : 'text-ink-muted')}>{flexibleNote(shape)}</span>

      {shape.state !== 'NO_INCOME' && (
        <div className="mt-space-4 flex flex-col gap-space-2">
          {showPace && (
            <div className="relative h-1.5 w-full rounded-full bg-sunken" aria-hidden>
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (shape.spentShare ?? 0) * 100)}%` }} />
              <div className="absolute -top-1 h-3.5 w-px bg-ink-soft" style={{ left: `${Math.min(100, shape.cycleElapsed * 100)}%` }} />
            </div>
          )}
          <p className="num flex items-baseline justify-between gap-space-3 text-caption text-ink-muted">
            <span>
              Spent <Amount value={shape.spent} role="caption" className="font-semibold text-ink" />
            </span>
            <span className="text-right">
              {showPace && <>{formatPercent(shape.spentShare)} used</>}
              {showPace && midMonth && ' · '}
              {midMonth && <>{formatPercent(shape.cycleElapsed)} of month gone</>}
            </span>
          </p>
        </div>
      )}

      <div className="mt-space-5 flex items-center justify-between gap-space-3">
        {showSoFar && sofar ? (
          <span className="inline-flex h-8 items-stretch overflow-hidden rounded-full border border-border text-caption pointer-coarse:h-9" role="group" aria-label="Show">
            {(['plan', 'sofar'] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={active === l}
                onClick={() => setLens(l)}
                className={cn(
                  'flex items-center px-space-3 transition-colors duration-150',
                  active === l ? 'bg-accent-wash font-medium text-ink' : 'text-ink-soft',
                )}
              >
                {l === 'plan' ? 'The plan' : 'So far'}
              </button>
            ))}
          </span>
        ) : (
          <span className="text-caption text-ink-muted">The plan</span>
        )}
        {active === 'sofar' && cycle ? (
          <Link to={`/ledger?cycle=${cycle.id}`} className="text-caption text-accent underline-offset-4 hover:underline">
            Every entry →
          </Link>
        ) : (
          <span className="text-caption text-ink-muted">{active === 'plan' ? 'what the month adds up to' : ''}</span>
        )}
      </div>

      <FactStrip facts={active === 'plan' ? planFacts : soFarFacts} className="mt-space-2 border-y border-line" />
      {active === 'sofar' && sofar && (
        <p className="mt-space-2 text-caption text-ink-muted">
          {sofar.savingsRate != null && <>{formatPercent(sofar.savingsRate)} saved · </>}
          money out includes bills and EMIs, not just day-to-day.
        </p>
      )}
    </section>
  );
}
