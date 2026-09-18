import { Row } from '@/components/Row';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { Amount } from '@/components/Amount';
import { formatShortDate } from '@/lib/dates';
import { useConfirmCommitmentInstanceMutation } from '@/services/commitmentInstanceService';
import { useAppDispatch } from '@/store/hooks';
import { openSettleSheet } from '@/store/slices/uiSlice';
import type { CommitmentInstanceResponse } from '@/types/commitment';
import { CheckCircle2 } from 'lucide-react';

interface ResolveStepProps {
  instances: CommitmentInstanceResponse[] | undefined;
  isLoading: boolean;
}

/** Step 2 - anything still unverified or unmatched, before we call the cycle done. SCREEN_SPECS S6. */
export function ResolveStep({ instances, isLoading }: ResolveStepProps) {
  const dispatch = useAppDispatch();
  const [confirm] = useConfirmCommitmentInstanceMutation();

  const unresolved = (instances ?? []).filter((i) => i.status === 'UNVERIFIED' || i.status === 'NEEDS_REVIEW');

  return (
    <div className="flex flex-col gap-space-6">
      <div>
        <h1 className="text-editorial font-serif text-ink">Anything left to resolve?</h1>
        <p className="mt-space-2 text-body text-ink-muted">
          Unverified amounts and commitments that didn't auto-match a transaction. You can still close without
          resolving these, but they'll follow you into next cycle's history as-is.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : unresolved.length === 0 ? (
        <div className="flex items-center gap-space-3 text-body text-ink-muted">
          <CheckCircle2 size={20} strokeWidth={1.5} className="text-positive" />
          Nothing needs your attention.
        </div>
      ) : (
        <div className="flex flex-col">
          {unresolved.map((instance) => (
            <Row
              key={instance.id}
              domainRule="commit"
              primary={instance.commitmentName}
              secondary={formatShortDate(instance.dueDate)}
              trailing={
                <div className="flex items-center gap-space-3">
                  <Amount value={instance.outstanding ?? instance.expectedAmount} role="row" className="text-ink" />
                  {instance.status === 'UNVERIFIED' ? (
                    <Button size="sm" variant="secondary" onClick={() => confirm(instance.id)}>
                      Confirm
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => dispatch(openSettleSheet(instance.id))}>
                      Settle
                    </Button>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
