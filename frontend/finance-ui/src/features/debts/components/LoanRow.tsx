import { Amount } from '@/components/Amount';
import { LedgerRow, DomainRule, MetaFacts } from '@/components/LedgerRow';
import { ConfidencePill } from './ConfidencePill';
import { formatShortDate } from '@/lib/dates';
import type { LoanResponse } from '@/types/loan';

const MONTH_YEAR = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' });

/** "5th of the month" - the EMI day as a phrase rather than a bare integer. */
function ordinalDay(day: number): string {
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix}`;
}

/**
 * One loan. The secondary line is the payoff countdown - "₹58,000 repaid · debt-free Oct
 * 2029" - never a bare outstanding balance (SCREEN_SPECS S4: emotionally the most
 * important block on the screen).
 *
 * <p>Every clause of it is conditional on us actually knowing. A loan whose terms were
 * never supplied has no payoff date and no repaid figure, so it says so rather than
 * printing a date derived from a guess; and `amountRepaid` is suppressed at zero because
 * "₹0 repaid" on a running loan is a fact about our records, not about the loan.
 */
export function LoanRow({ loan }: { loan: LoanResponse }) {
  const repaid = loan.amountRepaid != null && Number(loan.amountRepaid) > 0 ? loan.amountRepaid : null;

  const progress = loan.payoffDate
    ? `debt-free ${MONTH_YEAR.format(new Date(loan.payoffDate))}`
    : 'payoff date needs the real terms';

  return (
    <LedgerRow
      to={`/loans/${loan.id}`}
      leading={<DomainRule domain="debt" />}
      primary={
        <span className="flex items-center gap-space-2">
          {loan.account.name}
          <ConfidencePill confidence={loan.confidence} status={loan.status} />
        </span>
      }
      secondary={
        <span className={loan.payoffDate ? 'num text-positive' : 'text-ink-muted'}>
          {repaid && (
            <>
              <Amount value={repaid} role="caption" className="text-positive" /> repaid ·{' '}
            </>
          )}
          {progress}
        </span>
      }
      meta={
        <MetaFacts
          items={[
            { label: 'Due', value: loan.emiDay ? `${ordinalDay(loan.emiDay)} monthly` : formatShortDate(loan.firstEmiDate) },
            {
              label: loan.paidVia === 'CARD' ? 'Billed to' : 'From',
              value: loan.payFromAccount?.name ?? 'not recorded',
              className: loan.payFromAccount ? undefined : 'text-ink-soft italic',
            },
          ]}
        />
      }
      amount={
        <>
          <span className="text-ink">
            <Amount value={loan.emi} role="row" />
            <span className="text-caption text-ink-muted">/mo</span>
          </span>
          <div className="text-caption text-ink-muted">
            <Amount value={loan.remainingPayments} role="caption" /> to go
          </div>
        </>
      }
    />
  );
}
