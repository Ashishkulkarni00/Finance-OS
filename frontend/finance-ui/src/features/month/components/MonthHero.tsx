import type { ReactNode } from 'react';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { Statement, StatementRow } from '@/components/Statement';
import { formatMoney, formatPercent } from '@/lib/money';
import { cn } from '@/lib/cn';
import { useGetCycleShapeQuery } from '@/services/commitmentInstanceService';
import { useDocAnchor } from '@/features/help/useDocAnchor';
import type { CycleResponse } from '@/types/cycle';
import type { CycleMode } from './MonthAnswer';

const ROOM = 'Room for everyday spending';

/** What the month leaves for everyday spending, when that can't be said as a plain figure. */
function roomNote(state: 'COMPLETE' | 'INCOMPLETE' | 'NO_INCOME', flexible: string | undefined, unknown: number): string | null {
  if (state === 'NO_INCOME') return 'needs your salary - add it in the plan below';
  if (flexible != null && Number(flexible) < 0) return 'bills and savings are more than what comes in';
  if (state === 'INCOMPLETE') return `at most - ${unknown} ${unknown === 1 ? 'bill needs' : 'bills need'} an amount`;
  return null;
}

/** A statement label with what the line is made of beneath it. On a phone the note is dropped: three
 *  one-line rows keep "Needs you" on the first screen, and the line's name says enough. */
function Labelled({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <>
      {children}
      {note && <span className="block text-caption text-ink-muted max-md:hidden">{note}</span>}
    </>
  );
}

/**
 * The month's answer, at every width (2026-11-11, third pass - the user asked for clarity in what
 * the top of Month says).
 *
 * <p><strong>What the big figure is.</strong> It used to be "Flexible this month ₹15,971", which
 * read as money left, when ₹14,580 of it was already spent: the month's *room* for everyday
 * spending, not what remains of it. The hero is now what has been spent, stated against that room
 * ("of ₹15,971 this month leaves room for"), and the pace - how much of the room is used against
 * how much of the month has gone - is one plain line under the bar, never judged. The remainder is
 * deliberately not printed: it would be subtraction in the browser, and the server has no such field.
 *
 * <p><strong>The working is a statement, not a strip.</strong> The three-across strip stopped one
 * term short of its own answer (comes in − committed − set aside, then no "="). Vertical ruled rows
 * carry all four, with the answer as the total line, and each line says what it is made of. Every figure is
 * the server's (`/cycles/{id}/shape`). What actually came in and went out is a closed section lower
 * down (`MoneyInOutSection`): a "plan | so far" switch here was two answers fighting for one slot,
 * and nobody could say which they were looking at (2026-11-11).
 *
 * <p>A month that hasn't started has nothing spent, so there the room *is* the hero.
 */
export function MonthHero({ cycle, mode }: { cycle: CycleResponse | undefined; mode: CycleMode }) {
  // currentData: never another month's figures while a month switch loads (useSelectedCycle).
  const { currentData: shape, isLoading, isError } = useGetCycleShapeQuery(cycle?.id ?? 0, { skip: !cycle });
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

  const room = shape.flexible;
  const spentHero = mode !== 'future' && shape.state !== 'NO_INCOME' && room != null && Number(room) > 0;
  const note = roomNote(shape.state, room, shape.unknownAmountCount);
  const showPace = spentHero && shape.spentShare != null;
  const midMonth = mode === 'current' && shape.cycleElapsed > 0 && shape.cycleElapsed < 1;
  const over = shape.spentShare != null && shape.spentShare > 1;
  const stillExpected = Number(shape.incomeStillExpected) > 0;

  return (
    <section className="flex flex-col" {...doc}>
      {spentHero ? (
        <>
          <span className="text-caption text-ink-muted">{mode === 'current' ? 'Everyday spending so far' : 'Everyday spending'}</span>
          <Amount value={shape.spent} role="hero" className={cn('mt-space-1', over ? 'text-attention' : 'text-accent')} />
          <p className="mt-space-1 text-body text-ink-soft">
            {shape.state === 'INCOMPLETE' ? 'of at most ' : 'of '}
            <span className="num text-ink">{formatMoney(room)}</span>
            {shape.state === 'INCOMPLETE'
              ? ` — ${shape.unknownAmountCount} ${shape.unknownAmountCount === 1 ? 'bill needs' : 'bills need'} an amount`
              : ' this month leaves room for'}
          </p>
          {showPace && (
            <div className="mt-space-4 flex flex-col gap-space-2">
              <div className="relative h-1.5 w-full rounded-full bg-sunken" aria-hidden>
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (shape.spentShare ?? 0) * 100)}%` }} />
                {midMonth && (
                  <div className="absolute -top-1 h-3.5 w-px bg-ink-soft" style={{ left: `${Math.min(100, shape.cycleElapsed * 100)}%` }} />
                )}
              </div>
              <p className="num text-caption text-ink-soft">
                {formatPercent(shape.spentShare)} of it used
                {midMonth && <> · {formatPercent(shape.cycleElapsed)} of the month gone</>}
              </p>
            </div>
          )}
        </>
      ) : null}

      <span className={cn('text-caption text-ink-muted', spentHero && 'mt-space-6')}>How the month adds up</span>
      <div className="mt-space-1 max-w-[44rem]">
        <Statement dense>
          <StatementRow
            label={<Labelled note={mode !== 'future' && stillExpected ? `${formatMoney(shape.incomeStillExpected)} still to arrive` : undefined}>Comes in</Labelled>}
            value={shape.expectedIn}
          />
          <StatementRow label={<Labelled note="bills, EMIs, card payments">Committed</Labelled>} value={shape.committed} deduct />
          <StatementRow label={<Labelled note="savings and investments">Set aside</Labelled>} value={shape.plannedSavings} deduct />
          <StatementRow variant="total" label={ROOM} value={room} emphasiseNegative accent={!spentHero && room != null && Number(room) >= 0} />
        </Statement>
      </div>
      {!spentHero && note && (
        <p className={cn('mt-space-2 text-caption', room != null && Number(room) < 0 ? 'text-attention' : 'text-ink-muted')}>{note}</p>
      )}
    </section>
  );
}
