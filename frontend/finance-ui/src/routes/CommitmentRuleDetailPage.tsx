import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/Button';
import { EditCommitmentSheet } from '@/features/plan/components/EditCommitmentSheet';
import { Row } from '@/components/Row';
import { Card } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { Statement, StatementRow } from '@/components/Statement';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/ErrorState';
import { formatShortDate } from '@/lib/dates';
import { useGetCommitmentRuleQuery, useGetCommitmentRuleInstancesQuery } from '@/services/commitmentRuleService';
import type { CommitmentInstanceStatus } from '@/types/commitment';

const FREQUENCY_LABEL: Record<string, string> = { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', ANNUAL: 'Annual' };

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
  UNVERIFIED: 'Unverified',
  NEEDS_REVIEW: 'Needs a look',
  SETTLED_EARLIER: 'Settled earlier',
  SKIPPED: 'Skipped this month',
};

function ordinal(n: number): string {
  if (n % 10 === 1 && n !== 11) return `${n}st`;
  if (n % 10 === 2 && n !== 12) return `${n}nd`;
  if (n % 10 === 3 && n !== 13) return `${n}rd`;
  return `${n}th`;
}

/**
 * "Commitment rules - not sure how it's working" (user feedback, earlier this
 * session). This is the engine's own page: the rule's configuration, why it exists,
 * and its recent occurrences across cycles - each linking to that occurrence's own
 * detail page (which is where Settle/Confirm actually happen; this page stays
 * read-only, matching PLAN_UX_SPEC.md §4 - editing is its own, unbuilt scope).
 */
export default function CommitmentRuleDetailPage() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const id = Number(ruleId);
  const [editing, setEditing] = useState(false);

  const { data: rule, isLoading, isError, refetch } = useGetCommitmentRuleQuery(id, { skip: !id });
  const { data: history } = useGetCommitmentRuleInstancesQuery(id, { skip: !id });

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-space-6 py-space-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !rule) {
    return (
      <div className="mx-auto max-w-2xl py-space-8">
        <ErrorState message="We couldn't load this commitment." onRetry={refetch} />
      </div>
    );
  }

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
            <h1 className="text-title text-ink">{rule.name}</h1>
            {rule.mandatory && <StatusPill tone="neutral">Mandatory</StatusPill>}
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} strokeWidth={1.5} />
            Edit bill
          </Button>
        </div>
        {rule.why && <p className="font-serif text-editorial text-ink">{rule.why}</p>}
      </div>
      <EditCommitmentSheet commitmentId={editing ? rule.id : null} onClose={() => setEditing(false)} onDeleted={() => navigate(-1)} />

      <Statement notes>
        {rule.amountType === 'FIXED' ? (
          <StatementRow label="Amount" value={rule.fixedAmount} note="Fixed every time this falls due." />
        ) : (
          <StatementRow
            label="Amount"
            valueNode={<span className="text-row text-ink-muted">Varies</span>}
            note="Confirmed each cycle when it's paid."
          />
        )}
        <StatementRow
          variant="subtotal"
          label="Recurs"
          valueNode={<span className="text-row text-ink">{FREQUENCY_LABEL[rule.frequency] ?? rule.frequency}</span>}
          note={`Due the ${ordinal(rule.dueDay)} · ${rule.account.name}`}
        />
      </Statement>

      {rule.ifSkipped && (
        <Card domainRule="commit" className="flex items-start gap-space-3">
          <AlertCircle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-soft" />
          <div>
            <span className="text-label font-semibold text-ink">If it's skipped</span>
            <p className="mt-space-1 text-body text-ink-soft">{rule.ifSkipped}</p>
          </div>
        </Card>
      )}

      <section>
        <SectionHeader>Details</SectionHeader>
        <div className="flex flex-col">
          <Row primary="Category" trailing={<span className="text-row text-ink">{rule.category?.name ?? '—'}</span>} />
          <Row primary="Active from" trailing={<span className="text-row text-ink">{formatShortDate(rule.activeFrom)}</span>} />
          {rule.requiresVerification && (
            <Row primary="Verification" trailing={<span className="text-row text-ink">Can never auto-confirm</span>} />
          )}
        </div>
      </section>

      {history && history.length > 0 && (
        <section>
          <SectionHeader trailing={`${history.length} recent`}>Recent occurrences</SectionHeader>
          <div className="flex flex-col">
            {history.map((h) => (
              <Row
                key={h.instanceId}
                primary={formatShortDate(h.dueDate)}
                trailing={<StatusPill tone={STATUS_TONE[h.status]}>{STATUS_LABEL[h.status]}</StatusPill>}
                onClick={() => navigate(`/commitments/${h.instanceId}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
