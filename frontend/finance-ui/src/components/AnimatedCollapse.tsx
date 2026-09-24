import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Opens an explanation rather than making it appear (DESIGN_SYSTEM §10).
 *
 * <p>Uses the CSS grid `0fr → 1fr` transition, not a measured pixel height. Animating to a
 * measured height means reading the DOM on every open, re-reading it whenever the content
 * reflows, and being wrong the moment a figure wraps to two lines. The grid track does the
 * measuring itself, so the content can be any height and the transition stays smooth.
 *
 * <p>The child is wrapped in `overflow: hidden` because a collapsing grid track clips rather
 * than scales — nothing inside is ever squashed mid-transition, which is what makes the
 * difference between "opening" and "being crushed".
 *
 * <p>`prefers-reduced-motion` is handled globally in `index.css`: the transition collapses to
 * near-zero and the content simply appears. It is never hidden from assistive technology
 * while open, and `aria-hidden` tracks the real state.
 */
export function AnimatedCollapse({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden={!open}
      className={cn('grid transition-[grid-template-rows,opacity] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]', className)}
      style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
