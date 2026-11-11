import { useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { Statement, StatementRow } from '@/components/Statement';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { Disclosure } from '@/components/Disclosure';
import { FactStrip } from '@/components/FactStrip';
import { InfoTip } from '@/components/InfoTip';
import { DetailError, DetailHeader, DetailHero, DetailLoading, DetailPage } from '@/components/detail/DetailPage';
import { EditLoanSheet } from '@/features/debts/components/EditLoanSheet';
import { AddCommitmentSheet } from '@/features/plan/components/AddCommitmentSheet';
import { LoanPlanLink, loanNeedsPlanBill } from '@/features/debts/components/LoanPlanLink';
import { LoanCoverLink } from '@/features/cover/components/LoanCoverLink';
import { termsMismatch } from '@/features/debts/loanTerms';
import { LOAN_FIGURE_HINT } from '@/features/debts/loanHelp';
import { formatShortDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { useGetLoanQuery, useGetLoanScheduleQuery } from '@/services/loanService';

const MONTH_YEAR = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
const PAID_VIA_LABEL: Record<string, string> = { BANK: 'A bank account, directly', CARD: 'Billed to a credit card' };

/** A label with its plain-language meaning one tap away, at the point of confusion. */
function Explained({ label, help }: { label: string; help: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-space-1">
      {label}
      <InfoTip label={label}>{help}</InfoTip>
    </span>
  );
}

/**
 * A loan's own page, on the shared detail template (UI_UX_REVAMP_PLAN 4.8): what is left to repay and
 * when it ends first, the EMI and rate as three facts, then the places you act (plan link,
 * prepayment) and the schedule. The original terms and how each figure is worked out are folded.
 */
export default function LoanDetailPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const id = Number(loanId);
  const [planningPrepayment, setPlanningPrepayment] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: loan, isLoading, isError, error, refetch } = useGetLoanQuery(id, { skip: !id });
  const { data: schedule } = useGetLoanScheduleQuery(id, { skip: !id });

  if (isLoading) return <DetailLoading />;
  if (isError || !loan) {
    return <DetailError what="loan" backTo="/money/debts" backLabel="Debts" error={error} onRetry={refetch} />;
  }

  const upcoming = (schedule ?? []).filter((e) => !e.paid);
  const paid = (schedule ?? []).filter((e) => e.paid);
  // EMIs that have fallen due since the outstanding figure was entered - all counts, no money.
  const emisSinceBalance = loan.emisRemaining - loan.emisLeft;
  const mismatch = termsMismatch(loan);
  const hasOriginal = loan.principal != null || loan.tenureMonths != null || loan.startDate != null || loan.originalFirstEmiDate != null;

  return (
    <DetailPage backLabel="Debts" backTo="/money/debts">
      <DetailHeader
        title={loan.lender}
        subtitle={`Tracked against ${loan.account.name}`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} strokeWidth={1.5} />
            Edit loan
          </Button>
        }
      />
      {/* Keyed on open state so each opening starts from the loan's current values. */}
      <EditLoanSheet key={`loan-${loan.id}-${editing}`} loan={loan} open={editing} onClose={() => setEditing(false)} />

      <div className="m-card flex flex-col gap-space-5 max-md:gap-space-4">
        <DetailHero
          label={<Explained label="Outstanding today" help={LOAN_FIGURE_HINT.outstandingToday} />}
          sentence={
            <span className="flex flex-wrap items-center gap-x-space-1">
              {loan.payoffDate && loan.emisLeft > 0 ? (
                <>
                  <span className="font-medium text-positive">Debt-free {MONTH_YEAR.format(new Date(loan.payoffDate))}</span>
                  <InfoTip label="debt-free date">{LOAN_FIGURE_HINT.debtFree}</InfoTip>
                </>
              ) : (
                <span className="font-medium text-ink">No EMIs left</span>
              )}
              <span>
                · {loan.emisLeft} {loan.emisLeft === 1 ? 'EMI' : 'EMIs'} left
              </span>
              <InfoTip label="EMIs left">{LOAN_FIGURE_HINT.emisLeft}</InfoTip>
              {loan.amountRepaid != null && Number(loan.amountRepaid) > 0 && (
                <span>
                  · {formatMoney(loan.amountRepaid)} principal repaid since {formatShortDate(loan.balanceAsOf)}
                </span>
              )}
            </span>
          }
        >
          <Amount value={loan.outstandingPrincipal} role="hero" />
        </DetailHero>

        <FactStrip
          className="border-y border-line"
          facts={[
            { label: 'EMI', value: <Amount value={loan.emi} role="row" /> },
            { label: 'Still to pay in all', value: <Amount value={loan.remainingPayments} role="row" /> },
            { label: 'Interest rate', value: loan.annualRate != null ? `${loan.annualRate}% a year` : 'Not supplied' },
          ]}
        />
      </div>

      {mismatch && (
        <div
          className="flex items-start gap-space-3 rounded-xl p-space-4"
          style={{ backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' }}
        >
          <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
          <div className="flex flex-col gap-space-1">
            <p className="text-body text-ink">These figures don’t add up</p>
            <p className="num text-caption text-attention">{mismatch}</p>
            <p className="text-caption text-ink-muted">
              One of outstanding principal, rate, EMI or EMIs left is probably off, so the payoff date and schedule can’t be
              trusted yet. Check your latest statement and edit the loan.
            </p>
          </div>
        </div>
      )}

      {/* Why this loan exists, when it's repaying an insurance premium financed on a card
          (ADR-0016). Renders nothing for a loan that is just a loan. */}
      <LoanCoverLink loanId={loan.id} />

      <section>
        <SectionHeader>Details</SectionHeader>
        <div className="flex flex-col">
          <Row
            primary={<Explained label="Next EMI" help={LOAN_FIGURE_HINT.nextEmi} />}
            trailing={<span className="text-row text-ink">{formatShortDate(loan.firstEmiDate)}</span>}
          />
          <Row primary="Paid via" trailing={<span className="text-row text-ink">{PAID_VIA_LABEL[loan.paidVia] ?? loan.paidVia}</span>} />
          {(loan.planCommitmentId != null || loanNeedsPlanBill(loan)) && (
            <Row
              primary={<Explained label="In your plan" help="Whether this EMI is a commitment on Month, so what's free already allows for it." />}
              trailing={<LoanPlanLink loan={loan} />}
            />
          )}
          <Row
            primary={<Explained label="Paid from" help={LOAN_FIGURE_HINT.paidFrom} />}
            trailing={<span className="text-row text-ink">{loan.payFromAccount?.name ?? 'Not recorded'}</span>}
          />
          {loan.status !== 'CLOSED' && (
            <Row
              primary={
                <Explained
                  label="Prepayment"
                  help="Plan a lump sum into this loan for a month; after paying it, edit the loan's outstanding amount so the payoff date updates."
                />
              }
              trailing={
                <Button size="sm" variant="secondary" onClick={() => setPlanningPrepayment(true)}>
                  Plan a prepayment
                </Button>
              }
            />
          )}
        </div>
      </section>
      {planningPrepayment && (
        <AddCommitmentSheet
          open
          onClose={() => setPlanningPrepayment(false)}
          preset={{
            kind: 'TRANSFER',
            once: true,
            name: `${loan.lender} prepayment`,
            toAccountId: loan.account.id,
            toLabel: `${loan.account.name} (prepayment)`,
          }}
        />
      )}

      {schedule && schedule.length > 0 && (
        <section>
          <SectionHeader trailing={`${upcoming.length} remaining`}>
            <Explained label="Schedule" help={LOAN_FIGURE_HINT.schedule} />
          </SectionHeader>
          <div className="flex flex-col">
            {upcoming.slice(0, 6).map((entry) => (
              <Row
                key={entry.period}
                primary={`EMI ${entry.period}`}
                secondary={formatShortDate(entry.dueDate)}
                trailing={<Amount value={entry.closingBalance} role="row" className="text-ink-muted" />}
              />
            ))}
          </div>
          {paid.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowPaid((v) => !v)}
                aria-expanded={showPaid}
                className="mt-space-3 flex items-center gap-space-2 text-label text-ink-muted"
              >
                Due date passed · {paid.length}
                {showPaid ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
              </button>
              {showPaid && (
                <div className="mt-space-2 flex flex-col">
                  {paid.map((entry) => (
                    <Row
                      key={entry.period}
                      primary={`EMI ${entry.period}`}
                      secondary={formatShortDate(entry.dueDate)}
                      trailing={<Amount value={entry.closingBalance} role="row" className="text-ink-muted" />}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          <p className="mt-space-3 text-caption text-ink-muted">Each row shows the outstanding principal after that EMI.</p>
        </section>
      )}

      <div className="detail-group flex flex-col max-md:gap-space-6">
        <Disclosure storageKey="kosh.loan.figures" label="How these figures are worked out" summary="outstanding, EMI, still to pay">
          <Statement notes>
            <StatementRow
              label={<Explained label="Outstanding today" help={LOAN_FIGURE_HINT.outstandingToday} />}
              value={loan.outstandingPrincipal}
              note={
                loan.outstandingPrincipal == null
                  ? `Needs the interest rate to work out after the ${emisSinceBalance} EMI${emisSinceBalance === 1 ? '' : 's'} since ${formatShortDate(loan.balanceAsOf)}.`
                  : emisSinceBalance === 0
                    ? `As entered for ${formatShortDate(loan.balanceAsOf)}.`
                    : `After the ${emisSinceBalance} EMI${emisSinceBalance === 1 ? '' : 's'} due since ${formatShortDate(loan.balanceAsOf)}.`
              }
            />
            <StatementRow
              label={<Explained label="EMI" help={LOAN_FIGURE_HINT.emi} />}
              value={loan.emi}
              note={loan.emiDay ? `Debited on the ${loan.emiDay}th, every month.` : 'Debited every month.'}
            />
            <StatementRow
              label={<Explained label="Still to pay" help={LOAN_FIGURE_HINT.stillToPay} />}
              value={loan.remainingPayments}
              note={`${loan.emisLeft} EMIs left, at this EMI.`}
            />
            <StatementRow
              variant="subtotal"
              label={<Explained label={`Outstanding on ${formatShortDate(loan.balanceAsOf)}`} help={LOAN_FIGURE_HINT.outstandingOn} />}
              value={loan.outstandingBalance}
              note={
                loan.annualRate == null
                  ? `${loan.emisRemaining} EMIs left then · rate not supplied`
                  : `${loan.emisRemaining} EMIs left then · ${loan.annualRate}% a year${loan.rateType === 'FLOATING' ? ' (floating)' : ''}`
              }
            />
          </Statement>
        </Disclosure>

        {hasOriginal && (
          <Disclosure storageKey="kosh.loan.terms" label="Loan terms" summary="amount, tenure, start date">
            <div className="flex flex-col">
              {loan.principal != null && (
                <Row
                  primary={<Explained label="Loan amount" help={LOAN_FIGURE_HINT.principal} />}
                  trailing={<Amount value={loan.principal} role="row" className="text-ink" />}
                />
              )}
              {loan.tenureMonths != null && (
                <Row
                  primary={<Explained label="Tenure" help={LOAN_FIGURE_HINT.tenure} />}
                  trailing={<span className="num text-row text-ink">{loan.tenureMonths} months</span>}
                />
              )}
              {loan.startDate != null && (
                <Row
                  primary={<Explained label="Disbursed on" help={LOAN_FIGURE_HINT.startDate} />}
                  trailing={<span className="text-row text-ink">{formatShortDate(loan.startDate)}</span>}
                />
              )}
              {loan.originalFirstEmiDate != null && (
                <Row
                  primary={<Explained label="First EMI" help={LOAN_FIGURE_HINT.originalFirstEmiDate} />}
                  trailing={<span className="text-row text-ink">{formatShortDate(loan.originalFirstEmiDate)}</span>}
                />
              )}
            </div>
          </Disclosure>
        )}
      </div>

      <p className="max-w-[62ch] text-caption text-ink-muted">
        EMIs aren’t recorded one by one, so each counts as paid once its due date passes. If one was missed or you prepaid,
        edit the loan and update the outstanding principal from your statement.
      </p>
    </DetailPage>
  );
}
