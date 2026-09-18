import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Amount } from '@/components/Amount';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { InstanceAmountForm } from '@/features/commitments/components/InstanceAmountForm';
import { daysBetween, formatShortDate } from '@/lib/dates';
import { useConfirmCommitmentInstanceMutation } from '@/services/commitmentInstanceService';
import { useAppDispatch } from '@/store/hooks';
import { openSettleSheet } from '@/store/slices/uiSlice';
import type { CommitmentInstanceResponse } from '@/types/commitment';

interface NeedsYouZoneProps {
  instances: CommitmentInstanceResponse[];
  nextUp: CommitmentInstanceResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}

const TINT_STYLE = { backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' } as const;

function timingFor(instance: CommitmentInstanceResponse): string {
  const days = daysBetween(instance.dueDate);
  if (instance.status === 'OVERDUE') {
    const overdue = Math.abs(days);
    return `Overdue by ${overdue} ${overdue === 1 ? 'day' : 'days'}`;
  }
  if (days <= 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

/** Same wording as Today's Needs You - both filter on the same server-computed tier. */
function reasonFor(instance: CommitmentInstanceResponse): string {
  if (instance.status === 'NEEDS_REVIEW') return "Needs a look - something doesn't add up";
  if (instance.status === 'UNVERIFIED') return 'Not yet confirmed with the bank';
  if (instance.expectedAmount == null) return 'Needs an amount before what’s free is certain';
  // Same words as Today: a planned move or income that didn't happen isn't a late bill.
  if (instance.status === 'OVERDUE' && instance.settleAs === 'INCOME') return 'Expected by now - not recorded yet';
  if (instance.status === 'OVERDUE' && (instance.settleAs === 'TRANSFER' || instance.settleAs === 'INVESTMENT')) {
    return 'Planned for an earlier date - not recorded yet';
  }
  return timingFor(instance);
}

/**
 * Zone 3 - Tier 1 only. MONTH_TAB_UX_SPEC.md §4.
 *
 * <p>Brought in line with Today's Needs You, which had already been fixed for the same
 * three things this one still did:
 * <ul>
 *   <li>No section heading at all - the cards floated between the crux and the plan with
 *       nothing saying what they were.</li>
 *   <li>"Nothing needs you" while the bills were still loading, and when the request had
 *       failed - the one sentence here that must never be said without knowing.</li>
 *   <li>Settle on a bill with no amount - which asks you to record a payment that hasn't
 *       happened, when all that's missing is a number.</li>
 * </ul>
 */
export function NeedsYouZone({ instances, nextUp, isLoading, isError }: NeedsYouZoneProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [confirm] = useConfirmCommitmentInstanceMutation();

  let body;
  if (isLoading) {
    body = <Skeleton className="h-20 w-full rounded-xl" />;
  } else if (isError) {
    body = (
      <p className="flex items-start gap-space-2 text-body text-ink-soft">
        <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
        We couldn’t check this cycle’s bills just now. Refresh to try again.
      </p>
    );
  } else if (instances.length === 0) {
    body = (
      <p className="flex items-center gap-space-2 text-body text-ink-soft">
        <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
        {nextUp
          ? `Nothing needs you. Next up is ${nextUp.commitmentName} on ${formatShortDate(nextUp.dueDate)}.`
          : 'Nothing needs you.'}
      </p>
    );
  } else {
    body = (
      <div className="flex flex-col gap-space-3">
        {instances.map((instance) => {
          const open = () => navigate(`/commitments/${instance.id}`);
          return (
            <div key={instance.id} className="flex flex-col gap-space-3 rounded-xl p-space-4" style={TINT_STYLE}>
              <div
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                  }
                }}
                className="flex items-start gap-space-3 rounded-md text-left"
              >
                <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-space-3">
                    <span className="text-row text-ink hover:underline hover:underline-offset-4">{instance.commitmentName}</span>
                    {instance.outstanding != null && <Amount value={instance.outstanding} role="row" className="text-ink" />}
                  </div>
                  <p className="mt-space-1 text-caption text-attention">{reasonFor(instance)}</p>
                  {instance.ifSkipped && (
                    <p className="mt-space-1 text-caption text-ink-muted">If skipped: {instance.ifSkipped}</p>
                  )}
                </div>
              </div>
              <div className="pl-[30px]">
                {instance.status === 'UNVERIFIED' ? (
                  <Button size="sm" variant="secondary" onClick={() => confirm(instance.id)}>
                    Confirm
                  </Button>
                ) : instance.expectedAmount == null ? (
                  <InstanceAmountForm instanceId={instance.id} name={instance.commitmentName} />
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => dispatch(openSettleSheet(instance.id))}>
                    {instance.settleAs === 'INCOME' ? 'Received' : instance.settleAs === 'EXPENSE' ? 'Settle' : 'Record it'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section>
      <SectionHeader trailing={!isLoading && !isError && instances.length > 0 ? `${instances.length} to act on` : undefined}>
        Needs you
      </SectionHeader>
      {body}
    </section>
  );
}
