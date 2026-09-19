import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { useGetInsightsQuery } from '@/services/insightService';
import { useConfirmCommitmentInstanceMutation } from '@/services/commitmentInstanceService';
import { useAppDispatch } from '@/store/hooks';
import { openAddSheet, openSettleSheet } from '@/store/slices/uiSlice';
import type { InsightItem, InsightSurface } from '@/types/insight';

const ATTENTION_TINT = { backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' } as const;
const CALM_TINT = { backgroundColor: 'color-mix(in srgb, var(--accent) 6%, var(--surface))' } as const;

function Item({ item }: { item: InsightItem }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [confirm, { isLoading: confirming }] = useConfirmCommitmentInstanceMutation();
  const calm = item.severity === 'OPPORTUNITY' || item.severity === 'INFO';
  const action = item.action;

  // Each action opens an existing screen or sheet - the engine suggests, the user acts.
  const act = () => {
    if (!action) return;
    switch (action.kind) {
      case 'SETTLE':
        if (action.instanceId != null) dispatch(openSettleSheet(action.instanceId));
        break;
      case 'ESTIMATE':
        if (action.instanceId != null) navigate(`/commitments/${action.instanceId}`);
        break;
      case 'CONFIRM':
        if (action.instanceId != null) confirm(action.instanceId);
        break;
      case 'TRANSFER':
        dispatch(
          openAddSheet({
            type: 'TRANSFER',
            amount: action.amount,
            accountId: action.fromAccountId,
            toAccountId: action.toAccountId ?? null,
          }),
        );
        break;
      case 'OPEN':
        if (action.route) navigate(action.route);
        break;
    }
  };

  return (
    <div data-insight="" className="flex items-start gap-space-3 rounded-xl p-space-4" style={calm ? CALM_TINT : ATTENTION_TINT}>
      {calm ? (
        <Sparkles size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      ) : (
        <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-space-1">
        <p className="text-body text-ink">{item.title}</p>
        <p className="text-caption text-ink-soft">{item.explanation}</p>
        {action && (
          <div className="mt-space-2">
            <Button size="sm" variant="secondary" onClick={act} disabled={confirming}>
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * "What needs you" - the insight engine's ranked list for one screen (Today 3, Month 5).
 * Every screen that used to invent its own warnings renders this instead, so the wording,
 * the order and what counts as urgent are decided once, on the server
 * (STRATEGY_DEEP_DIVE Phase 1). Never claims "nothing needs you" while loading or on error.
 */
export function InsightList({ surface, title = 'Needs you', calmNote }: { surface: InsightSurface; title?: string; calmNote?: ReactNode }) {
  const { data, isLoading, isError } = useGetInsightsQuery(surface);

  return (
    <section>
      <SectionHeader trailing={data && data.total > data.items.length ? `${data.items.length} of ${data.total} shown` : undefined}>
        {title}
      </SectionHeader>
      <div className="flex flex-col gap-space-3">
        {isLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : isError ? (
          <p className="flex items-start gap-space-2 text-body text-ink-soft">
            <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
            We couldn’t check what needs you just now, so this may be incomplete.
          </p>
        ) : data && data.items.length > 0 ? (
          data.items.map((item) => <Item key={item.key} item={item} />)
        ) : (
          <div className="flex flex-col gap-space-1">
            <p className="flex items-center gap-space-2 text-body text-ink-soft">
              <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
              Nothing needs you right now.
            </p>
            {calmNote && <p className="pl-[26px] text-caption text-ink-muted">{calmNote}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
