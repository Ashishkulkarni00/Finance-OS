import { NavLink, useLocation } from 'react-router-dom';
import { Plus, HelpCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';
import { APP_NAME } from '@/lib/brand';
import { useAppDispatch } from '@/store/hooks';
import { openAddSheet, openPageAdd } from '@/store/slices/uiSlice';
import { useAttentionBadge } from '@/lib/useAttentionBadge';
import { useNeedsPanel } from '@/lib/needsPanel';
import { ADD_LABEL, addTargetFor } from './addTarget';
import { NAV_ITEMS, isOwned } from './navItems';

/**
 * Tablet + desktop navigation (UI_UX_REVAMP_PLAN §7.2). From 1024px the full sidebar; from
 * 768px a 72px icon rail (labels move to the tooltip and the accessible name); below 768px it is
 * gone and the bottom bar takes over.
 *
 * <p>Add is a deliberate action, not a destination. It adds what the current page lists, and
 * its label says which (`addTargetFor`). On a phone the floating Add replaces it.
 */
export function NavRail() {
  const dispatch = useAppDispatch();
  const { pathname, search } = useLocation();
  const target = addTargetFor(pathname, search);
  const badge = useAttentionBadge();
  const { show: showNeeds } = useNeedsPanel();

  const add = () => {
    if (target.kind === 'transaction') {
      dispatch(openAddSheet(target.accountId != null ? { accountId: target.accountId } : undefined));
    } else {
      dispatch(openPageAdd({ kind: target.kind, cycleId: target.cycleId }));
    }
  };

  return (
    <nav
      aria-label="Main"
      className="hidden h-dvh w-[72px] shrink-0 flex-col border-r border-line bg-surface px-space-2 py-space-5 md:flex lg:w-(--width-nav-rail) lg:px-space-4 lg:py-space-6"
    >
      <div className="px-space-2 pb-space-6 text-center lg:pb-space-8 lg:text-left">
        <span className="text-[15px] font-semibold leading-5 tracking-[-0.005em] text-ink" aria-label={APP_NAME}>
          <span className="lg:hidden">{APP_NAME.charAt(0)}</span>
          <span className="hidden lg:inline">{APP_NAME}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={add}
        aria-label={ADD_LABEL[target.kind]}
        title={ADD_LABEL[target.kind]}
        // The one control pressed most often in the product, so it answers the press.
        className="pressable mb-space-5 flex h-[34px] items-center justify-center gap-space-2 rounded-lg bg-accent text-label font-medium text-on-accent transition-[background-color,transform] duration-150 hover:bg-accent-hover lg:mb-space-5"
      >
        <Plus size={18} strokeWidth={1.5} aria-hidden />
        <span className="hidden lg:inline">{ADD_LABEL[target.kind]}</span>
      </button>

      <ul className="flex flex-col gap-space-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, owns }) => {
          const showBadge = to === '/today' && badge > 0;
          return (
            <li key={to} className="relative">
              <NavLink
                to={to}
                title={label}
                aria-label={showBadge ? `${label}, ${badge} need${badge === 1 ? 's' : ''} you` : label}
                className={() =>
                  cn(
                    'relative flex h-[34px] items-center justify-center gap-space-3 rounded-lg px-space-3 text-[13.5px] font-normal transition-colors duration-150 lg:justify-start',
                    isOwned(pathname, owns)
                      ? 'bg-accent-wash font-medium text-ink before:absolute before:inset-y-[7px] before:left-0 before:w-[2px] before:rounded-full before:bg-accent'
                      : 'text-ink-soft hover:bg-sunken hover:text-ink',
                  )
                }
              >
                <Icon size={18} strokeWidth={1.5} aria-hidden />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
              {showBadge && (
                // Opens the Needs-you panel over the current page. A sibling of the link, not a
                // child: interactive content inside an <a> is invalid and unreliable.
                <button
                  type="button"
                  onClick={showNeeds}
                  aria-label={`${badge} need${badge === 1 ? 's' : ''} you - open`}
                  className="num absolute right-1 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-attention px-1 text-micro text-on-solid transition-opacity duration-150 hover:opacity-85 lg:right-space-2 lg:top-1/2 lg:-translate-y-1/2"
                >
                  {badge}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Help is not a seventh job the product does - it sits below a hairline, quieter than the
          six above, always present rather than competing. */}
      <div className="mt-auto flex flex-col gap-space-1 border-t border-line pt-space-4">
        <NavLink
          to="/settings"
          title="Settings"
          aria-label="Settings"
          className={() =>
            cn(
              'flex h-[34px] items-center justify-center gap-space-3 rounded-lg px-space-3 text-[13px] font-normal transition-colors duration-150 lg:justify-start',
              isOwned(pathname, ['/settings']) ? 'bg-accent-wash text-ink' : 'text-ink-muted hover:bg-sunken hover:text-ink-soft',
            )
          }
        >
          <Settings size={16} strokeWidth={1.5} aria-hidden />
          <span className="hidden lg:inline">Settings</span>
        </NavLink>
        <NavLink
          to="/help"
          title="Help"
          aria-label="Help"
          className={() =>
            cn(
              'flex h-[34px] items-center justify-center gap-space-3 rounded-lg px-space-3 text-[13px] font-normal transition-colors duration-150 lg:justify-start',
              isOwned(pathname, ['/help']) ? 'bg-accent-wash text-ink' : 'text-ink-muted hover:bg-sunken hover:text-ink-soft',
            )
          }
        >
          <HelpCircle size={16} strokeWidth={1.5} aria-hidden />
          <span className="hidden lg:inline">Help</span>
        </NavLink>
      </div>
    </nav>
  );
}
