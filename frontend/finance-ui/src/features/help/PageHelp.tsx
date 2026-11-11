import type { ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { useHelp } from './HelpProvider';

/**
 * The one way a page offers help (UI_UX_REVAMP_PLAN Phase 4). It replaces three overlapping
 * layers - a dismissible primer banner, a "How X works" modal, and the manual itself - with
 * two quiet things: a permanent one-line subtitle ({@link PageSubtitle}) and this icon, which
 * opens the manual's overlay at the page's own topic.
 *
 * <p>An icon, not a text link: a link in 12px grey was the pattern that "didn't land" before
 * (feedback: help belongs at the point of decision). The decision-point help - hints in forms,
 * the ⓘ beside a label, right-click on a figure - is unchanged and is where explanation lives.
 */
export function PageHelpButton({ topic, label = 'Help for this page' }: { topic: string; label?: string }) {
  const { open } = useHelp();
  return (
    <button
      type="button"
      onClick={() => open(topic)}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
    >
      <CircleHelp size={16} strokeWidth={1.5} aria-hidden />
    </button>
  );
}

/** What the page is for, in one sentence. Permanent: it never needs dismissing. */
export function PageSubtitle({ children }: { children: ReactNode }) {
  return <p className="max-w-[62ch] text-[13px] leading-5 text-ink-muted max-md:hidden">{children}</p>;
}
