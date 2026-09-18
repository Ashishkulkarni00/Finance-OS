import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, TrendingDown } from 'lucide-react';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney, formatPercent } from '@/lib/money';
import { daysBetween } from '@/lib/dates';
import { useGetCurrentCycleQuery } from '@/services/cycleService';
import { useGetCycleStandingQuery } from '@/services/commitmentInstanceService';
import { useGetLoansQuery } from '@/services/loanService';

const MONTH_YEAR = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' });
const TINT_STYLE = { backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' } as const;

/** A high share of income already committed exposes the whole cycle to one surprise. */
const EXPOSED_THRESHOLD = 0.7;
/** A loan closing within ~6 months is close enough to be worth naming. */
const HELPS_MOST_WITHIN_DAYS = 180;

/**
 * Zone 1 - Plan's missing hero, operationalising PRODUCT_STRATEGY.md §3.4: mirror the
 * position, what you're exposed to, what would help most. No score - an advisory
 * posture, never a verdict. "What's working" is deliberately absent (see
 * PLAN_EXPERIENCE.md §2): it needs cross-cycle history that doesn't exist yet in a
 * fresh database, and a placeholder here would be exactly the confidently-wrong thing
 * ADR-0006 exists to prevent. Silence is more honest than filling the space.
 */
export function StandingZone() {
  const navigate = useNavigate();
  const { data: cycle } = useGetCurrentCycleQuery();
  const { data: standing, isLoading } = useGetCycleStandingQuery(cycle?.id ?? 0, { skip: !cycle });
  const { data: loansPage } = useGetLoansQuery();

  const loans = loansPage?.content ?? [];
  // A loan whose terms were never supplied has no payoff date at all - it can't be
  // "close to payoff" because we don't know when payoff is. Excluded rather than
  // guessed at (see LoanConfidence.java).
  const closeToPayoff = loans
    .filter((l) => {
      if (l.payoffDate == null) return false;
      const days = daysBetween(l.payoffDate);
      return days >= 0 && days <= HELPS_MOST_WITHIN_DAYS;
    })
    .sort((a, b) => daysBetween(a.payoffDate!) - daysBetween(b.payoffDate!))
    .slice(0, 2);

  if (isLoading || !standing) {
    return (
      <div className="flex flex-col gap-space-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-full max-w-md" />
        <Skeleton className="h-5 w-64" />
      </div>
    );
  }

  const exposed = standing.committedShare != null && standing.committedShare > EXPOSED_THRESHOLD;

  return (
    <div className="flex flex-col gap-space-4">
      <div className="flex flex-col gap-space-2">
        <span className="text-micro uppercase tracking-[0.08em] text-ink-muted">Standing</span>
        <p className="num text-section text-ink">
          {formatMoney(standing.incomeTotal)} comes in. {formatMoney(standing.committedTotal)} is committed before you
          spend anything
          {standing.committedShare != null && ` - ${formatPercent(standing.committedShare)}`}.
        </p>
        <p className="text-body text-ink-soft">That leaves about {formatMoney(standing.uncommittedTotal)} for everything else this cycle.</p>
      </div>

      {exposed && (
        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate('/month')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/month');
            }
          }}
          className="flex cursor-pointer items-start gap-space-3 transition-opacity hover:opacity-90"
          style={TINT_STYLE}
        >
          <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" />
          <div className="min-w-0 flex-1">
            <p className="text-body text-ink">Most of what comes in is already spoken for</p>
            <p className="mt-space-1 text-caption text-ink-muted">
              {formatPercent(standing.committedShare)} committed. One unplanned bill uses most of what's left. Open
              Months to see what's due.
            </p>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
        </Card>
      )}

      {closeToPayoff.length > 0 && (
        <div className="flex flex-col gap-space-2">
          {closeToPayoff.map((loan) => (
            <div
              key={loan.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/loans/${loan.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/loans/${loan.id}`);
                }
              }}
              className="flex cursor-pointer items-start gap-space-3 rounded-xl border border-line bg-surface p-space-4 transition-colors duration-150 hover:bg-sunken"
            >
              <TrendingDown size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-positive" />
              <p className="min-w-0 flex-1 text-body text-ink">
                {loan.lender} is close to paid off - debt-free {MONTH_YEAR.format(new Date(loan.payoffDate!))}, freeing{' '}
                {formatMoney(loan.emi)}/month.
              </p>
              <ChevronRight size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
