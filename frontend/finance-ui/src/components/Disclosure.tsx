import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatedCollapse } from './AnimatedCollapse';
import { cn } from '@/lib/cn';

interface DisclosureProps {
  /** Where "open" is remembered for this browser (`kosh.<page>.<section>`). Convenience only. */
  storageKey: string;
  label: string;
  /** Shown beside the chevron while closed - names what is inside, so a closed section is never a
   *  mystery ("a closed section that does not say what is in it is a section nobody opens"). */
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

function readOpen(key: string, fallback: boolean): boolean {
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? fallback : v === 'true';
  } catch {
    return fallback;
  }
}

/**
 * Detail on demand (UI_UX_REVAMP_PLAN 0.2-1): a titled section that is closed until asked for.
 * The proof or the working lives inside; the page above it stays an answer.
 *
 * <p>Children are not mounted until the first time it is opened, so a closed section costs
 * nothing - no request, no render - and stays mounted afterwards so it can animate shut.
 */
export function Disclosure({ storageKey, label, summary, defaultOpen = false, children }: DisclosureProps) {
  const [open, setOpenState] = useState(() => readOpen(storageKey, defaultOpen));
  const [everOpened, setEverOpened] = useState(open);

  const toggle = () => {
    const next = !open;
    setOpenState(next);
    if (next) setEverOpened(true);
    try {
      window.localStorage.setItem(storageKey, String(next));
    } catch {
      /* storage blocked - the choice just won't persist */
    }
  };

  return (
    <section>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="pressable flex w-full items-center justify-between gap-space-4 border-t border-line py-space-3 text-left"
      >
        <span className="shrink-0 whitespace-nowrap text-sectiontitle text-ink">{label}</span>
        <span className="flex min-w-0 items-center gap-space-2 text-caption text-ink-muted">
          <span className="truncate">{open ? 'Hide' : summary}</span>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            aria-hidden
            className={cn('shrink-0 transition-transform duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]', open && 'rotate-180')}
          />
        </span>
      </button>
      <AnimatedCollapse open={open}>
        <div className="pb-space-2 pt-space-3">{everOpened && children}</div>
      </AnimatedCollapse>
    </section>
  );
}
