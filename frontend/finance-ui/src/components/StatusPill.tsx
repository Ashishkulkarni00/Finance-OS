import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'positive' | 'attention' | 'critical';

interface StatusPillProps {
  children: ReactNode;
  tone?: Tone;
  /**
   * Filled in the tone's own colour with white text, rather than coloured text on
   * `--sunken`.
   *
   * <p>For the one case where the state is the point of the row rather than a qualifier on
   * it - a settled bill in a list of unsettled ones. The quiet form disappears into a long
   * list, which is exactly what it is for everywhere else and exactly wrong here.
   */
  solid?: boolean;
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'text-ink-soft',
  positive: 'text-positive',
  attention: 'text-attention',
  critical: 'text-critical',
};

const SOLID_CLASSES: Record<Tone, string> = {
  neutral: 'bg-ink-soft text-white',
  positive: 'bg-positive text-on-solid',
  attention: 'bg-attention text-on-solid',
  critical: 'bg-critical text-on-solid',
};

/** `--sunken` background, coloured text, always a word - never a bare dot. DESIGN_SYSTEM §6. */
export function StatusPill({ children, tone = 'neutral', solid }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        solid
          ? 'px-space-2 py-[1px] text-caption'
          : 'bg-sunken px-space-3 py-1 text-caption',
        solid ? SOLID_CLASSES[tone] : TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}
