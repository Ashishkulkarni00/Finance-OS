import { Link } from 'react-router-dom';
import { Amount } from '@/components/Amount';
import { Disclosure } from '@/components/Disclosure';
import { Skeleton } from '@/components/Skeleton';
import { Statement, StatementRow } from '@/components/Statement';
import { formatPercent } from '@/lib/money';
import { useGetCycleSummaryQuery } from '@/services/cycleService';
import type { CycleResponse } from '@/types/cycle';
import type { CycleMode } from './MonthAnswer';

/**
 * What actually moved this month - money in, money out, left over. A closed section beside the
 * other working ("Where day-to-day money went", "About this month"), because the page above it
 * answers a different question (the plan: what the month leaves room for) and the two must not
 * share one slot. Every figure is `GET /cycles/{id}/summary`; each label opens the Ledger on the
 * entries behind it. Not offered for a month that hasn't started - nothing has moved.
 */
export function MoneyInOutSection({ cycle, mode }: { cycle: CycleResponse | undefined; mode: CycleMode }) {
  // currentData: never another month's totals while a month switch loads (useSelectedCycle).
  const { currentData: data, isFetching, isError } = useGetCycleSummaryQuery(cycle?.id ?? 0, {
    skip: !cycle || mode === 'future',
  });
  if (mode === 'future') return null;
  const loading = !cycle || (isFetching && !data);
  const ledger = (type?: string) => (cycle ? `/ledger?cycle=${cycle.id}${type ? `&type=${type}` : ''}` : '/ledger');
  const link = (to: string, text: string) => (
    <Link to={to} className="underline-offset-4 transition-colors hover:text-ink hover:underline">
      {text}
    </Link>
  );

  return (
    <Disclosure
      storageKey="kosh.month.money-in-out"
      label={mode === 'past' ? 'What moved' : 'What moved so far'}
      summary={
        data ? (
          <>
            <Amount value={data.incomeTotal} role="caption" /> in · <Amount value={data.expenseTotal} role="caption" /> out
          </>
        ) : (
          'money in, money out, left over'
        )
      }
    >
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : isError || !data ? (
        <p className="text-body text-ink-soft">We couldn’t load this month’s totals. Refresh to try again.</p>
      ) : (
        <div className="flex flex-col gap-space-2">
          <div className="max-w-[44rem]">
            <Statement dense>
              <StatementRow label={link(ledger('INCOME'), 'Money in')} value={data.incomeTotal} />
              <StatementRow label={link(ledger('EXPENSE'), 'Money out')} value={data.expenseTotal} deduct />
              <StatementRow
                variant="subtotal"
                label={
                  <>
                    <span className="font-semibold">Left over</span>
                    {data.savingsRate != null && (
                      <span className="ml-space-2 text-caption text-ink-muted">{formatPercent(data.savingsRate)} saved</span>
                    )}
                  </>
                }
                value={data.net}
                emphasiseNegative
              />
              {Number(data.investedTotal) > 0 && (
                <StatementRow label={link(ledger('INVESTMENT'), 'Invested')} value={data.investedTotal} />
              )}
            </Statement>
          </div>
          <p className="text-caption text-ink-muted">Money out includes bills and EMIs, not just everyday spending.</p>
          <Link to={ledger()} className="text-caption text-accent underline-offset-4 hover:underline">
            Every entry →
          </Link>
        </div>
      )}
    </Disclosure>
  );
}
