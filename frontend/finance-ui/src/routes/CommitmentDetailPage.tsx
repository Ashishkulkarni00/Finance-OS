import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Pencil } from 'lucide-react';
import { EditCommitmentSheet } from '@/features/plan/components/EditCommitmentSheet';
import { Card } from '@/components/Card';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { StatusPill } from '@/components/StatusPill';
import { SectionHeader } from '@/components/SectionHeader';
import { Statement, StatementRow } from '@/components/Statement';
import { Amount } from '@/components/Amount';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/ErrorState';
import { formatShortDate, formatFullDate } from '@/lib/dates';
import { useAppDispatch } from '@/store/hooks';
import { openSettleSheet } from '@/store/slices/uiSlice';
import {
  useGetCommitmentInstanceDetailQuery,
  useConfirmCommitmentInstanceMutation,
  useSkipCommitmentInstanceMutation,
  useUnskipCommitmentInstanceMutation,
} from '@/services/commitmentInstanceService';
import type { CommitmentInstanceStatus } from '@/types/commitment';

const STATUS_TONE: Record<CommitmentInstanceStatus, 'neutral' | 'positive' | 'attention' | 'critical'> = {
  PENDING: 'neutral',
  PART_PAID: 'attention',
  PAID: 'positive',
  OVERDUE: 'critical',
  UNVERIFIED: 'attention',
  NEEDS_REVIEW: 'attention',
  SETTLED_EARLIER: 'positive',
  SKIPPED: 'neutral',
};

const STATUS_LABEL: Record<CommitmentInstanceStatus, string> = {
  PENDING: 'Pending',
  PART_PAID: 'Part paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  UNVERIFIED: 'Unverified - not yet confirmed with the bank',
  NEEDS_REVIEW: 'Needs a look - something doesn\'t add up',
  SETTLED_EARLIER: 'Settled earlier',
  SKIPPED: 'Skipped this month',
};

