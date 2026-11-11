import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Ellipsis, HelpCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Sheet } from '@/components/Sheet';
import { useAttentionBadge } from '@/lib/useAttentionBadge';
import { useNeedsPanel } from '@/lib/needsPanel';
import { NAV_ITEMS, isOwned } from './navItems';

/** Height of the bar above the safe-area inset. The content padding and the Add pill read it. */
export const BOTTOM_BAR_PX = 56;

/**
 * The phone's navigation (UI_UX_REVAMP_PLAN §7.3): the four daily and weekly places plus
 * **More** (Goals, Summary, Help). Goals and Summary are monthly visits; putting them in the
 * bar would drop Money or the Ledger, both weekly. Hidden from 768px up, where the rail takes over.
 */
export function BottomBar() {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const badge = useAttentionBadge();
  const { show: showNeeds } = useNeedsPanel();

  const inBar = NAV_ITEMS.filter((i) => i.bottom);
  const more = NAV_ITEMS.filter((i) => !i.bottom);
  const moreActive = more.some((i) => isOwned(pathname, i.owns)) || isOwned(pathname, ['/help', '/settings']);

  const cellClass = (active: boolean) =>
    cn(
      'relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-[2px] text-micro transition-colors duration-150',
      active ? 'text-accent' : 'text-ink-muted',
    );

  const moreLinks = [
    ...more.map((i) => ({ to: i.to as string, label: i.label as string, icon: i.icon })),
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <>
      <nav
        aria-label="Main"
        style={{ height: `calc(${BOTTOM_BAR_PX}px + env(safe-area-inset-bottom))`, paddingBottom: 'env(safe-area-inset-bottom)' }}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface md:hidden"
      >
        {inBar.map(({ to, label, icon: Icon, owns }) => {
          const active = isOwned(pathname, owns);
          const showBadge = to === '/today' && badge > 0;
          return (
            <div key={to} className="relative flex min-w-0 flex-1">
              <NavLink
                to={to}
                aria-label={showBadge ? `${label}, ${badge} need${badge === 1 ? 's' : ''} you` : label}
                className={() => cellClass(active)}
              >
                <Icon size={22} strokeWidth={1.5} aria-hidden />
                <span className="truncate">{label}</span>
              </NavLink>
              {showBadge && (
                <button
                  type="button"
                  onClick={showNeeds}
                  aria-label={`${badge} need${badge === 1 ? 's' : ''} you - open`}
                  className="num absolute left-1/2 top-[2px] ml-[6px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-attention px-1 text-micro text-on-solid"
                >
                  {badge}
                </button>
              )}
            </div>
          );
        })}
        <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" className={cellClass(moreActive)}>
          <Ellipsis size={22} strokeWidth={1.5} aria-hidden />
          <span>More</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More" guardDirty={false}>
        <ul className="flex flex-col">
          {moreLinks.map(({ to, label, icon: Icon }) => (
            <li key={to} className="border-b border-line last:border-b-0">
              <Link
                to={to}
                onClick={() => setMoreOpen(false)}
                className="flex min-h-12 items-center gap-space-3 py-space-3 text-row text-ink"
              >
                <Icon size={20} strokeWidth={1.5} className="text-ink-soft" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
