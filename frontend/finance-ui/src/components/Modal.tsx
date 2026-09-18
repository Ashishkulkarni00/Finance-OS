import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** A serif headline plus an explicit close button, the same editorial treatment
   *  `EmptyState` gives its own headline. Without a title, the overlay-click and
   *  Escape are the only way out - fine for something tiny, but a form with several
   *  fields reads as unfinished without a header naming what it is and a visible way
   *  to leave it. */
  title?: string;
  /**
   * Pinned to the bottom, outside the scrolling area - so Save is reachable without
   * scrolling to find it, however long the form gets.
   *
   * <p>A submit button in here sits outside the `<form>` element in the DOM. Give the
   * form an `id` and the button `form="that-id"` and HTML wires them together anyway;
   * that's the whole reason this is a separate slot rather than part of `children`.
   */
  footer?: ReactNode;
}

/**
 * Desktop: centred modal - SCREEN_SPECS S2. Escape closes; the overlay never carries
 * meaning, just focus.
 *
 * <p>Three zones, not one: header and footer are pinned and the middle scrolls. The
 * panel is capped at 88vh so it can never be taller than the screen it's on.
 *
 * <p>It used to be a single block inside an overlay that scrolled as a whole, offset
 * by a hard `pt-[10vh]`. On a laptop that meant 10% of the viewport spent before the
 * modal even began, and any form past about six fields pushed its own Save button off
 * the bottom - so the two things you always need, the title and the action, were the
 * first two things to disappear.
 */
export function Modal({ open, onClose, children, title, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // The page behind must not scroll while a modal is over it - otherwise a trackpad
  // flick inside the sheet keeps going into the page underneath once the sheet's own
  // scroll bottoms out.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-space-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-line px-space-6 py-space-4">
            <h2 className="font-serif text-title text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-space-1 text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-space-6">{children}</div>

        {footer && <div className="shrink-0 border-t border-line px-space-6 py-space-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
