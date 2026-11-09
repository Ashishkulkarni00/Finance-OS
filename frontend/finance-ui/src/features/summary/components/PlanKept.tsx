import { ProgressRule } from '@/components/ProgressRule';
import { SectionHeader } from '@/components/SectionHeader';
import { cn } from '@/lib/cn';
import { cycleMonthName } from '@/lib/dates';
import type { ReviewMonth } from '@/types/review';
import { MonthFigureTable } from './MonthFigureTable';
import { FiguresToggle } from './viz';

interface PlanKeptProps {
  months: ReviewMonth[];
}

/**
 * Commitments kept against commitments planned, per salary month.
 *
 * <p>**Deliberately not a chart.** DESIGN_SYSTEM §8 names the four places the shape over
 * time is the insight, and this is not one of them: "11 of 13" is the whole answer, and a
 * bar of it would be the same fact drawn larger. The hairline beside each row is a rule with
 * a marker, which is what the product uses for "how far through" everywhere else - not a
 * progress bar, which promises something is loading.
 *
 * <p>This is the North Star in its operational form (`CycleSnapshot` says so): commitments
 * kept is the number that has to go up, and it is the only measure on this page that is
 * about keeping a promise rather than about an amount. It reads live from the month's
 * occurrences, so the month in progress counts what has been settled so far - the rest of
 * it has not failed, it has not happened.
 *
 * <p>Bills only. The server filters out occurrences of an income commitment before counting,
 * because a salary credit is not a promise anyone keeps - on the real October cycle that was
 * the difference between "16 of 17" and the true "15 of 16", and it had the salary's ₹57,700
 * sitting inside a total labelled as what the plan would cost.
 *
 * <p>No judgement, by rule 8. A month that kept 9 of 13 is not scored, labelled or
 * coloured; the figures are stated and the dates are the user&rsquo;s own.
 */
export function PlanKept({ months }: PlanKeptProps) {
  const withPlan = months.filter((month) => (month.commitmentsPlanned ?? 0) > 0);

  if (withPlan.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-space-6">
      <div>
        <SectionHeader trailing="kept of planned">Did the plan hold</SectionHeader>
        <p className="max-w-[64ch] pt-space-2 text-body text-ink-soft">
          Commitments that were paid, out of those that fell due. The month in progress counts what has been
          settled so far — the rest has not failed, it has not come round yet.
        </p>
      </div>

      <div className="flex flex-col">
        {[...withPlan].reverse().map((month) => {
          const planned = month.commitmentsPlanned ?? 0;
          const kept = month.commitmentsKept ?? 0;
          return (
            <div key={month.cycleId} className="flex flex-col gap-space-2 border-b border-line py-space-4 last:border-b-0">
              <div className="flex items-baseline justify-between gap-space-4">
                <span className={cn('text-label', month.current ? 'font-medium text-ink' : 'text-ink-soft')}>
                  {cycleMonthName(month.endDate)}
                  {month.current && <span className="ml-space-2 text-caption font-normal text-ink-muted">so far</span>}
                </span>
                <span className="num shrink-0 text-row text-ink">
                  {kept}
                  <span className="text-ink-muted"> of {planned}</span>
                </span>
              </div>
              <ProgressRule fraction={planned > 0 ? kept / planned : 0} />
            </div>
          );
        })}
      </div>

      <FiguresToggle>
      <MonthFigureTable
          months={withPlan}
          columns={[
            {
              key: 'kept',
              head: 'Kept',
              node: (month) => (
                <span className="num text-row text-ink-soft">
                  {month.commitmentsKept ?? '—'}
                  <span className="text-ink-muted"> / {month.commitmentsPlanned ?? '—'}</span>
                </span>
              ),
            },
            { key: 'planned', head: 'Plan said', money: (month) => month.plannedCommittedTotal },
            { key: 'actual', head: 'Confirmed', money: (month) => month.actualCommittedTotal, emphasis: true },
          ]}
        />
  
        <p className="max-w-[72ch] text-caption text-ink-muted">
          <span className="text-ink-soft">Plan said</span> is everything the plan expected to leave your spending
          money — bills <em>and</em> money set aside, such as the SIP or a top-up to the emergency fund. That is why
          it is larger than Committed in the section above, which counts only what was spent. It shows an em dash
          whenever any bill in that month had no amount yet: a total with the unknown parts quietly dropped would read
          as a fact. A skipped optional bill is left out of both the count and the figures — it was never going to be
          paid. Money coming in is left out too: a salary arriving is not a promise you keep.
        </p>
      </FiguresToggle>
    </section>
  );
}
