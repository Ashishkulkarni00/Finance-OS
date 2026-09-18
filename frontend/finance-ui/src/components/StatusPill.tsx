import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'positive' | 'attention' | 'critical';

interface StatusPillProps {
  children: ReactNode;
  tone?: Tone;
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'text-ink-soft',
  positive: 'text-positive',
  attention: 'text-attention',
  critical: 'text-critical',
};

/** `--sunken` background, coloured text, always a word - never a bare dot. DESIGN_SYSTEM §6. */
export function StatusPill({ children, tone = 'neutral' }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-sunken px-space-3 py-1 text-caption font-medium',
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}
