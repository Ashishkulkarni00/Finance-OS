import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, FileText, Pencil, Trash2 } from 'lucide-react';
import { Amount } from '@/components/Amount';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Row } from '@/components/Row';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { Statement, StatementRow } from '@/components/Statement';
import { StatusPill } from '@/components/StatusPill';
import { CreditCardSheet } from '@/features/cards/components/CreditCardSheet';
import { RecordStatementSheet } from '@/features/cards/components/RecordStatementSheet';
import { cardIdentity, formatShare, ordinal } from '@/features/cards/cardFormat';
import { formatShortDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { useDeleteCardStatementMutation, useGetCardStatementsQuery, useGetCreditCardQuery } from '@/services/cardService';
import { useAppDispatch } from '@/store/hooks';
import { openAddSheet } from '@/store/slices/uiSlice';

const STATUS = {
  PAID: { tone: 'positive', label: 'Paid' },
  DUE: { tone: 'attention', label: 'To pay' },
  OVERDUE: { tone: 'critical', label: 'Overdue' },
} as const;

/**
 * One credit card: its current bill first (what's left to pay and by when, with Pay bill),
 * then the card itself (owed, spent since the statement, limit), the EMIs charged to it,
 * and its statement history.
 */
export default function CreditCardDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const id = Number(accountId);
  const [editing, setEditing] = useState(false);
  const [recording, setRecording] = useState(false);

  const { data: card, isLoading, isError, refetch } = useGetCreditCardQuery(id, { skip: !id });
  const { data: statements } = useGetCardStatementsQuery(id, { skip: !id || !card?.setUp });
  const [deleteStatement] = useDeleteCardStatementMutation();

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-space-6 py-space-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !card) {
    return (
      <div className="mx-auto max-w-2xl py-space-8">
        <ErrorState message="We couldn't load this card." onRetry={refetch} />
      </div>
    );
  }

  const bill = card.latestStatement;
  const share = formatShare(card.utilisation);
  const identity = cardIdentity(card);

  const payBill = () => {
    if (!bill) return;
    dispatch(
      openAddSheet({
        type: 'TRANSFER',
        amount: bill.remaining,
        accountId: card.payFromAccount?.id,
        toAccountId: card.accountId,
        description: `${card.name} bill`,
      }),
    );
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-space-8 py-space-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-space-2 self-start text-caption text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-space-3">
        <div className="flex flex-col gap-space-2">
          <h1 className="text-title text-ink">{card.name}</h1>
          {identity && <p className="text-caption text-ink-muted">{identity}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          <Pencil size={14} strokeWidth={1.5} />
          Edit card
        </Button>
      </div>

      {!card.setUp && (
        <div
          className="flex items-start gap-space-3 rounded-xl p-space-4"
          style={{ backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' }}
        >
          <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
          <div className="flex flex-col gap-space-2">
            <p className="text-body text-ink">Finish setting up this card</p>
            <p className="text-caption text-ink-muted">
              Add its credit limit, statement day and due day to track its bills, available credit and due dates.
            </p>
            <Button variant="secondary" size="sm" className="self-start" onClick={() => setEditing(true)}>
              Set up card
            </Button>
          </div>
        </div>
      )}

      {card.setUp && (
        <section>
          <SectionHeader
            trailing={
              <button type="button" onClick={() => setRecording(true)} className="text-accent underline-offset-4 hover:underline">
                + Record statement
              </button>
            }
          >
            Current bill
          </SectionHeader>
          {bill ? (
            <div className="flex flex-col gap-space-4">
              <Statement notes>
                <StatementRow
                  label={`Statement of ${formatShortDate(bill.statementDate)}`}
                  value={bill.totalAmount}
                  note={`Minimum due ${formatMoney(bill.minimumDue)}.`}
                />
                <StatementRow label="Paid since" value={bill.paidSince} deduct note="Payments and refunds on the card after the statement date." />
                <StatementRow
                  variant="total"
                  label="Left to pay"
                  value={bill.remaining}
                  note={
                    bill.status === 'PAID'
                      ? 'Paid in full.'
                      : `Due ${formatShortDate(bill.dueDate)}${Number(bill.minimumDueRemaining) > 0 ? ` · pay at least ${formatMoney(bill.minimumDueRemaining)} to avoid a late fee` : ''}.`
                  }
                />
              </Statement>
              <div className="flex flex-wrap items-center gap-space-3">
                <StatusPill tone={STATUS[bill.status].tone}>{STATUS[bill.status].label}</StatusPill>
                {bill.status !== 'PAID' && (
                  <Button variant="primary" size="sm" onClick={payBill}>
                    Pay bill
                  </Button>
                )}
              </div>
              {bill.status !== 'PAID' && (
                <p className="text-caption text-ink-muted">
                  Pay bill opens a transfer {card.payFromAccount ? `from ${card.payFromAccount.name} ` : ''}to this card for what’s left.
                  It moves money you already counted as spent, so what’s free this month doesn’t change.
                </p>
              )}
            </div>
          ) : (
            <p className="text-body text-ink-soft">
              No statement recorded yet.
              {card.nextStatementDate && ` When the ${formatShortDate(card.nextStatementDate)} statement arrives, record it here.`} The
              total is filled in from what you’ve entered on this card.
            </p>
          )}
        </section>
      )}

      <section>
        <SectionHeader>The card</SectionHeader>
        <Statement notes>
          <StatementRow
            label="Owed now"
            value={card.outstanding}
            note="Everything spent on the card and not paid yet. It’s already taken out of what’s free this month."
          />
          {card.unbilled != null && (
            <StatementRow label="Spent since the statement" value={card.unbilled} note="Heading for the next bill." />
          )}
          {card.setUp && (
            <StatementRow
              label="Credit limit"
              value={card.creditLimit}
              note={`Statement on the ${ordinal(card.statementDay!)}, bill due the ${ordinal(card.dueDay!)}.`}
            />
          )}
          {card.setUp && (
            <StatementRow
              variant="subtotal"
              label="Available credit"
              value={card.availableCredit}
              note={share ? `${share} of the limit used.` : undefined}
            />
          )}
        </Statement>
        <p className="mt-space-3 text-caption text-ink-muted">
          Tracked since {formatShortDate(card.trackedSince)}
          {card.setUp && ` · usually paid from ${card.payFromAccount?.name ?? 'not set'}`}.{' '}
          <button type="button" onClick={() => navigate(`/accounts/${card.accountId}`)} className="text-accent hover:underline">
            See every entry on this card
          </button>
        </p>
      </section>

      {card.emis.length > 0 && (
        <section>
          <SectionHeader trailing={<span className="num">{formatMoney(card.emiMonthlyTotal)} a month</span>}>EMIs on this card</SectionHeader>
          <div className="flex flex-col">
            {card.emis.map((emi) => (
              <Row
                key={emi.loanId}
                primary={emi.name}
                secondary={`Next charged ${formatShortDate(emi.nextChargeDate)} · ${emi.emisLeft} left · last ${formatShortDate(emi.lastChargeDate)}`}
                trailing={<Amount value={emi.emi} role="row" className="text-ink" />}
                onClick={() => navigate(`/loans/${emi.loanId}`)}
              />
            ))}
          </div>
          <p className="mt-space-3 text-caption text-ink-muted">
            Each EMI is charged to this card and paid through its bill. When one appears on your statement, record it as an expense on
            this card, or add it to your plan as a bill that leaves from this card.
          </p>
        </section>
      )}

      {statements && statements.length > 0 && (
        <section>
          <SectionHeader>Statements</SectionHeader>
          <div className="flex flex-col">
            {statements.map((s) => (
              <Row
                key={s.id}
                primary={`Statement of ${formatShortDate(s.statementDate)}`}
                secondary={`Due ${formatShortDate(s.dueDate)} · minimum ${formatMoney(s.minimumDue)}`}
                trailing={
                  <span className="flex items-center gap-space-2">
                    <Amount value={s.totalAmount} role="row" className="text-ink" />
                    <button
                      type="button"
                      aria-label="Delete this statement"
                      title="Delete - to enter it again"
                      onClick={() => {
                        if (window.confirm('Delete this statement? You can record it again afterwards.')) {
                          void deleteStatement({ accountId: card.accountId, statementId: s.id });
                        }
                      }}
                      className="rounded-md p-space-1 text-ink-muted transition-colors hover:bg-sunken hover:text-critical"
                    >
                      <Trash2 size={15} strokeWidth={1.5} aria-hidden />
                    </button>
                  </span>
                }
              />
            ))}
          </div>
        </section>
      )}

      {card.setUp && !bill && (
        <Button variant="secondary" className="self-start" onClick={() => setRecording(true)}>
          <FileText size={16} strokeWidth={1.5} />
          Record statement
        </Button>
      )}

      <CreditCardSheet key={`edit-${card.accountId}-${editing}`} open={editing} onClose={() => setEditing(false)} card={card} />
      {card.setUp && (
        <RecordStatementSheet key={`statement-${card.accountId}-${recording}`} card={card} open={recording} onClose={() => setRecording(false)} />
      )}
    </div>
  );
}
