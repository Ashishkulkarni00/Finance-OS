import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import type { WriteEffect } from '@/types/effect';

const ATTENTION_TINT = { backgroundColor: 'color-mix(in srgb, var(--attention) 8%, var(--surface))' } as const;
const CALM_TINT = { backgroundColor: 'color-mix(in srgb, var(--accent) 6%, var(--surface))' } as const;

/**
 * What the write just did, said where the user did it (ADR-0017, `FINANCIAL_OS.md` §3.3).
 *
 * The product used to be silent at the moment it mattered: you recorded ₹1,200 and had to
 * go to Today to learn what it cost. This is that sentence, at the point of the action.
 *
 * Three rules it exists to keep:
 * - **Never judge** (rule 8). "₹699 a day left", never "you're overspending".
 * - **No money arithmetic** (`FRONTEND_CONVENTIONS` §4 rule 2). Both figures come from the
 *   server already computed; this only ever compares and renders them.
 * - **A missing figure is unknown, not zero.** Position refuses to compute while a
 *   mandatory commitment has no amount, and "₹0 a day" would be a confident lie.
 */
export function EffectNote({ effect, bare = false }: { effect: WriteEffect | undefined; bare?: boolean }) {
  // Absent is the common case and the correct one - a write that moved nothing says nothing.
  if (!effect) return null;

  const held = effect.prominence === 'HELD';
  const leftMoved = effect.leftTodayAfter != null && effect.leftTodayAfter !== effect.leftTodayBefore;
  const balanceMoved = effect.realBalanceAfter != null && effect.realBalanceAfter !== effect.realBalanceBefore;
  const unknown = effect.leftTodayAfter == null && effect.realBalanceAfter == null;

  // An empty tinted box is worse than no box: it reads as a bug, and it was one - the first
  // build compared the day's *allowance*, which does not move when you spend, and rendered
  // nothing at all. If there is genuinely nothing to say, say nothing.
  if (!leftMoved && !balanceMoved && !unknown && effect.started.length === 0 && effect.cleared.length === 0) {
    return null;
  }

  return (
    <div
      data-effect=""
      // `bare` drops the tint and padding for a host that already provides them - the toast
      // colours itself by severity, and a tinted panel inside a tinted card reads as a
      // mistake rather than as emphasis.
      className={bare ? 'flex flex-col gap-space-2' : 'flex flex-col gap-space-3 rounded-xl p-space-4'}
      style={bare ? undefined : held ? ATTENTION_TINT : CALM_TINT}
      role={bare ? undefined : held ? 'alert' : 'status'}
    >
      {/* Stacked on a page, on one line in a toast. The toast is read at a glance and sits
          over something the user was looking at, so every row it does not need is height it
          should not take. */}
      {leftMoved && (
        <div className={bare ? 'flex items-baseline justify-between gap-space-3' : 'flex flex-col gap-space-1'}>
          <p className="shrink-0 text-caption text-ink-muted">Left to spend today</p>
          <p className="flex items-center gap-space-2 text-body text-ink">
            {effect.leftTodayBefore != null && (
              <>
                <span className="text-ink-muted line-through">{formatMoney(effect.leftTodayBefore)}</span>
                <ArrowRight size={14} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden />
              </>
            )}
            <span className="font-medium">{formatMoney(effect.leftTodayAfter)}</span>
          </p>
        </div>
      )}

      {/* The bigger number, quieter. "Left today" answers "can I still buy this"; free until
          salary answers "how is the month going" - both moved, only one is the headline. */}
      {balanceMoved && (
        <p className="text-caption text-ink-muted">
          Free until salary{' '}
          {effect.realBalanceBefore != null && (
            <>
              <span className="line-through">{formatMoney(effect.realBalanceBefore)}</span>{' '}
              <span aria-hidden>→</span>{' '}
            </>
          )}
          <span className="text-ink-soft">{formatMoney(effect.realBalanceAfter)}</span>
        </p>
      )}

      {/* Withheld rather than guessed while a mandatory bill has no amount. Saying so is the
          point: silence here would read as "nothing changed". */}
      {unknown && (
        <p className="text-caption text-ink-muted">
          What's left can't be worked out yet — a bill this month still needs an amount.
        </p>
      )}

      {effect.started.map((item) => (
        <div key={item.key} className="flex items-start gap-space-2">
          {/* Tone follows severity, exactly as InsightList does. An opportunity drawn with a
              warning triangle claims something is wrong when nothing is - rule 8. */}
          {item.severity === 'OPPORTUNITY' || item.severity === 'INFO' ? (
            <Sparkles size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          ) : (
            <AlertTriangle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-attention" aria-hidden />
          )}
          <div className="flex min-w-0 flex-col">
            <p className="text-body text-ink">{item.title}</p>
            <p className={bare ? 'line-clamp-2 text-caption text-ink-muted' : 'text-caption text-ink-muted'}>
              {item.explanation}
            </p>
          </div>
        </div>
      ))}

      {/* The recovery is worth as much as the warning was, and nothing said it before. */}
      {effect.cleared.map((item) => (
        <div key={item.key} className="flex items-start gap-space-2">
          <CheckCircle2 size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          <p className="text-body text-ink">No longer: {item.title}</p>
        </div>
      ))}

      {(effect.moreStarted > 0 || effect.moreCleared > 0) && (
        <p className="text-caption text-ink-muted">
          {effect.moreStarted > 0 && `${effect.moreStarted} more need${effect.moreStarted === 1 ? 's' : ''} a look`}
          {effect.moreStarted > 0 && effect.moreCleared > 0 && ' · '}
          {effect.moreCleared > 0 && `${effect.moreCleared} more cleared`}
        </p>
      )}
    </div>
  );
}
