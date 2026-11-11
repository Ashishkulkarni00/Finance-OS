import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { BOTTOM_BAR_PX } from '@/components/layout/BottomBar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { PendingDelete } from '@/store/slices/uiSlice';
import { dismissDelete, sendDelete, undoDelete, UNDO_WINDOW_MS } from '../pendingDelete';

/** Whole seconds left in the undo window, ticking once a second. */
function useSecondsLeft(deadline: number, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active, deadline]);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

function Notice({ id, entry }: { id: number; entry: PendingDelete }) {
  const dispatch = useAppDispatch();
  const seconds = useSecondsLeft(entry.deadline, entry.phase === 'pending');

  const base =
    'pointer-events-auto flex w-full items-center gap-space-3 rounded-xl border border-line bg-surface-raised px-space-4 py-space-3 text-label text-ink shadow-[var(--shadow-2)]';

  if (entry.phase === 'pending') {
    return (
      <div role="status" className={base}>
        <span className="min-w-0 flex-1 truncate">
          Deleting “{entry.description}” in <span className="num">{seconds}</span>s
        </span>
        <Button size="sm" variant="secondary" onClick={() => dispatch(undoDelete(id))}>
          Undo
        </Button>
        {/* The bar is the timer made visible; the request itself is sent by the store's timer, not
            by this animation, so a hidden tab or a reduced-motion setting cannot change when. */}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden rounded-b-xl">
          <span
            className="effect-toast-timer block h-full origin-left bg-accent"
            style={{ animationDuration: `${UNDO_WINDOW_MS}ms` }}
          />
        </span>
      </div>
    );
  }

  if (entry.phase === 'sending') {
    return (
      <div role="status" className={base}>
        <Loader2 size={16} strokeWidth={1.5} className="shrink-0 animate-spin text-ink-muted" aria-hidden />
        <span className="flex-1">Deleting…</span>
      </div>
    );
  }

  if (entry.phase === 'failed') {
    return (
      <div role="alert" className={base}>
        <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0 text-attention" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block">Couldn’t delete “{entry.description}”.</span>
          <span className="block text-caption text-ink-muted">{entry.message ?? 'It’s still in your records.'}</span>
        </span>
        <Button size="sm" variant="secondary" onClick={() => dispatch(sendDelete(id))}>
          Retry
        </Button>
        <Button size="sm" variant="ghost" onClick={() => dispatch(dismissDelete(id))}>
          Dismiss
        </Button>
      </div>
    );
  }

  // The server has answered 2xx (or 404): only now is it true to say so.
  return (
    <div role="status" className={base}>
      <Check size={16} strokeWidth={1.5} className="shrink-0 text-positive" aria-hidden />
      <span className="flex-1">{entry.alreadyGone ? 'That entry was already deleted.' : 'Entry deleted.'}</span>
    </div>
  );
}

/**
 * The deletions in flight (UI_UX_REVAMP_PLAN 6.6). Bottom-centre on a desktop - away from the
 * effect toasts in the corner - and above the bottom bar on a phone.
 */
export function PendingDeleteHost() {
  const pending = useAppSelector((s) => s.ui.pendingDeletes);
  const ids = Object.keys(pending).map(Number);
  if (ids.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Deletions"
      style={{ bottom: `calc(${BOTTOM_BAR_PX}px + env(safe-area-inset-bottom) + 80px)` }}
      className="pointer-events-none fixed left-1/2 z-50 flex w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-space-2 md:!bottom-space-6"
    >
      {ids.map((id) => (
        <div key={id} className="relative">
          <Notice id={id} entry={pending[id]!} />
        </div>
      ))}
    </div>
  );
}
