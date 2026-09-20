import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { GroupBand } from '@/components/GroupBand';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney } from '@/lib/money';
import { cycleMonthName, formatShortDate } from '@/lib/dates';
import { useGetForecastQuery } from '@/services/forecastService';
import type { ForecastMonth, ForecastUnlock } from '@/types/forecast';

const HORIZON = 12;

/** "₹6,145/month frees up from October" - every unlock across the horizon, earliest first. */
function UnlockCalendar({ months }: { months: ForecastMonth[] }) {
  const items = months.flatMap((m) => m.unlocks.map((u) => ({ ...u, monthEnd: m.cycleEnd })));
  if (items.length === 0) return null;

  const total = items.reduce((sum, u) => sum + Number(u.amount), 0);

  return (
    <section>
      <SectionHeader>Money freeing up</SectionHeader>
      <div className="mb-space-3 flex items-start gap-space-3 rounded-xl border border-line bg-surface p-space-4">
        <Sparkles size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden />
        <p className="text-body text-ink">
          {formatMoney(String(total))} a month becomes free over the next {HORIZON} months, as these end.
        </p>
      </div>
      <ul className="flex flex-col">
        {items.map((u: ForecastUnlock & { monthEnd: string }) => (
          <li key={`${u.commitmentId}-${u.monthEnd}`} className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-2 last:border-b-0">
            <span className="text-label text-ink">
              {u.name}
              <span className="block text-caption text-ink-muted">frees up from {cycleMonthName(u.monthEnd)}</span>
            </span>
            <Amount value={u.amount} role="row" className="text-positive" />
          </li>
        ))}
      </ul>
      <p className="mt-space-2 text-caption text-ink-muted">Nothing moves on its own - decide where each amount should go when it arrives.</p>
    </section>
  );
}

/** One forecast month: the outline, then its annual/quarterly items if any. */
function MonthRow({ month }: { month: ForecastMonth }) {
  const negative = month.flexible != null && Number(month.flexible) < 0;
  return (
    <div className="flex flex-col">
      <GroupBand
        label={cycleMonthName(month.cycleEnd)}
        figure={
          month.flexible != null ? (
            <Amount value={month.flexible} role="caption" className={negative ? 'text-attention' : 'text-ink'} />
          ) : (
            <span className="text-ink-muted">—</span>
          )
        }
        caption="flexible"
      />
      <div className="num flex flex-wrap items-baseline gap-x-space-4 gap-y-space-1 px-space-1 pb-space-3 text-caption text-ink-muted">
        <span>
          in <Amount value={month.incomeExpected} role="caption" className="text-ink-soft" />
        </span>
        <span>
          committed <Amount value={month.committed} role="caption" className="text-ink-soft" />
        </span>
        <span>
          set aside <Amount value={month.setAside} role="caption" className="text-ink-soft" />
        </span>
        {month.unknownAmountCount > 0 && (
          <span className="text-attention">
            {month.unknownAmountCount} {month.unknownAmountCount === 1 ? 'bill needs' : 'bills need'} an amount
          </span>
        )}
      </div>
      {month.annualItems.length > 0 && (
        <ul className="flex flex-col px-space-1 pb-space-3">
          {month.annualItems.map((item) => (
            <li key={item.commitmentId} className="flex items-baseline justify-between gap-space-3 text-caption text-ink-soft">
              <span>
                {item.name} <span className="text-ink-muted">· {formatShortDate(item.dueDate)}</span>
              </span>
              {item.amount != null ? <Amount value={item.amount} role="caption" /> : <span className="text-ink-muted">amount unknown</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Ahead's 12-month view (STRATEGY_DEEP_DIVE §D/§F, Phase 2 pieces 2-3): the plan projected
 * forward from `GET /forecast`, plus a money-unlock calendar built from the same data.
 * A pure projection - see `ForecastMonth`'s own note: it assumes every rule keeps recurring
 * unchanged, so it is not the same figure as the live "free until salary" for the current month.
 */
export function AheadForecast() {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isError } = useGetForecastQuery(HORIZON);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="text-body text-ink-soft">We couldn’t load what’s ahead. Refresh to try again.</p>;
  }

  const months = data.months;
  const visible = expanded ? months : months.slice(0, 3);

  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-1">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Ahead</span>
        <span className="text-title text-ink">The next {HORIZON} months</span>
        <p className="max-w-[40rem] text-caption text-ink-muted">
          What your plan says would happen if nothing changes - not what’s already happened. This month’s real figure is
          on <Link to="/today" className="text-accent underline-offset-4 hover:underline">Today</Link>.
        </p>
      </div>

      <UnlockCalendar months={months} />

      <section>
        <SectionHeader
          trailing={
            months.length > 3 && (
              <button type="button" onClick={() => setExpanded((v) => !v)} className="text-caption text-accent underline-offset-4 hover:underline">
                {expanded ? 'Show fewer' : `Show all ${months.length}`}
              </button>
            )
          }
        >
          Month by month
        </SectionHeader>
        <div className="flex flex-col gap-space-2">
          {visible.map((m) => (
            <MonthRow key={m.cycleStart} month={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
