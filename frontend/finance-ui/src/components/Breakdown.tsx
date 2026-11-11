import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useIsWide } from '@/lib/useMediaQuery';
import { Sheet } from './Sheet';

interface BreakdownProps {
  /** Names the panel for assistive tech and heads it visually. */
  title: string;
  /** What the user taps: the figure, or a sentence like "How is ₹3,168 worked out?". */
  trigger: ReactNode;
  /** The proof. **Server data only** (UI_UX_REVAMP_PLAN §6.4): lines and totals exactly as the
   *  response carries them. Nothing in here may add, subtract or divide money. */
  children: ReactNode;
  /** "as of 10:42" - shown when the figure is stale (connectivity mode). */
  asOf?: string;
  className?: string;
}

const MARGIN = 16;
const WIDTH = 640;

/**
 * Opens the working behind a figure the server can prove (the Breakdown registry, §6.4).
 *
 * <p>Wide screens get a native non-modal `popover` anchored to the trigger: light dismiss
 * (click outside, Esc) and focus return come from the browser. Phones get a bottom sheet,
 * because an anchored popover has no room there.
 *
 * <p>This component is only the shell. It is deliberately dumb about money, so a breakdown
 * can never be computed here - callers pass server-shaped content, and a figure without a
 * registry entry simply doesn't use this component.
 */
export function Breakdown({ title, trigger, children, asOf, className }: BreakdownProps) {
  const wide = useIsWide();
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const toggle = () => {
    if (!wide) {
      setOpen((v) => !v);
      return;
    }
    const pop = popRef.current;
    const btn = btnRef.current;
    if (!pop || !btn) return;
    if (pop.matches(':popover-open')) {
      pop.hidePopover();
      return;
    }
    const r = btn.getBoundingClientRect();
    const width = Math.min(WIDTH, window.innerWidth - MARGIN * 2);
    const left = Math.min(Math.max(MARGIN, r.left), window.innerWidth - width - MARGIN);
    const below = window.innerHeight - r.bottom;
    // Prefer below; flip above only when below is cramped and above is roomier.
    const placeAbove = below < 320 && r.top > below;
    pop.style.left = `${left}px`;
    pop.style.width = `${width}px`;
    pop.style.maxHeight = `${Math.max(240, (placeAbove ? r.top : below) - MARGIN - 8)}px`;
    if (placeAbove) {
      pop.style.top = 'auto';
      pop.style.bottom = `${window.innerHeight - r.top + 8}px`;
    } else {
      pop.style.bottom = 'auto';
      pop.style.top = `${r.bottom + 8}px`;
    }
    pop.showPopover();
    pop.querySelector<HTMLElement>('[data-breakdown-title]')?.focus({ preventScroll: true });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'pressable rounded-md text-left underline decoration-dotted decoration-ink-muted underline-offset-4 transition-colors duration-150 hover:decoration-ink focus-visible:decoration-ink',
          className,
        )}
      >
        {trigger}
      </button>

      {wide ? (
        <div
          ref={popRef}
          popover="auto"
          role="dialog"
          aria-labelledby={titleId}
          onToggle={(e) => setOpen((e as unknown as ToggleEvent).newState === 'open')}
          className="breakdown-popover fixed m-0 overflow-y-auto rounded-2xl border border-line bg-surface-raised p-0 text-ink shadow-[var(--shadow-2)]"
        >
          <div className="flex items-start justify-between gap-space-3 border-b border-line px-space-5 py-space-4">
            <div>
              <h2 id={titleId} tabIndex={-1} data-breakdown-title className="text-title text-ink outline-none">
                {title}
              </h2>
              {asOf && <p className="num text-caption text-attention">As of {asOf}. May be out of date.</p>}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => popRef.current?.hidePopover()}
              className="-mr-space-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full pointer-coarse:h-11 pointer-coarse:w-11 text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink"
            >
              <X size={16} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          <div className="px-space-5 py-space-4">{children}</div>
        </div>
      ) : (
        <Sheet open={open} onClose={() => setOpen(false)} title={title} guardDirty={false}>
          {asOf && <p className="num mb-space-3 text-caption text-attention">As of {asOf}. May be out of date.</p>}
          {children}
        </Sheet>
      )}
    </>
  );
}
