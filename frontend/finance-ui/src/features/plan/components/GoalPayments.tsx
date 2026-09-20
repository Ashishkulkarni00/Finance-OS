import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { formatDayMonthYear } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { GoalResponse, GoalScheduleLine } from '@/types/goal';
import { AddCommitmentSheet } from './AddCommitmentSheet';

function statusText(line: GoalScheduleLine): { text: string; tone: 'muted' | 'positive' | 'attention' } {
  switch (line.status) {
    case 'PAID':
      return { text: 'Paid', tone: 'positive' };
    case 'COVERED':
      return { text: 'Covered by what’s saved', tone: 'muted' };
    case 'SHORT':
      return { text: `${formatMoney(line.shortBy ?? '0')} more needed by then`, tone: 'attention' };
    case 'AMOUNT_UNKNOWN':
      return { text: 'Amount not known yet - not counted', tone: 'attention' };
  }
}

/**
 * "What this goal has to pay, and when" - for goals whose money doesn't all leave on one
 * day. A December trip needs its bookings paid in October: that's a payment on 5 Oct, and
 * the rest is due on the goal's own date. The server walks them in date order and says,
 * for each, whether what's saved covers everything due by then (GoalScheduleLine).
 *
 * <p>Each payment is an ordinary one-off commitment linked to the goal, so it also shows on
 * Months in its month, counts against what's free there, and is settled like any other.
 */
export function GoalPayments({ goal }: { goal: GoalResponse }) {
  const [adding, setAdding] = useState<{ amount?: string; month?: string; name?: string } | null>(null);
  const schedule = goal.schedule ?? [];
  const goalMonth = goal.targetDate.slice(0, 7);

  return (
    <section>
      <SectionHeader
        trailing={
          <button type="button" onClick={() => setAdding({})} className="text-accent underline-offset-4 hover:underline">
            + Add a payment
          </button>
        }
      >
        Payments
      </SectionHeader>

      {schedule.length === 0 ? (
        <p className="text-caption text-ink-muted">
          Does part of this have to be paid before {formatDayMonthYear(goal.targetDate)} - bookings, a deposit, an advance?
          Add it as a payment with its date. The goal then works out how much you need by each date, and Months sets it
          aside in the right month.
        </p>
      ) : (
        <>
          <ul className="flex flex-col">
            {schedule.map((line) => {
              const status = statusText(line);
              const isRest = line.commitmentId == null;
              return (
                <li
                  key={line.commitmentId ?? 'rest'}
                  className="flex items-start justify-between gap-space-3 border-b border-line py-space-3 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="num text-caption text-ink-muted">{formatDayMonthYear(line.date)}</span>
                    {isRest ? (
                      <span className="text-row text-ink">The rest - by the goal date</span>
                    ) : (
                      <Link to={`/commitment-rules/${line.commitmentId}`} className="text-row text-ink hover:underline hover:underline-offset-4">
                        {line.name}
                      </Link>
                    )}
                    <span
                      className={cn(
                        'text-caption',
                        status.tone === 'positive' && 'text-positive',
                        status.tone === 'attention' && 'text-attention',
                        status.tone === 'muted' && 'text-ink-muted',
                      )}
                    >
                      {status.text}
                    </span>
                    {isRest && (
                      <button
                        type="button"
                        onClick={() => setAdding({ amount: line.stillNeeded ?? undefined, month: goalMonth, name: `${goal.name} - spending` })}
                        className="self-start text-caption text-accent underline-offset-4 hover:underline"
                      >
                        Plan it as a payment too
                      </button>
                    )}
                  </div>
                  {line.amount ? (
                    <Amount value={line.amount} role="row" className={line.status === 'PAID' ? 'text-ink-muted' : 'text-ink'} />
                  ) : (
                    <span className="text-caption text-ink-muted">—</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-space-3 text-caption text-ink-muted">
            “More needed by then” counts everything due up to that date against what’s saved now. “The rest” is the part of the
            target no payment is planned for yet - it isn’t set aside on Months until you plan it.
          </p>
        </>
      )}

      {adding && (
        <AddCommitmentSheet
          open
          onClose={() => setAdding(null)}
          preset={{
            kind: 'GOAL_PAYMENT',
            once: true,
            name: adding.name ?? `${goal.name} - bookings`,
            sourceId: goal.id,
            goalName: goal.name,
            accountId: goal.linkedAccountId,
            amount: adding.amount,
            month: adding.month,
          }}
        />
      )}
    </section>
  );
}
