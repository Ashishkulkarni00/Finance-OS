import { Plus } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { openAddSheet } from '@/store/slices/uiSlice';
import { BOTTOM_BAR_PX } from './BottomBar';

/**
 * The phone's Add (UI_UX_REVAMP_PLAN §7.3). Always visible, always in the same place, and always
 * **Add transaction** - the daily action. It does not hide on scroll (a control that comes and
 * goes has to be hunted for) and does not change meaning by page (its label is too short to
 * explain a change). Adding a commitment, loan or goal is the page's own button.
 *
 * <p>Sits above the bottom bar and the safe-area inset. Every page's scroll area pads its
 * bottom so the last row is never behind it. Hidden from 768px up, where the sidebar has Add.
 */
export function AddFab() {
  const dispatch = useAppDispatch();
  return (
    <button
      type="button"
      onClick={() => dispatch(openAddSheet())}
      aria-label="Add transaction"
      style={{
        bottom: `calc(${BOTTOM_BAR_PX}px + env(safe-area-inset-bottom) + 16px)`,
        right: 'max(16px, env(safe-area-inset-right))',
      }}
      className="pressable fixed z-30 flex h-12 items-center gap-space-2 rounded-full bg-accent pl-space-4 pr-space-5 text-label font-medium text-on-accent shadow-[var(--shadow-2)] transition-[background-color,transform] duration-150 hover:bg-accent-hover md:hidden"
    >
      <Plus size={20} strokeWidth={1.5} aria-hidden />
      Add
    </button>
  );
}
