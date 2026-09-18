import { useEffect, useRef, useState } from 'react';
import type { Money } from './money';

/**
 * "On save, the hero number counts to its new value over 250ms." DESIGN_SYSTEM §10 -
 * "the single most important animation in the product" (also UI_UX_PRINCIPLES §15).
 * A number that animates on page load is decoration; a number that animates on
 * change is information - so this only eases between two known values, never on
 * first mount, and respects `prefers-reduced-motion`.
 */
export function useAnimatedMoney(value: Money | null | undefined): Money | null | undefined {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (value == null || previous.current == null || value === previous.current) {
      setDisplay(value);
      previous.current = value;
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setDisplay(value);
      previous.current = value;
      return;
    }

    const from = Number(previous.current);
    const to = Number(value);
    const duration = 250;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t); // ease-out
      setDisplay((from + (to - from) * eased).toFixed(2));
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        previous.current = value;
      }
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return display;
}
