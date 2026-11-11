import { SkipSheet } from '@/features/month/components/SkipSheet';
import { canSkip, SKIP_REASON_LABEL } from '@/features/month/skipReasons';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { EditCommitmentSheet } from '@/features/plan/components/EditCommitmentSheet';
import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { StatusPill } from '@/components/StatusPill';
import { SectionHeader } from '@/components/SectionHeader';
import { Statement, StatementRow } from '@/components/Statement';
import { Amount } from '@/components/Amount';
import { Disclosure } from '@/components/Disclosure';
import { FactStrip, type Fact } from '@/components/FactStrip';
import { DetailError, DetailHeader, DetailHero, DetailLoading, DetailPage } from '@/components/detail/DetailPage';
import { formatShortDate, formatFullDate, ordinalDay } from '@/lib/dates';
import { useAppDispatch } from '@/store/hooks';
import { openSettleSheet } from '@/store/slices/uiSlice';
import {
  useGetCommitmentInstanceDetailQuery,
  useConfirmCommitmentInstanceMutation,
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

  const { data, isLoading, isError, error, refetch } = useGetCommitmentInstanceDetailQuery(id, { skip: !id });
  const [confirm, { isLoading: confirming }] = useConfirmCommitmentInstanceMutation();
  const [skipping, setSkipping] = useState(false);
  const [unskip] = useUnskipCommitmentInstanceMutation();

  if (isLoading) return <DetailLoading />;
  if (isError || !data) {
    return <DetailError what="commitment" backTo="/month" backLabel="Month" error={error} onRetry={refetch} />;
  }

  const isSettled = data.status === 'PAID' || data.status === 'SETTLED_EARLIER';
  // Expected income (salary) reads as money arriving, not a bill being paid.
  const isIncome = data.settleAs === 'INCOME';
  const statusLabel = isIncome && data.status === 'PAID' ? 'Received' : STATUS_LABEL[data.status].split(' - ')[0];
  // Anything but a loan EMI, while nothing has been paid or linked - the server enforces the same.
  const skippable = canSkip({ ...data, linkedTransactionId: data.linkedTransaction?.id ?? null });
  const history = data.history.filter((h) => h.instanceId !== data.id);

  // The one action that moves this commitment forward, in the header where it is found first.
  const primary = isSettled || data.status === 'SKIPPED' ? null : data.status === 'UNVERIFIED' ? (
    <Button variant="primary" size="sm" onClick={() => confirm(data.id)} disabled={confirming}>
      Confirm with the bank
    </Button>
  ) : (
    <Button variant="primary" size="sm" onClick={() => dispatch(openSettleSheet(data.id))}>
      {isIncome ? 'Record it' : 'Settle this'}
    </Button>
  );

  const facts: Fact[] = [
    { label: 'Expected', value: <Amount value={data.expectedAmount} role="row" /> },
    { label: isIncome ? 'Received' : 'Paid so far', value: <Amount value={data.confirmedAmount} role="row" /> },
    { label: isIncome ? 'Expected on' : 'Due', value: formatShortDate(data.dueDate) },
  ];

  return (
    <DetailPage backLabel="Month" backTo="/month">
      <DetailHeader
        title={data.commitmentName}
        chips={<StatusPill tone={STATUS_TONE[data.status]}>{statusLabel}</StatusPill>}
        actions={
          <>
            {primary}
            {skippable && (
              <Button variant="secondary" size="sm" onClick={() => setSkipping(true)}>
                Skip this month
              </Button>
            )}
            {data.status === 'SKIPPED' && (
              <Button variant="secondary" size="sm" onClick={() => unskip(data.id)}>
                Undo skip
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={14} strokeWidth={1.5} />
              Edit
            </Button>
          </>
        }
      />
      {data.why && <p className="max-w-[62ch] font-serif text-editorial text-ink">{data.why}</p>}
      {data.status === 'SKIPPED' && data.skipReason && (
        <p className="text-body text-ink-soft">
          Skipped this month · <span className="font-medium text-ink">{SKIP_REASON_LABEL[data.skipReason]}</span>
          {data.skipNote && <> · {data.skipNote}</>}
        </p>
      )}
      <SkipSheet instance={skipping ? data : null} onClose={() => setSkipping(false)} />
      <EditCommitmentSheet
        commitmentId={editing ? data.commitmentId : null}
        onClose={() => setEditing(false)}
        onDeleted={() => navigate('/month')}
        instanceId={id}
        instanceAmount={data.expectedAmount}
        instanceDueDate={data.dueDate}
      />

      {(data.status === 'UNVERIFIED' || data.status === 'NEEDS_REVIEW') && (
        <p className="max-w-[62ch] text-body text-ink-soft">{STATUS_LABEL[data.status]}</p>
      )}

      <div className="m-card flex flex-col gap-space-5 max-md:gap-space-4">
        <DetailHero
          label={isIncome ? 'Still to arrive' : 'Still to pay'}
          sentence={isIncome ? `Expected ${formatShortDate(data.dueDate)}.` : `Due ${formatShortDate(data.dueDate)}.`}
        >
          <Amount value={data.outstanding} role="hero" />
        </DetailHero>
        <FactStrip facts={facts} className="border-y border-line" />
      </div>

      <section>
        <SectionHeader>How it recurs</SectionHeader>
        <div className="flex flex-col">
          <Row primary="Frequency" secondary={undefined} trailing={<span className="text-row text-ink">{FREQUENCY_LABEL[data.frequency] ?? data.frequency} · due the {ordinalDay(data.dueDay)}</span>} />
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

      <Disclosure storageKey="kosh.commitment.figures" label="How these figures are worked out" summary="expected, confirmed, outstanding">
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
      </Disclosure>
    </DetailPage>
  );
}
