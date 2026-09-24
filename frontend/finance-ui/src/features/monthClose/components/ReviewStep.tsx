import type { ReactNode } from 'react';
import { Amount } from '@/components/Amount';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { PlanChanges } from '@/features/month/components/PlanChanges';
import { cycleMonthName, formatShortDate, shiftIsoDays } from '@/lib/dates';
import { useGetCycleReviewQuery } from '@/services/commitmentInstanceService';
import { useGetCycleForDateQuery } from '@/services/cycleService';
import type { CycleResponse } from '@/types/cycle';

/** One line of the plan-against-actual statement: what it was, planned, what happened. */
function Line({ label, planned, actual, note }: { label: string; planned: ReactNode; actual: ReactNode; note?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_8rem_8rem] items-baseline gap-space-3 border-b border-line py-space-3 last:border-b-0">
      <span className="flex flex-col">
        <span className="text-label text-ink">{label}</span>
        {note && <span className="text-caption text-ink-muted">{note}</span>}
      </span>
      <span className="num text-right text-row text-ink-soft">{planned}</span>
      <span className="num text-right text-row text-ink">{actual}</span>
    </div>
  );
}

/**
 * "September in 60 seconds" - the month against its plan (STRATEGY_DEEP_DIVE Phase 2 piece 4).
 * What came in, what was paid, what was set aside, what went outside the plan, what didn't
 * happen, and what's different next month. Every figure is the server's (`/cycles/{id}/review`).
 *
 * <p>Facts, never verdicts: "₹2,000 not moved to the Emergency fund", not "you missed
 * your savings". Until plans lock at month start, "planned" is the plan as it stands now -
 * the step says so.
 */
export function ReviewStep({ cycle }: { cycle: CycleResponse }) {
  const { data: review, isLoading } = useGetCycleReviewQuery(cycle.id);
  const { data: next } = useGetCycleForDateQuery(shiftIsoDays(cycle.endDate, 1));
  const month = cycleMonthName(cycle.endDate);

  if (isLoading || !review) {
    return (
      <div className="flex flex-col gap-space-4">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-8">
      <div>
        <h1 className="text-editorial font-serif text-ink">{month} against its plan</h1>
        <p className="mt-space-2 text-caption text-ink-muted">
          “Planned” is your plan as it stands now - a bill changed after the fact shows its new figure.
        </p>
      </div>

      <div>
        <div className="grid grid-cols-[minmax(0,1fr)_8rem_8rem] gap-space-3 pb-space-2 text-micro uppercase tracking-[0.08em] text-ink-muted">
          <span />
          <span className="text-right">Planned</span>
          <span className="text-right">Happened</span>
        </div>
        <div className="border-t border-line">
          <Line
            label="Came in"
            planned={<Amount value={review.incomeExpected} role="row" />}
            actual={<Amount value={review.incomeReceived} role="row" />}
          />
          <Line
            label="Payments"
            note={`${review.paymentsPaidCount} of ${review.paymentsCount} paid`}
            planned={<Amount value={review.paymentsPlanned} role="row" />}
            actual={<Amount value={review.paymentsPaid} role="row" />}
          />
          <Line
            label="Set aside"
            note="savings, SIP, RD"
            planned={<Amount value={review.setAsidePlanned} role="row" />}
            actual={<Amount value={review.setAsideMade} role="row" />}
          />
          <Line
            label="Everything else"
            note="spending no plan item covers"
            planned={review.flexible != null ? <Amount value={review.flexible} role="row" /> : '—'}
            actual={<Amount value={review.spentOutsidePlan} role="row" />}
          />
        </div>
      </div>

      {review.notDone.length > 0 && (
        <section>
          <SectionHeader trailing={`${review.notDone.length}`}>Didn’t happen</SectionHeader>
          <ul className="flex flex-col">
            {review.notDone.map((i) => (
              <li key={i.instanceId} className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-2 last:border-b-0">
                <span className="text-label text-ink">
                  {i.name}
                  <span className="block text-caption text-ink-muted">
                    {i.savings ? 'not moved' : 'not recorded as paid'} · was due {formatShortDate(i.dueDate)}
                  </span>
                </span>
                {i.amount != null ? <Amount value={i.amount} role="row" className="text-ink" /> : <span className="text-caption text-ink-muted">no amount</span>}
              </li>
            ))}
          </ul>
          <p className="mt-space-2 text-caption text-ink-muted">
            Paid, but not recorded? Record it before closing, so the month is complete. If it really didn’t happen, it’s
            kept as it is.
          </p>
        </section>
      )}

      {review.skipped.length > 0 && (
        <section>
          <SectionHeader>Skipped this month</SectionHeader>
          <p className="text-caption text-ink-soft">{review.skipped.map((i) => i.name).join(', ')}</p>
        </section>
      )}

      {review.differences.length > 0 && (
        <section>
          <SectionHeader>Cost more or less than planned</SectionHeader>
          <ul className="flex flex-col">
            {review.differences.map((d) => (
              <li key={d.instanceId} className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-2 last:border-b-0">
                <span className="text-label text-ink">
                  {d.name}
                  <span className="num block text-caption text-ink-muted">
                    planned <Amount value={d.planned} role="caption" /> · paid <Amount value={d.actual} role="caption" />
                  </span>
                </span>
                <Amount value={d.difference} role="row" signed className="text-ink-soft" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {review.largestUnplanned.length > 0 && (
        <section>
          <SectionHeader>Largest spending outside the plan</SectionHeader>
          <ul className="flex flex-col">
            {review.largestUnplanned.map((s) => (
              <li key={s.transactionId} className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-2 last:border-b-0">
                <span className="text-label text-ink">
                  {s.description}
                  <span className="block text-caption text-ink-muted">
                    {formatShortDate(s.date)}
                    {s.category ? ` · ${s.category}` : ''}
                  </span>
                </span>
                <Amount value={s.amount} role="row" className="text-ink" />
              </li>
            ))}
          </ul>
          <p className="mt-space-2 text-caption text-ink-muted">
            If one of these happens every month, adding it as a bill makes next month’s “free” figure honest.
          </p>
        </section>
      )}

      {next && <PlanChanges cycle={next} title={`What’s different in ${cycleMonthName(next.endDate)}`} />}
    </div>
  );
}
