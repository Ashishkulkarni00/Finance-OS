import { AlertTriangle, Check, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EffectNote } from '@/components/EffectNote';
import { insightDestination } from '@/components/InsightList';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissEffect, type EffectToast } from '@/store/slices/uiSlice';
import type { WriteEffect } from '@/types/effect';

/** How long a calm report stays. Five seconds was not enough to read two figures and a
 *  sentence without feeling hurried - and since hovering holds it and the bar shows exactly
 *  how long is left, a longer default costs nothing. Paused while the pointer is on it. */
const QUIET_MS = 10000;

/** Tone, and what it is called. Follows `Insight.Severity`, so a warning here looks like the
 *  same warning on Today - one thing should not change colour depending on where it appears. */
function toneFor(effect: WriteEffect) {
  if (effect.prominence === 'HELD') {
    return {
      label: 'Needs you now',
      Icon: AlertTriangle,
      iconClass: 'text-attention',
      tint: 'color-mix(in srgb, var(--attention) 10%, var(--surface))',
      edge: 'var(--attention)',
      bar: 'var(--attention)',
    };
  }
  if (effect.started.length > 0 || effect.cleared.length > 0) {
    return {
      label: 'Recorded · worth knowing',
      Icon: Sparkles,
      iconClass: 'text-accent',
      tint: 'color-mix(in srgb, var(--accent) 7%, var(--surface))',
      edge: 'var(--accent)',
      bar: 'var(--accent)',
    };
  }
  return {
    label: 'Recorded',
    Icon: Check,
    iconClass: 'text-positive',
    tint: 'var(--surface)',
    edge: 'var(--positive)',
    bar: 'var(--positive)',
  };
}

/**
 * What a write just did, said without stopping you (ADR-0017).
 *
 * <p>The first build held the sheet open until the user acknowledged it. That is right for
 * something needing a decision and wrong for every ₹50 expense, which is most of them - an
 * app that costs two taps to record a chai is one you stop recording chai in.
 *
 * <p>A toast is acceptable here, having been argued against in ADR-0017, only because
 * nothing in it is lost when it fades: every warning it reports is also on
 * <strong>Needs you</strong>. A toast that is your one chance to read something trains
 * people to dismiss it; a toast backed by a durable list is a pointer.
 *
 * <p><strong>The countdown bar is the dismissal.</strong> It is a CSS animation, and
 * {@code onAnimationEnd} is what removes the toast - so pausing the animation on hover
 * pauses the disappearance too, with no second timer that could disagree with what the bar
 * is showing. Reaching for something that is counting down and having it wait is the
 * behaviour people expect; having it vanish under the cursor is the one they resent.
 */
function Toast({ toast }: { toast: EffectToast }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const held = toast.effect.prominence === 'HELD';
  const tone = toneFor(toast.effect);
  const { Icon } = tone;

  const dismiss = () => dispatch(dismissEffect(toast.id));

  // Somewhere to go only when there is somewhere worth going. A crossing knows its own
  // subject - the goal, the bill, the card - and that is the "right place". A toast that
  // only says money moved has no better destination than the screen you are already on, so
  // it is not made to look clickable.
  const first = toast.effect.started[0] ?? null;
  const destination = first ? insightDestination(first) ?? '/needs-you' : null;

  return (
    <div
      role={held ? 'alert' : 'status'}
      onClick={
        destination
          ? () => {
              dismiss();
              navigate(destination);
            }
          : undefined
      }
      className={[
        'effect-toast pointer-events-auto w-[27rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line shadow-lg',
        destination ? 'cursor-pointer transition-shadow duration-150 hover:shadow-xl' : '',
      ].join(' ')}
      style={{ backgroundColor: tone.tint, borderLeft: `3px solid ${tone.edge}` }}
    >
      <div className="flex items-start justify-between gap-space-2 px-space-4 pt-space-2">
        <p className="flex items-center gap-space-2 text-caption text-ink-muted">
          <Icon size={14} strokeWidth={1.5} className={`shrink-0 ${tone.iconClass}`} aria-hidden />
          {tone.label}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          aria-label="Dismiss"
          className="-m-space-1 shrink-0 rounded p-space-1 text-ink-muted transition-colors hover:text-ink"
        >
          <X size={14} strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      <div className="px-space-4 pb-space-3 pt-space-1">
        <EffectNote effect={toast.effect} bare />
      </div>

      {/* How long it will stay. Absent when it is not going anywhere - a bar that never
          moves would promise a countdown that is not happening. */}
      {!held && (
        <div className="h-[3px] w-full bg-line/40">
          <div
            className="effect-toast-timer h-full origin-left"
            style={{ backgroundColor: tone.bar, animationDuration: `${QUIET_MS}ms` }}
            onAnimationEnd={dismiss}
          />
        </div>
      )}
    </div>
  );
}

/** Bottom-right, newest nearest the corner, above everything. */
export function EffectToastHost() {
  const toasts = useAppSelector((s) => s.ui.effectToasts);
  if (toasts.length === 0) return null;

  return (
    // Bottom-right, not top-right. On Today, "Needs you" occupies the top of the right
    // column, and a toast there lands squarely on the one block the user most needs to
    // read. Lower down it covers "Coming up" instead - further ahead, lower stakes, and
    // gone again in ten seconds. Pushing the page down instead would make the whole layout
    // jump for every expense, which is worse than a transient overlap.
    // column-reverse so the newest sits nearest the corner and older ones ride up.
    <div className="pointer-events-none fixed bottom-space-6 right-space-6 z-50 flex flex-col-reverse gap-space-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
