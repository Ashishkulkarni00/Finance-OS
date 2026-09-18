import { Row } from '@/components/Row';
import { NumberDisplay } from '@/components/NumberDisplay';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney } from '@/lib/money';
import { useGetNetWorthQuery } from '@/services/positionService';
import { useGetLoansQuery } from '@/services/loanService';
import { useGetGoalsQuery } from '@/services/goalService';

/** Step 4 - net worth, debt, and goals, as they stand right now. SCREEN_SPECS S6.
 *  No deltas yet - a real "moved since last cycle" comparison needs a prior closed-cycle
 *  snapshot to compare against, which doesn't exist for cycle 1. Shown as absolute values
 *  rather than inventing a zero-baseline delta. */
export function WhatMovedStep() {
  const { data: netWorth, isLoading: netWorthLoading } = useGetNetWorthQuery();
  const { data: loansPage, isLoading: loansLoading } = useGetLoansQuery();
  const { data: goalsPage, isLoading: goalsLoading } = useGetGoalsQuery();

  const loans = loansPage?.content ?? [];
  const goals = goalsPage?.content ?? [];

  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">What moved</h1>
        <p className="mt-space-2 text-body text-ink-muted">Where things stand today.</p>
      </div>

      {netWorthLoading ? (
        <Skeleton className="h-16 w-40" />
      ) : (
        <div className="grid grid-cols-2 gap-space-6">
          <NumberDisplay label="Net worth" value={netWorth?.netWorth} role="section" />
          <NumberDisplay label="Total debt" value={netWorth?.totalDebt} role="section" />
        </div>
      )}

      {loans.length > 0 && (
        <div>
          <h2 className="mb-space-2 text-title text-ink">Debt</h2>
          <div className="flex flex-col">
            {loansLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              loans.map((loan) => (
                <Row
                  key={loan.id}
                  domainRule="debt"
                  primary={loan.lender}
                  secondary={`${loan.emisLeft} EMIs left`}
                  trailing={<span className="num text-row text-ink">{formatMoney(loan.outstandingPrincipal)} left</span>}
                />
              ))
            )}
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div>
          <h2 className="mb-space-2 text-title text-ink">Goals</h2>
          <div className="flex flex-col">
            {goalsLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              goals
                .filter((g) => !g.archived)
                .map((goal) => (
                  <Row
                    key={goal.id}
                    domainRule="goal"
                    primary={goal.name}
                    secondary={`${formatMoney(goal.currentAmount)} of ${formatMoney(goal.targetAmount)}`}
                    trailing={<span className="num text-row text-ink">{goal.progressPercent}%</span>}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
