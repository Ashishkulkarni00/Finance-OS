import type { ReactNode } from 'react';
import { Sheet } from './Sheet';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * A side panel for *reading* - Needs you, the manual - as opposed to a Sheet for *filling in*
 * (UI_UX_REVAMP_PLAN 5.7). Visually and behaviourally the same native modal `<dialog>`: a right-hand
 * panel from 768px, a bottom sheet on a phone, page behind inert, Esc and the backdrop close it,
 * focus returns to what opened it. The only difference is that there is nothing to lose, so it
 * never asks "Discard changes?".
 */
export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title} footer={footer} guardDirty={false}>
      {children}
    </Sheet>
  );
}
