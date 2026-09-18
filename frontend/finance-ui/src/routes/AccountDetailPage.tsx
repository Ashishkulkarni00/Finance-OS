import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CreditCard, Pencil, RefreshCw } from 'lucide-react';
import { LinkedDebitCards } from '@/features/cards/components/LinkedDebitCards';
import { Button } from '@/components/Button';
import { EditAccountSheet } from '@/features/accounts/components/EditAccountSheet';
import { UpdateBalanceSheet } from '@/features/accounts/components/UpdateBalanceSheet';
import { Row } from '@/components/Row';
import { StatusPill } from '@/components/StatusPill';
import { Statement, StatementRow } from '@/components/Statement';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/ErrorState';
import { formatShortDate, formatFullDate } from '@/lib/dates';
import { useGetAccountQuery } from '@/services/accountService';
import { useGetProjectionQuery } from '@/services/projectionService';
import { useGetTransactionsQuery } from '@/services/transactionService';

/**
 * "Why is this account short?" - the destination for every shortfall row on Today and
 * every balance figure elsewhere. Shows the projection's actual cause (which
 * commitment, and when) rather than leaving the user to infer it, and the recent
 * ledger so the current balance is one tap from its proof (DESIGN_SYSTEM §12 rule 10).
 */
export default function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const id = Number(accountId);
  const [editingDetails, setEditingDetails] = useState(false);
  const [updatingBalance, setUpdatingBalance] = useState(false);

  const { data: account, isLoading, isError, refetch } = useGetAccountQuery(id, { skip: !id });
  const { data: projection } = useGetProjectionQuery(id, { skip: !id || !account?.countsAsSpendable });
  const { data: transactionsPage } = useGetTransactionsQuery({ accountId: id }, { skip: !id });

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-space-6 py-space-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="mx-auto max-w-2xl py-space-8">
        <ErrorState message="We couldn't load this account." onRetry={refetch} />
      </div>
    );
  }

  const status = account.archived
    ? { tone: 'neutral' as const, label: 'Archived' }
    : account.belowMinimumBalance
      ? { tone: 'attention' as const, label: 'Below minimum' }
      : account.countsAsSpendable
        ? { tone: 'positive' as const, label: 'Spendable' }
        : account.liability
          ? { tone: 'neutral' as const, label: 'Liability' }
          : // Orange, in the same pill as green "Spendable" - so the two states read as a
            // pair at a glance, rather than "Not spendable" looking like no status at all.
            { tone: 'attention' as const, label: 'Not spendable' };

  const nextDeduction = projection && projection.deductions.length > 0
    ? [...projection.deductions].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
    : undefined;

  const transactions = transactionsPage?.content ?? [];

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

      <div className="flex flex-col gap-space-2">
        <div className="flex flex-wrap items-center justify-between gap-space-3">
          <div className="flex items-center gap-space-3">
            <h1 className="text-title text-ink">{account.name}</h1>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </div>
          {!account.archived && (
            <div className="flex items-center gap-space-2">
              <Button variant="secondary" size="sm" onClick={() => setUpdatingBalance(true)}>
                <RefreshCw size={14} strokeWidth={1.5} />
                Update balance
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingDetails(true)}>
                <Pencil size={14} strokeWidth={1.5} />
                Edit details
              </Button>
              {account.type === 'CREDIT_CARD' && (
                <Button variant="secondary" size="sm" onClick={() => navigate(`/cards/${account.id}`)}>
                  <CreditCard size={14} strokeWidth={1.5} />
                  Open card
                </Button>
              )}
            </div>
          )}
        </div>
        {/* Keyed on open state so each opening starts from the account's current values. */}
        <UpdateBalanceSheet
          key={`balance-${account.id}-${updatingBalance}`}
          account={account}
          open={updatingBalance}
          onClose={() => setUpdatingBalance(false)}
        />
        <EditAccountSheet
          key={`details-${account.id}-${editingDetails}`}
          account={account}
          open={editingDetails}
          onClose={() => setEditingDetails(false)}
        />
        {(account.institution || account.lastFour) && (
          <p className="text-caption text-ink-muted">
            {account.institution}
            {account.institution && account.lastFour && ' · '}
            {account.lastFour && `•• ${account.lastFour}`}
          </p>
        )}
        {account.type === 'BANK' && !account.archived && <LinkedDebitCards accountId={account.id} />}
      </div>

      <Statement notes>
        <StatementRow label="Current balance" value={account.currentBalance} emphasiseNegative note={`As of ${formatShortDate(account.balanceAsOf)}`} />
        {account.available !== account.currentBalance && (
          <StatementRow
            label="Available"
            value={account.available}
            emphasiseNegative
            note="What's actually yours to spend, after reservations and any mandatory minimum."
          />
        )}
        {account.minimumBalance && (
          <StatementRow
            label="Minimum balance"
            value={account.minimumBalance}
            note={account.minimumBalanceMandatory ? 'Mandatory - going below can attract a penalty.' : 'A target, not enforced by the bank.'}
          />
        )}
        <StatementRow
          variant="subtotal"
          label="Opening balance"
          value={account.openingBalance}
          note={`As of ${formatShortDate(account.openingAsOf)} · ${account.openingConfidence.toLowerCase()}`}
        />
      </Statement>

      {projection?.shortfall && (
        <div className="flex items-start gap-space-3 rounded-xl p-space-5" style={{ backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' }}>
          <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" />
          <div className="flex-1">
            {Number(account.currentBalance) < 0 ? (
              <p className="text-body text-ink">This account is already below zero.</p>
            ) : (
              <p className="text-body text-ink">
                Projected to fall short by {formatShortDate(projection.projectionDate)}
                {nextDeduction && (
                  <>
                    , when <strong className="font-medium">{nextDeduction.name}</strong> leaves.
                  </>
                )}
              </p>
            )}
            {projection.deductions.length > 0 && (
              <div className="mt-space-3 flex flex-col">
                {[...projection.deductions]
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .map((d) => (
                    <Row
                      key={d.commitmentInstanceId}
                      primary={d.name}
                      secondary={formatShortDate(d.dueDate)}
                      trailing={<Amount value={d.amount} role="row" className="text-ink" />}
                      onClick={() => navigate(`/commitments/${d.commitmentInstanceId}`)}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      <section>
        <SectionHeader trailing={transactions.length > 0 ? `${transactions.length} recent` : undefined}>Recent activity</SectionHeader>
        {transactions.length === 0 ? (
          <p className="text-caption text-ink-muted">Nothing recorded on this account yet.</p>
        ) : (
          <div className="flex flex-col">
            {transactions.slice(0, 10).map((tx) => (
              <Row
                key={tx.id}
                primary={tx.description}
                secondary={formatFullDate(new Date(tx.date))}
                trailing={<Amount value={tx.amount} role="row" className="text-ink" />}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate(`/ledger?account=${account.id}&cycle=all`)}
          className="mt-space-3 text-label text-accent hover:underline"
        >
          See all in the ledger
        </button>
      </section>
    </div>
  );
}
