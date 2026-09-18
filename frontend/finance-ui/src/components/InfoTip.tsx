import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const WIDTH = 280;
const GAP = 6;
const EDGE = 8;

type Position = { left: number; top?: number; bottom?: number };

/**
 * An ⓘ button that explains the thing beside it.
 *
 * <p>Opens on hover and on keyboard focus, and a click pins it open, which is how it works
 * on touch where there's no hover. A click elsewhere, or Escape, closes it.
 *
 * <p>Rendered into a portal with fixed coordinates, because the labels it sits in
 * (Statement rows, list rows) truncate with overflow hidden, so an absolutely positioned
 * bubble would be clipped. It opens below the icon, or above it near the bottom of the
 * viewport, and is kept inside the screen horizontally.
 */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipId = useId();
  const open = hovered || pinned;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      if (!r) return;
      const left = Math.min(Math.max(EDGE, r.left + r.width / 2 - WIDTH / 2), window.innerWidth - WIDTH - EDGE);
      setPos(
        r.bottom > window.innerHeight - 180
          ? { left, bottom: window.innerHeight - r.top + GAP }
          : { left, top: r.bottom + GAP },
      );
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!buttonRef.current?.contains(e.target as Node)) {
        setPinned(false);
        setHovered(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => {
          setHovered(false);
          setPinned(false);
        }}
        onClick={(e) => {
          // Rows can be links or buttons themselves - the icon shouldn't navigate.
          e.preventDefault();
          e.stopPropagation();
          setPinned((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) {
            // Close the tip, not the sheet it sits in.
            e.stopPropagation();
            setPinned(false);
            setHovered(false);
          }
        }}
        className={
          'inline-flex shrink-0 cursor-help items-center align-middle rounded-full transition-colors hover:text-ink ' +
          (open ? 'text-ink' : 'text-ink-muted')
        }
      >
        <Info size={14} strokeWidth={1.75} aria-hidden />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            id={tipId}
            role="tooltip"
            style={{ position: 'fixed', width: WIDTH, zIndex: 9999, ...pos }}
            className="pointer-events-none rounded-md border border-line bg-surface px-space-3 py-space-2 text-left text-caption font-normal normal-case tracking-normal text-ink-soft shadow-lg"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
