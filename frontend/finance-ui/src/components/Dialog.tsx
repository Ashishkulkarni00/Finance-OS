import type { ReactNode } from 'react';
import { Button } from '@/components/Button';
import { useModalDialog } from './overlay/useModalDialog';

interface DialogProps {
  open: boolean;
  title: string;
  /** The consequence, in one plain sentence: what changes if the user confirms. */
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** A destructive action: `alertdialog`, a critical confirm button. */
  destructive?: boolean;
  /** Disables both buttons while a request is in flight. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A confirmation, nothing else (UI_UX_REVAMP_PLAN §5.7). Native modal `<dialog>`.
 *
 * <p>Two rules differ from a Sheet, on purpose. Focus starts on **Cancel**, the safe choice,
 * so a stray Enter cancels. And a click on the backdrop does **nothing**: a confirmation needs
 * a deliberate answer. Esc still means Cancel.
 */
export function Dialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  busy,
  onConfirm,
  onCancel,
}: DialogProps) {
  const { ref, mounted, closing, onCancel: cancelHandler } = useModalDialog(open, { focusSelector: '[data-cancel]' });
  if (!mounted) return null;

  return (
    <dialog
      ref={ref}
      role={destructive ? 'alertdialog' : 'dialog'}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onCancel={cancelHandler(onCancel)}
      className="confirm-dialog"
      data-closing={closing || undefined}
    >
      <div className="confirm-panel flex w-[min(400px,calc(100vw-2rem))] flex-col gap-space-4 rounded-2xl bg-surface-raised p-space-6 text-ink shadow-[var(--shadow-3)]">
        <h2 id="confirm-title" className="text-title text-ink">
          {title}
        </h2>
        <p id="confirm-body" className="text-body text-ink-soft">
          {body}
        </p>
        <div className="mt-space-2 flex justify-end gap-space-3">
          <Button variant="secondary" data-cancel onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={busy}
            className={destructive ? 'bg-critical hover:bg-critical hover:opacity-90' : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
