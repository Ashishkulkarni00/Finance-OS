import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { GroupBand } from '@/components/GroupBand';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import { cycleMonthName, formatShortDate } from '@/lib/dates';
import { useGetForecastQuery } from '@/services/forecastService';
import type { ForecastMonth, ForecastUnlock } from '@/types/forecast';

const HORIZON = 12;

/**
 * Money freeing up - the total, then what makes it up.
 *
 * <p>The two are given different weight on purpose. A summary card that restates the one
 * row beneath it is just the same sentence twice, which is what this was: with a single
 * unlock, the card's figure and the row's figure were the same number an inch apart. So a
 * lone unlock is said once, as a sentence; several get a headline figure with the list as
 * its breakdown under a band.
 */
function UnlockCalendar({ months, total }: { months: ForecastMonth[]; total: string }) {
  const items = months.flatMap((m) => m.unlocks.map((u) => ({ ...u, monthEnd: m.cycleEnd })));
  if (items.length === 0) return null;

  const single = items.length === 1 ? items[0]! : null;

  return (
    <section>
      <SectionHeader trailing={items.length > 1 ? `${items.length} ending` : undefined}>Money freeing up</SectionHeader>

      <div className="flex items-start gap-space-3">
        <Sparkles size={18} strokeWidth={1.5} className="mt-1 shrink-0 text-positive" aria-hidden />
        <div className="flex min-w-0 flex-col gap-space-1">
          <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">
            {single ? 'Frees up' : `Frees up over ${HORIZON} months`}
          </span>
          {/* One figure, set as the headline. Never a client-side sum: with several
              unlocks the total is the server's own, and with one it is that one's amount. */}
          <Amount value={single ? single.amount : total} role="hero" className="text-positive" />
          <span className="text-body text-ink-soft">
            {single ? (
              <>
                a month, once <span className="text-ink">{single.name}</span> ends in {cycleMonthName(single.monthEnd)}
              </>
            ) : (
              'a month, once these end'
            )}
          </span>
        </div>
      </div>

      {!single && (
        <div className="mt-space-5">
          <GroupBand label="What ends" count={items.length} />
          <ul className="flex flex-col">
            {items.map((u: ForecastUnlock & { monthEnd: string }) => (
              <li
                key={`${u.commitmentId}-${u.monthEnd}`}
                className="flex items-baseline justify-between gap-space-3 border-b border-line py-space-2 last:border-b-0"
              >
                <span className="min-w-0 text-label text-ink">
                  {u.name}
                  <span className="block text-caption text-ink-muted">from {cycleMonthName(u.monthEnd)}</span>
                </span>
                <Amount value={u.amount} role="row" className="shrink-0 text-positive" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-space-3 text-caption text-ink-muted">
        Nothing moves on its own — decide where it should go before it arrives, or it becomes day-to-day spending.
      </p>
    </section>
  );
}

type Note = { tone: 'good' | 'watch' | 'muted'; text: string };

/**
 * One month in the run ahead.
 *
 * <p>What a person needs from a row this far out is not four figures - it is <em>is there
 * room, and is there a reason this month is different?</em> So the free figure is the row's
 * headline, the makeup sits under it as detail, and anything that makes the month unusual
 * (a bonus landing, an annual bill, a bill with no amount yet) is said in words.
 */
function MonthRow({ month, notes }: { month: ForecastMonth; notes: Note[] }) {
  const flexible = month.flexible;
  const negative = flexible != null && Number(flexible) < 0;
  // A month with bills that have no amount yet cannot be short of what it says - the
  // committed figure can only grow, so the free figure is a ceiling, not a number.
  const isCeiling = month.unknownAmountCount > 0;

  return (
    <div className="border-b border-line py-space-4 last:border-b-0">
      <div className="flex items-baseline justify-between gap-space-4">
        <span className="flex min-w-0 flex-col">
          <span className="text-row text-ink">{cycleMonthName(month.cycleEnd)}</span>
          <span className="num text-caption text-ink-muted">
            {formatShortDate(month.cycleStart)} – {formatShortDate(month.cycleEnd)}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end">
          {flexible != null && isCeiling && <span className="text-caption text-ink-muted">up to</span>}
          <Amount
            value={flexible}
            role="section"
            className={negative ? 'text-critical' : flexible == null ? 'text-ink-muted' : 'text-ink'}
          />
          <span className="text-caption text-ink-muted">{negative ? 'short' : 'free'}</span>
        </span>
      </div>

      <div className="num mt-space-2 flex flex-wrap items-baseline gap-x-space-4 gap-y-space-1 text-caption text-ink-muted">
        <span>
          in <Amount value={month.incomeExpected} role="caption" className="text-ink-soft" />
        </span>
        <span>
          committed <Amount value={month.committed} role="caption" className="text-ink-soft" />
        </span>
        <span>
          set aside <Amount value={month.setAside} role="caption" className="text-ink-soft" />
        </span>
      </div>

      {notes.length > 0 && (
        <ul className="mt-space-2 flex flex-col gap-space-1">
          {notes.map((note) => (
            <li
              key={note.text}
              className={cn(
                'text-caption',
                note.tone === 'good' ? 'text-positive' : note.tone === 'watch' ? 'text-attention' : 'text-ink-muted',
              )}
            >
              {note.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Ahead's 12-month view (STRATEGY_DEEP_DIVE §D/§F, Phase 2 pieces 2-3): the plan projected
 * forward from `GET /forecast`, plus the money-unlock calendar built from the same data.
 *
 * <p><strong>The current month is deliberately not listed.</strong> Months knows it far
 * better - it can see the amounts already given to this month's variable bills, which a
 * pure projection cannot - so showing it here only produced a second, worse answer to
 * "what's free". This page starts where Months stops being the better source.
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

  // months[0] is the current cycle - Months owns it. See the class note above.
  const months = data.months.slice(1);
  // Only the next month is open by default. It is the one you can still act on - the rest
  // are context, and eleven rows of context pushed the goals below them off the screen.
  const visible = expanded ? months : months.slice(0, 1);
  const hidden = months.length - 1;

  // Comparison, not arithmetic: which month has the most room, and which the least. The
  // browser never adds money up (FRONTEND_CONVENTIONS §4 rule 2), but it may order it.
  const known = months.filter((m) => m.flexible != null);
  //
  // A superlative is only true when it is unique. October and December can both be the
  // same figure, and calling one of them "the tightest month ahead" would be picking a
  // winner out of a tie - so a month has to be strictly clear of every other to be named.
  const onlyOneAt = (pick: (a: number, b: number) => boolean): ForecastMonth | null => {
    if (known.length < 2) return null;
    const best = known.reduce((a, b) => (pick(Number(b.flexible), Number(a.flexible)) ? b : a));
    const tied = known.filter((m) => Number(m.flexible) === Number(best.flexible)).length > 1;
    return tied ? null : best;
  };
  const mostRoom = onlyOneAt((a, b) => a > b);
  const tightest = onlyOneAt((a, b) => a < b);

  const notesFor = (month: ForecastMonth): Note[] => {
    const notes: Note[] = [];
    for (const item of month.annualItems) {
      notes.push({
        tone: 'watch',
        text: `${item.name} falls due ${formatShortDate(item.dueDate)}${item.amount == null ? ' — amount not set' : ''}, and only in this month.`,
      });
    }
    for (const unlock of month.unlocks) {
      notes.push({ tone: 'good', text: `${unlock.name} ends — that money is free from here on.` });
    }
    if (mostRoom && month.cycleStart === mostRoom.cycleStart) {
      notes.push({ tone: 'good', text: 'The most room of any month ahead. Worth deciding now where it should go.' });
    }
    if (tightest && month.cycleStart === tightest.cycleStart && month.flexible != null && Number(month.flexible) >= 0) {
      notes.push({ tone: 'watch', text: 'The tightest month ahead.' });
    }
    if (month.flexible != null && Number(month.flexible) < 0) {
      notes.push({ tone: 'watch', text: 'The plan asks for more than comes in this month.' });
    }
    if (month.unknownAmountCount > 0) {
      notes.push({
        tone: 'muted',
        text: `${month.unknownAmountCount} ${month.unknownAmountCount === 1 ? 'bill has' : 'bills have'} no amount yet, so the real figure will be lower.`,
      });
    }
    return notes;
  };

  return (
    <div className="flex flex-col gap-space-8">
      <div className="flex flex-col gap-space-1">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Ahead</span>
        <span className="text-title text-ink">The months after this one</span>
        <p className="max-w-[40rem] text-caption text-ink-muted">
          Your plan carried forward, so you can see where the room is before you get there.
        </p>
      </div>

      <UnlockCalendar months={data.months} total={data.unlockedMonthlyTotal} />

      <section>
        <SectionHeader
          trailing={
            hidden > 0 && (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((v) => !v)}
                className="text-caption text-accent underline-offset-4 hover:underline"
              >
                {expanded ? 'Show just next month' : `Show ${hidden} more`}
              </button>
            )
          }
        >
          Month by month
        </SectionHeader>
        <div className="flex flex-col">
          {visible.map((m) => (
            <MonthRow key={m.cycleStart} month={m} notes={notesFor(m)} />
          ))}
        </div>
      </section>
    </div>
  );
}
