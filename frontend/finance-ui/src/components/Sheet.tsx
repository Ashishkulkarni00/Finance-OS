import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Dialog } from './Dialog';
import { useModalDialog } from './overlay/useModalDialog';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  /** Ask "Discard changes?" before a user dismissal when the form has been edited. On by
   *  default and detected from input events inside the body, so a form needs no wiring.
   *  Turn off for read-only content and for search / filter boxes. */
  guardDirty?: boolean;
  /** `narrow` (440px) for entry forms, so the page behind - and the figure a save will move - stays
   *  visible beside the sheet. Default 520px. Phones are always full width. */
  size?: 'default' | 'narrow';
  /** Change this to tell the sheet the form was just emptied on purpose ("Save & add another"), so
   *  closing it next does not ask "Discard changes?" over a blank form. */
  cleanToken?: number;
}

/**
 * Where every form lives (UI_UX_REVAMP_PLAN §5.7, §6.8). A right-hand side panel on a desktop,
 * a bottom sheet on a phone, built on a native modal `<dialog>`: the page behind is inert, Tab
 * stays inside, Esc and the backdrop dismiss, and focus returns to what opened it.
 *
 * <p>**Dismissal vs closing.** Esc, the backdrop, the close button and the phone's drag handle
 * are *dismissals*: if the form is dirty they ask first. A parent setting `open` to false (a
 * successful save) is a *close* and never asks. That split is what lets the guard sit here
 * without every form telling the sheet it has just saved.
 *
 * <p>Replaces `Modal`, whose props this keeps (`Modal` is now an alias) so every existing sheet
 * moved over without edits.
 */
export function Sheet({ open, onClose, children, title, footer, guardDirty = true, size = 'default', cleanToken }: SheetProps) {
  const { ref, mounted, closing, onCancel } = useModalDialog(open);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<number | null>(null);

  // The form was emptied on purpose.
  useEffect(() => {
    if (cleanToken != null) setDirty(false);
  }, [cleanToken]);

  // A fresh open is a clean form.
  useEffect(() => {
    if (open) {
      setDirty(false);
      setConfirming(false);
    }
  }, [open]);

  // On a phone the on-screen keyboard covers the bottom of the layout viewport (iOS and most
  // Android browsers shrink only the *visual* viewport). Publish how much is covered so the bottom
  // sheet - and its Save button - can sit above it (`.sheet-panel` reads --kb-inset).
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb-inset', `${Math.round(covered)}px`);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--kb-inset');
    };
  }, [open]);

  const dismiss = useCallback(() => {
    if (guardDirty && dirty) setConfirming(true);
    else onClose();
  }, [guardDirty, dirty, onClose]);

  if (!mounted) return null;

  const labelId = 'sheet-title';
  return (
    <>
      <dialog
        ref={ref}
        aria-labelledby={title ? labelId : undefined}
        aria-label={title ? undefined : 'Dialog'}
        onCancel={onCancel(dismiss)}
        // The dialog element IS the viewport-sized hit area; the panel is inside it. A click
        // whose target is the dialog itself landed on the scrim.
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) dismiss();
        }}
        onInput={() => guardDirty && setDirty(true)}
        onChange={() => guardDirty && setDirty(true)}
        // Custom controls (the Select, chips, radios) change state without a native input
        // event, so a click on one counts as an edit. Plain buttons (Save, the close X) do not.
        onClick={(e) => {
          if (guardDirty && (e.target as HTMLElement).closest('[role=option],[role=radio],[role=checkbox],[role=switch],[aria-pressed]')) {
            setDirty(true);
          }
        }}
        className="sheet-dialog"
        data-closing={closing || undefined}
      >
        <div
          data-size={size}
          className="sheet-panel flex flex-col overflow-hidden bg-surface-raised text-ink shadow-[var(--shadow-3)]"
          style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
        >
          {/* Phone only: the drag handle. A real button, so dragging is never the only way. */}
          <button
            type="button"
            aria-label="Close"
            onClick={dismiss}
            onPointerDown={(e) => {
              dragStart.current = e.clientY;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (dragStart.current != null) setDrag(Math.max(0, e.clientY - dragStart.current));
            }}
            onPointerUp={() => {
              const far = drag > 90;
              dragStart.current = null;
              setDrag(0);
              if (far) dismiss();
            }}
            className="flex h-6 w-full shrink-0 touch-none items-center justify-center md:hidden"
          >
            <span aria-hidden className="h-1 w-10 rounded-full bg-border" />
          </button>

          {title && (
            <div className="flex shrink-0 items-center justify-between gap-space-3 border-b border-line px-space-5 py-space-4 md:px-space-6">
              <h2 id={labelId} tabIndex={-1} data-dialog-title className="text-title text-ink outline-none">
                {title}
              </h2>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className="-mr-space-2 flex h-8 w-8 items-center justify-center rounded-full pointer-coarse:h-11 pointer-coarse:w-11 text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink"
              >
                <X size={16} strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          )}
          <div data-dialog-body className="min-h-0 flex-1 overflow-y-auto p-space-5 md:p-space-6">
            {children}
          </div>
          {footer && (
            <div className="shrink-0 border-t border-line px-space-5 py-space-4 pb-[max(var(--spacing-space-4),env(safe-area-inset-bottom))] md:px-space-6">
              {footer}
            </div>
          )}
        </div>
      </dialog>

      <Dialog
        open={confirming}
        title="Discard changes?"
        body="What you've entered won't be saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          setConfirming(false);
          setDirty(false);
          onClose();
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
