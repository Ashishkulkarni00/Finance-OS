import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, Pencil, RefreshCw } from 'lucide-react';
import { LinkedDebitCards } from '@/features/cards/components/LinkedDebitCards';
import { Button } from '@/components/Button';
import { EditAccountSheet } from '@/features/accounts/components/EditAccountSheet';
import { UpdateBalanceSheet } from '@/features/accounts/components/UpdateBalanceSheet';
import { Row } from '@/components/Row';
import { StatusPill } from '@/components/StatusPill';
import { Statement, StatementRow } from '@/components/Statement';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { Disclosure } from '@/components/Disclosure';
import { FactStrip, type Fact } from '@/components/FactStrip';
import {
  ArchivedNotice,
  DangerZone,
  DetailError,
  DetailHeader,
  DetailHero,
  DetailLoading,
  DetailPage,
  type DangerItemProps,
} from '@/components/detail/DetailPage';
import { formatShortDate, formatFullDate } from '@/lib/dates';
import {
  useArchiveAccountMutation,
  useDeleteAccountMutation,
  useGetAccountQuery,
  useUnarchiveAccountMutation,
} from '@/services/accountService';
import { SetAsideSection } from '@/features/accounts/components/SetAsideSection';
import { useGetProjectionQuery } from '@/services/projectionService';
import { useGetTransactionsQuery } from '@/services/transactionService';

/**
 * An account's own page, on the shared detail template (UI_UX_REVAMP_PLAN 4.8): the balance and its
 * as-of date first, three facts under it, then what is coming out of it, what is set aside on it,
 * and its recent activity. How the balance is made up is one tap away; archive and delete are last.
 */
export default function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const id = Number(accountId);
  const [editingDetails, setEditingDetails] = useState(false);
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: account, isLoading, isError, error, refetch } = useGetAccountQuery(id, { skip: !id });
  const { data: projection } = useGetProjectionQuery(id, { skip: !id || !account?.countsAsSpendable });
  const { data: transactionsPage } = useGetTransactionsQuery({ accountId: id }, { skip: !id });
  const [archiveAccount, { isLoading: archiving }] = useArchiveAccountMutation();
  const [unarchiveAccount, { isLoading: unarchiving }] = useUnarchiveAccountMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setActionError(null);
    try {
      await action();
      after?.();
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "That didn't work. Try again.");
    }
  };

  if (isLoading) return <DetailLoading />;
  if (isError || !account) {
    return <DetailError what="account" backTo="/money/accounts" backLabel="Money" error={error} onRetry={refetch} />;
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
            // difference rather than two shades of the same thing.
            { tone: 'attention' as const, label: 'Not spendable' };

  const nextDeduction =
    projection && projection.deductions.length > 0
      ? [...projection.deductions].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
      : undefined;

  const transactions = transactionsPage?.content ?? [];

  // Three facts, only the ones that exist. Every value is the server's own field.
  const facts: Fact[] = [];
  if (account.available !== account.currentBalance) {
    facts.push({ label: 'Available', value: <Amount value={account.available} role="row" emphasiseNegative /> });
  }
  if (account.minimumBalance) {
    facts.push({ label: account.minimumBalanceMandatory ? 'Minimum balance (mandatory)' : 'Minimum balance', value: <Amount value={account.minimumBalance} role="row" /> });
  }
  facts.push({ label: `Opening balance · ${formatShortDate(account.openingAsOf)}`, value: <Amount value={account.openingBalance} role="row" /> });

  const identity = [account.institution, account.lastFour && `•• ${account.lastFour}`].filter(Boolean).join(' · ');

  const danger: DangerItemProps[] = account.archived
    ? []
    : [
        {
          title: 'Archive this account',
          body: 'It stays out of your lists and totals, and nothing new can be recorded on it. Everything it already holds is untouched, and you can unarchive it any time.',
          actionLabel: 'Archive',
          busy: archiving,
          confirm: {
            title: `Archive ${account.name}?`,
            body: 'It leaves your lists and totals, and nothing new can be recorded on it. Its history stays, and you can unarchive it any time.',
            confirmLabel: 'Archive',
          },
          onAction: () => run(() => archiveAccount(account.id).unwrap()),
        },
        {
          title: 'Delete this account',
          body: 'Only works for an account added by mistake. One with any history can’t be deleted - archive it instead, which keeps the record.',
          actionLabel: 'Delete',
          busy: deleting,
          destructive: true,
          confirm: {
            title: `Delete ${account.name}?`,
            body: 'If it has any history it can’t be deleted - archive it instead, which keeps the record and takes it out of your lists.',
            confirmLabel: 'Delete account',
          },
          onAction: () => run(() => deleteAccount(account.id).unwrap(), () => navigate('/money/accounts', { replace: true })),
        },
      ];

  return (
    <DetailPage backLabel="Money" backTo="/money/accounts">
      <DetailHeader
        title={account.name}
        chips={<StatusPill tone={status.tone}>{status.label}</StatusPill>}
        subtitle={identity || undefined}
        actions={
          !account.archived && (
            <>
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
            </>
          )
        }
      />

      {account.archived && (
        <ArchivedNotice
          title="Archived"
          body="It stays out of your lists and totals, and nothing new can be recorded on it. Everything it already holds is untouched - unarchive to use it again."
          actionLabel="Unarchive"
          busy={unarchiving}
          onAction={() => void run(() => unarchiveAccount(account.id).unwrap())}
        />
      )}
      {actionError && account.archived && <p className="text-caption text-critical">{actionError}</p>}

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

      <div className="m-card flex flex-col gap-space-5 max-md:gap-space-4">
        <DetailHero label="Current balance" sentence={`As of ${formatShortDate(account.balanceAsOf)}.`}>
          <Amount value={account.currentBalance} role="hero" emphasiseNegative />
        </DetailHero>
        <FactStrip facts={facts} className="border-y border-line" />
      </div>

      {account.type === 'BANK' && !account.archived && <LinkedDebitCards accountId={account.id} />}

      {projection?.shortfall && (
        <div
          className="flex items-start gap-space-3 rounded-xl p-space-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' }}
        >
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

      {account.type !== 'CREDIT_CARD' && !account.archived && <SetAsideSection accountId={account.id} />}

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
          See all in the Ledger
        </button>
      </section>

      <Disclosure storageKey="kosh.account.figures" label="How these figures are worked out" summary="balance, available, minimum, opening">
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
      </Disclosure>

      <DangerZone items={danger} error={!account.archived ? actionError : null} />
    </DetailPage>
  );
}
