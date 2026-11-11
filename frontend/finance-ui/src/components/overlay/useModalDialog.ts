import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';

const EXIT_MS = 200;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The shared lifecycle of every modal overlay (Sheet, Dialog, Drawer) on the browser's native
 * `<dialog>` element - UI_UX_REVAMP_PLAN §6.8. The browser supplies the hard parts: the top
 * layer, an inert page behind, Tab containment, and Esc as a `cancel` event. What it does not
 * supply, and this hook does:
 *
 * <ul>
 *   <li>**Mount while closing**, so an exit animation can play before the dialog unmounts.</li>
 *   <li>**Initial focus.** `showModal()` focuses the first focusable element, which in a sheet
 *       is the header's close button. Focus goes to the first form control instead, else to
 *       `focusSelector`, else to the heading.</li>
 *   <li>**Focus restoration**, explicitly. The opener may have left the page (a deleted row),
 *       in which case focus falls back to the main region rather than to `<body>`.</li>
 *   <li>**Scroll lock** on `<body>`; dialogs do not lock it themselves.</li>
 * </ul>
 */
export function useModalDialog(open: boolean, opts: { focusSelector?: string } = {}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      return;
    }
    if (!mounted) return;
    // Closing: let the exit animation run, then unmount. Reduced motion skips straight to it.
    if (prefersReducedMotion()) {
      setMounted(false);
      return;
    }
    setClosing(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!mounted || !dialog || dialog.open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();

    const focusTarget =
      (opts.focusSelector && dialog.querySelector<HTMLElement>(opts.focusSelector)) ||
      dialog.querySelector<HTMLElement>(
        '[data-autofocus], [data-dialog-body] input:not([type=hidden]):not([disabled]), [data-dialog-body] select:not([disabled]), [data-dialog-body] textarea:not([disabled])',
      ) ||
      dialog.querySelector<HTMLElement>('[data-dialog-title]');
    focusTarget?.focus({ preventScroll: true });
  }, [mounted, opts.focusSelector]);

  // Unmounting removes the dialog from the DOM, which also leaves the top layer.
  useEffect(() => {
    if (mounted) return;
    const el = opener.current;
    opener.current = null;
    if (!el) return;
    const target = el.isConnected ? el : document.getElementById('app-main');
    target?.focus({ preventScroll: true });
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  /** Wire to `<dialog onCancel>`: Esc must go through our dismiss path, not close the dialog. */
  const onCancel = useCallback(
    (dismiss: () => void) => (e: SyntheticEvent) => {
      e.preventDefault();
      dismiss();
    },
    [],
  );

  return { ref, mounted, closing, onCancel };
}
