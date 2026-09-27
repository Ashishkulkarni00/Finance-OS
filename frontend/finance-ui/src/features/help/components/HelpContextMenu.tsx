import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

export interface HelpMenuState {
  x: number;
  y: number;
  title: string;
  onSelect: () => void;
}

/**
 * The compact menu right-click (or long-press) opens - IN_APP_MANUAL.md §4: one item,
 * "Read help about this", with the topic's own title beneath it so the user can see
 * where they are about to go before they click.
 */
export function HelpContextMenu({ menu, onDismiss }: { menu: HelpMenuState; onDismiss: () => void }) {
  return createPortal(
    <>
      {/* Full-screen, transparent - catches the next click/tap anywhere to dismiss. */}
      <div className="fixed inset-0 z-[9998]" onClick={onDismiss} onContextMenu={(e) => e.preventDefault()} />
      <div
        role="menu"
        style={{ position: 'fixed', left: Math.min(menu.x, window.innerWidth - 260), top: Math.min(menu.y, window.innerHeight - 90) }}
        className="z-[9999] w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            menu.onSelect();
            onDismiss();
          }}
          className="flex w-full flex-col gap-space-1 px-space-4 py-space-3 text-left transition-colors duration-150 hover:bg-sunken"
        >
          <span className="flex items-center gap-space-2 text-label text-ink">
            <HelpCircle size={15} strokeWidth={1.75} className="shrink-0 text-accent" aria-hidden />
            Read help about this
          </span>
          <span className="truncate text-caption text-ink-muted">{menu.title}</span>
        </button>
      </div>
    </>,
    document.body,
  );
}