const FREQUENCY_LABEL: Record<string, string> = { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', ANNUAL: 'Annual' };

function ordinal(n: number): string {
  if (n % 10 === 1 && n !== 11) return `${n}st`;
  if (n % 10 === 2 && n !== 12) return `${n}nd`;
  if (n % 10 === 3 && n !== 13) return `${n}rd`;
  return `${n}th`;
}

/**
 * "Why is this number what it is?" for a single commitment - the detail layer the
 * user asked for: clicking anything on Months or Today's Needs You should open
 * this, not a dead end. See docs/design/PRODUCT_STRATEGY.md §3.3 / SCREEN_PURPOSE_AUDIT §1.
 */
export default function CommitmentDetailPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const id = Number(instanceId);
  const [editing, setEditing] = useState(false);

  const { data, isLoading, isError, refetch } = useGetCommitmentInstanceDetailQuery(id, { skip: !id });
  const [confirm, { isLoading: confirming }] = useConfirmCommitmentInstanceMutation();
  const [skip] = useSkipCommitmentInstanceMutation();
  const [unskip] = useUnskipCommitmentInstanceMutation();

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-space-6 py-space-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl py-space-8">
        <ErrorState message="We couldn't load this commitment." onRetry={refetch} />
      </div>
    );
  }

  const isSettled = data.status === 'PAID' || data.status === 'SETTLED_EARLIER';
  // Expected income (salary) reads as money arriving, not a bill being paid.
  const isIncome = data.settleAs === 'INCOME';
  const statusLabel = isIncome && data.status === 'PAID' ? 'Received' : STATUS_LABEL[data.status].split(' - ')[0];
  // Skipping is for optional bills nothing has been paid on yet - the server enforces the same.
  const canSkip = !data.mandatory && (data.status === 'PENDING' || data.status === 'OVERDUE') && data.confirmedAmount == null;
  const history = data.history.filter((h) => h.instanceId !== data.id);

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

      <div className="flex flex-col gap-space-3">
        <div className="flex flex-wrap items-center justify-between gap-space-3">
          <div className="flex items-center gap-space-3">
            <h1 className="text-title text-ink">{data.commitmentName}</h1>
            <StatusPill tone={STATUS_TONE[data.status]}>{statusLabel}</StatusPill>
          </div>
          <span className="flex items-center gap-space-2">
            {canSkip && (
              <Button variant="secondary" size="sm" onClick={() => skip(data.id)}>
                Skip this month
              </Button>
            )}
            {data.status === 'SKIPPED' && (
              <Button variant="secondary" size="sm" onClick={() => unskip(data.id)}>
                Undo skip
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={14} strokeWidth={1.5} />
              Edit
            </Button>
          </span>
        </div>
        {data.why && <p className="font-serif text-editorial text-ink">{data.why}</p>}
      </div>
      <EditCommitmentSheet
        commitmentId={editing ? data.commitmentId : null}
        onClose={() => setEditing(false)}
        onDeleted={() => navigate('/month')}
        instanceId={id}
        instanceAmount={data.expectedAmount}
        instanceDueDate={data.dueDate}
      />

      {(data.status === 'UNVERIFIED' || data.status === 'NEEDS_REVIEW') && (
        <p className="text-body text-ink-soft">{STATUS_LABEL[data.status]}</p>
      )}

      <Statement notes>
        {isIncome ? (
          <>
            <StatementRow label="Expected" value={data.expectedAmount} note="What you expect to arrive - counted in the month's standing, not in what you can spend." />
            <StatementRow label="Received" value={data.confirmedAmount} note="What actually arrived. It replaces the expected figure." />
            <StatementRow variant="total" label="Still to arrive" value={data.outstanding} note={`Expected ${formatShortDate(data.dueDate)}`} />
          </>
        ) : (
          <>
            <StatementRow label="Expected" value={data.expectedAmount} note="What this commitment is set to cost." />
            <StatementRow label="Confirmed" value={data.confirmedAmount} note="What's actually been recorded against it." />
            <StatementRow variant="total" label="Outstanding" value={data.outstanding} note={`Due ${formatShortDate(data.dueDate)}`} />
          </>
        )}
      </Statement>

      {data.ifSkipped && (
        <Card domainRule="commit" className="flex items-start gap-space-3">
          <AlertCircle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-soft" />
          <div>
            <span className="text-label font-semibold text-ink">If it's skipped</span>
            <p className="mt-space-1 text-body text-ink-soft">{data.ifSkipped}</p>
          </div>
        </Card>
      )}

      <section>
        <SectionHeader>How it recurs</SectionHeader>
        <div className="flex flex-col">
          <Row primary="Frequency" secondary={undefined} trailing={<span className="text-row text-ink">{FREQUENCY_LABEL[data.frequency] ?? data.frequency} · due the {ordinal(data.dueDay)}</span>} />
          <Row primary="Account" secondary={undefined} trailing={<span className="text-row text-ink">{data.account.name}</span>} />
          {data.category && <Row primary="Category" secondary={undefined} trailing={<span className="text-row text-ink">{data.category.name}</span>} />}
          {!isIncome && <Row primary="Mandatory" secondary={undefined} trailing={<span className="text-row text-ink">{data.mandatory ? 'Yes' : 'No - optional'}</span>} />}
          {data.requiresVerification && (
            <Row primary="Verification" secondary={undefined} trailing={<span className="text-row text-ink">Can never auto-confirm - always needs a check</span>} />
          )}
        </div>
      </section>

      {data.linkedTransaction && (
        <section>
          <SectionHeader>{isIncome ? 'Received as' : 'Settled by'}</SectionHeader>
          <Row
            primary={data.linkedTransaction.description}
            secondary={formatFullDate(new Date(data.linkedTransaction.date))}
            trailing={<Amount value={data.linkedTransaction.amount} role="row" className="text-ink" />}
          />
        </section>
      )}

      {history.length > 0 && (
        <section>
          <SectionHeader>Past cycles</SectionHeader>
          <div className="flex flex-col">
            {history.map((h) => (
              <Row
                key={h.instanceId}
                primary={formatShortDate(h.dueDate)}
                secondary={STATUS_LABEL[h.status].split(' - ')[0]}
                trailing={<Amount value={h.confirmedAmount} role="row" className="text-ink-muted" />}
                onClick={() => navigate(`/commitments/${h.instanceId}`)}
              />
            ))}
          </div>
        </section>
      )}

      {!isSettled && (
        <div className="flex gap-space-3">
          {data.status === 'UNVERIFIED' ? (
            <Button variant="primary" onClick={() => confirm(data.id)} disabled={confirming}>
              Confirm with the bank
            </Button>
          ) : (
            <Button variant="primary" onClick={() => dispatch(openSettleSheet(data.id))}>
              {isIncome ? 'Record it' : 'Settle this'}
            </Button>
          )}
          <Link to="/month" className="flex items-center text-label text-ink-muted hover:text-ink-soft">
            Back to Months
          </Link>
        </div>
      )}
    </div>
  );
}
