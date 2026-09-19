import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Calendar, Wallet, Target, Receipt, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppDispatch } from '@/store/hooks';
import { openAddSheet, openPageAdd } from '@/store/slices/uiSlice';
import { ADD_LABEL, addTargetFor } from './addTarget';

/**
 * Five places, by what people come to do (STRATEGY_DEEP_DIVE §D, decision S2) - not one per
 * database entity. `owns` lists the path prefixes that belong to each, so a detail page
 * (one card, one loan, one bill) keeps its section lit.
 */
const NAV_ITEMS = [
  { to: '/today', label: 'Today', icon: Compass, owns: ['/today'] },
  { to: '/month', label: 'Months', icon: Calendar, owns: ['/month', '/commitments', '/commitment-rules'] },
  { to: '/ahead', label: 'Ahead', icon: Target, owns: ['/ahead', '/goals'] },
  { to: '/money', label: 'Money', icon: Wallet, owns: ['/money', '/accounts', '/cards', '/loans'] },
  { to: '/ledger', label: 'Ledger', icon: Receipt, owns: ['/ledger'] },
] as const;

const isOwned = (pathname: string, owns: readonly string[]) =>
  owns.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** Desktop left rail, 240px - DESIGN_SYSTEM §11. Add is a deliberate action, not a 5th destination.
 *  It adds what the current page lists, and its label says which (`addTargetFor`). */
export function NavRail() {
  const dispatch = useAppDispatch();
  const { pathname, search } = useLocation();
  const target = addTargetFor(pathname, search);

  const add = () => {
    if (target.kind === 'transaction') {
      dispatch(openAddSheet(target.accountId != null ? { accountId: target.accountId } : undefined));
    } else {
      dispatch(openPageAdd({ kind: target.kind, cycleId: target.cycleId }));
    }
  };

  return (
    <nav className="flex h-screen w-(--width-nav-rail) shrink-0 flex-col border-r border-line bg-surface px-space-4 py-space-6">
      <div className="px-space-2 pb-space-8">
        <span className="text-title text-ink">Kosh</span>
      </div>

      <button
        type="button"
        onClick={add}
        className="mb-space-6 flex h-11 items-center justify-center gap-space-2 rounded-lg bg-accent text-label font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
      >
        <Plus size={18} strokeWidth={1.5} />
        {ADD_LABEL[target.kind]}
      </button>

      <ul className="flex flex-col gap-space-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, owns }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={() =>
                cn(
                  'flex items-center gap-space-3 rounded-lg px-space-3 py-space-2 text-label transition-colors duration-150',
                  isOwned(pathname, owns) ? 'bg-accent-wash text-accent font-medium' : 'text-ink-soft hover:bg-sunken hover:text-ink',
                )
              }
            >
              <Icon size={20} strokeWidth={1.5} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
