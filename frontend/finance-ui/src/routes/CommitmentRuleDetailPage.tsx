import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/Button';
import { EditCommitmentSheet } from '@/features/plan/components/EditCommitmentSheet';
import { Row } from '@/components/Row';
import { StatusPill } from '@/components/StatusPill';
import { SectionHeader } from '@/components/SectionHeader';
import { Amount } from '@/components/Amount';
import { FactStrip } from '@/components/FactStrip';
import {
  ArchivedNotice,
  DangerZone,
  DetailError,
  DetailHeader,
  DetailHero,
  DetailLoading,
  DetailPage,
} from '@/components/detail/DetailPage';
import { formatShortDate, ordinalDay } from '@/lib/dates';
import {
  useArchiveCommitmentRuleMutation,
  useGetCommitmentRuleQuery,
  useGetCommitmentRuleInstancesQuery,
  useUnarchiveCommitmentRuleMutation,
} from '@/services/commitmentRuleService';
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

  const { data: rule, isLoading, isError, error, refetch } = useGetCommitmentRuleQuery(id, { skip: !id });
  const [archiveRule, { isLoading: archiving }] = useArchiveCommitmentRuleMutation();
  const [unarchiveRule, { isLoading: unarchiving }] = useUnarchiveCommitmentRuleMutation();
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "That didn't work. Try again.");
    }
  };
  const { data: history } = useGetCommitmentRuleInstancesQuery(id, { skip: !id });

  if (isLoading) return <DetailLoading />;
  if (isError || !rule) {
    return <DetailError what="commitment" backTo="/month" backLabel="Month" error={error} onRetry={refetch} />;
  }

  return (
    <DetailPage backLabel="Month" backTo="/month">
      <DetailHeader
        title={rule.name}
        chips={
          <>
            {rule.mandatory && !rule.archived && <StatusPill tone="neutral">Mandatory</StatusPill>}
            {rule.archived && <StatusPill tone="neutral">Stopped</StatusPill>}
          </>
        }
        actions={
          !rule.archived && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={14} strokeWidth={1.5} />
              Edit
            </Button>
          )
        }
      />
      {rule.why && <p className="max-w-[62ch] font-serif text-editorial text-ink">{rule.why}</p>}

      {rule.archived && (
        <ArchivedNotice
          title="Stopped"
          body="It no longer appears in any month from now on. Months it already ran in keep what was recorded, and starting it again brings it back from this month."
          actionLabel="Start it again"
          busy={unarchiving}
          onAction={() => void run(() => unarchiveRule(rule.id).unwrap())}
        />
      )}
      <EditCommitmentSheet commitmentId={editing ? rule.id : null} onClose={() => setEditing(false)} onDeleted={() => navigate(-1)} />

      <div className="m-card flex flex-col gap-space-5 max-md:gap-space-4">
        <DetailHero
          label="Amount"
          sentence={rule.amountType === 'FIXED' ? 'The same every time it falls due.' : 'Confirmed each month when it’s paid.'}
        >
          {rule.amountType === 'FIXED' ? (
            <Amount value={rule.fixedAmount} role="hero" />
          ) : (
            <span className="text-hero text-ink-soft">Varies</span>
          )}
        </DetailHero>
        <FactStrip
          className="border-y border-line"
          facts={[
            { label: 'Recurs', value: FREQUENCY_LABEL[rule.frequency] ?? rule.frequency },
            { label: 'Due', value: `the ${ordinalDay(rule.dueDay)}` },
            { label: 'From', value: rule.account.name },
          ]}
        />
      </div>

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

      {!rule.archived && (
        <DangerZone
          error={actionError}
          items={[
            {
              title: 'Stop this commitment',
              body: 'It no longer appears in any month from now on. Months it already ran in keep what was recorded, and you can start it again later.',
              actionLabel: 'Stop it',
              busy: archiving,
              confirm: {
                title: `Stop ${rule.name}?`,
                body: 'It stops appearing in future months. Months it already ran in keep what was recorded, and you can start it again later.',
                confirmLabel: 'Stop it',
              },
              onAction: () => run(() => archiveRule(rule.id).unwrap()),
            },
          ]}
        />
      )}
    </DetailPage>
  );
}
