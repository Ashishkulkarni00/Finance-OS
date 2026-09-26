import type { CSSProperties, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

/**
 * Where this warning lives, so the whole row can be a way in and not just its button.
 * Null when there is nowhere better than the list itself to send someone.
 */
export function insightDestination(item: InsightItem): string | null {
  const a = item.action;
  if (!a) return null;
  if (a.route) return a.route;
  if (a.instanceId != null) return `/commitments/${a.instanceId}`;
  // A card bill is paid INTO the card, so the destination account is the card itself.
  if (a.kind === 'TRANSFER' && a.toAccountId != null) return `/cards/${a.toAccountId}`;
  return null;
}

/**
 * One warning. `navigable` makes the whole row a way into the thing it is about - used on
 * the dedicated page, where reading the list is the job. The in-page lists keep their
 * existing behaviour: only the button acts, because a stray tap next to Room should not
 * navigate away from the screen you came to read.
 */
export function InsightRow({
  item,
  navigable = false,
  revealDelay,
  onDismiss,
}: {
  item: InsightItem;
  navigable?: boolean;
  /** Held back on first paint so a list of warnings reads as one thing arriving. */
  revealDelay?: number;
  /**
   * Offers "I know" on this row. Only the dedicated page passes it — answering a warning is a
   * deliberate act, not something to sit a hand's width from Room on Today.
   */
  onDismiss?: (key: string) => void;
}) {
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

  const destination = navigable ? insightDestination(item) : null;

  const body = (
    <div
      data-insight=""
      className={[
        'flex items-start gap-space-3 rounded-xl p-space-4 text-left',
        destination ? 'w-full transition-opacity duration-150 hover:opacity-90' : '',
        revealDelay != null ? 'reveal' : '',
      ].join(' ')}
      style={
        {
          ...(calm ? CALM_TINT : ATTENTION_TINT),
          ...(revealDelay != null ? { '--reveal-delay': `${revealDelay}ms` } : {}),
        } as CSSProperties
      }
    >
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
            <Button
              size="sm"
              variant="secondary"
              // A 1px lift and a border that warms: tactile, nowhere near a bounce. The card
              // it sits in is already doing the attention work.
              className="transition-[transform,border-color,background-color] duration-[180ms] hover:-translate-y-px hover:border-ink-soft"
              disabled={confirming}
              onClick={(e) => {
                // The row navigates, the button acts. Without this the button would do both.
                e.stopPropagation();
                act();
              }}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      {/* Quiet, and to one side. Answering a warning should be available without competing
          with the thing that actually resolves it. */}
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(item.key);
          }}
          className="shrink-0 rounded-md px-space-1 text-caption text-ink-muted underline-offset-2 transition-colors duration-150 hover:text-ink hover:underline"
        >
          I know
        </button>
      )}
    </div>
  );

  if (!destination) return body;
  return (
    <button type="button" onClick={() => navigate(destination)} className="w-full text-left">
      {body}
    </button>
  );
}

/**
 * "What needs you" - the insight engine's ranked list for one screen (Today 3, Month 5).
 * Every screen that used to invent its own warnings renders this instead, so the wording,
 * the order and what counts as urgent are decided once, on the server
 * (STRATEGY_DEEP_DIVE Phase 2). Never claims "nothing needs you" while loading or on error.
 */
export function InsightList({ surface, title = 'Needs you', calmNote }: { surface: InsightSurface; title?: string; calmNote?: ReactNode }) {
  const { data, isLoading, isError } = useGetInsightsQuery(surface);

  return (
    <section>
      <SectionHeader
        trailing={
          // "3 of 7 shown" used to be a statement with nowhere to go. It is the way in to
          // the full list now; the list itself is unchanged.
          data && data.items.length > 0 ? (
            <Link to="/needs-you" className="text-caption text-ink-muted underline-offset-2 hover:text-ink-soft hover:underline">
              {data.total > data.items.length ? `${data.items.length} of ${data.total} — see all` : 'See all'}
            </Link>
          ) : undefined
        }
      >
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
          data.items.map((item, i) => <InsightRow key={item.key} item={item} revealDelay={Math.min(i, 3) * 55} />)
        ) : (
          <div className="flex flex-col gap-space-1">
            <p className="flex items-center gap-space-2 text-body text-ink-soft">
              <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
              Nothing needs you right now.
            </p>
            {calmNote && <p className="pl-[26px] text-caption text-ink-muted">{calmNote}</p>}
          </div>
        )}

        {/* What moved (ROADMAP 3.3). Shown under the list, not only in its empty state: a
            week with two things "worth knowing" and nothing urgent is still a good week, and
            that is exactly when the product has something to say and nothing to warn about.
            The server withholds this entirely when anything urgent is showing, so there is no
            judgement to make here. */}
        {data && data.whatMoved?.length > 0 && (
          <div className="mt-space-1 flex flex-col gap-space-1 border-t border-line pt-space-3">
            {data.whatMoved.map((line) => (
              <p key={line} className="text-caption text-ink-muted">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
