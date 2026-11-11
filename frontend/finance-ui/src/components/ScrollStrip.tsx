import { useEffect, useRef, useState } from 'react';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ScrollStripProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}

/**
 * A horizontally scrolling row (tab strip, wide table) with no visible scrollbar
 * (UI_UX_REVAMP_PLAN 5.8.5). A soft 16px fade shows on whichever edge has more content, so the
 * overflow is hinted without a bar. The fade is a scroll affordance, not decoration, and never
 * sits on data that is fully visible.
 *
 * <p>The scroll position is read, never written: the strip scrolls natively, so keyboard and
 * touch behave as the browser intends.
 */
export function ScrollStrip({ as, className, children, ...rest }: ScrollStripProps) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement>(null);
  const [fade, setFade] = useState({ start: false, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const start = el.scrollLeft > 1;
      const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setFade((f) => (f.start === start && f.end === end ? f : { start, end }));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn('scroll-strip', className)}
      data-fade-start={fade.start}
      data-fade-end={fade.end}
      {...rest}
    >
      {children}
    </Tag>
  );
}
