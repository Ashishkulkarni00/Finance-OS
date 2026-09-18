import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Calendar, Wallet, Target, Receipt, Landmark, TrendingUp, Plus, CreditCard } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppDispatch } from '@/store/hooks';
import { openAddSheet, openPageAdd } from '@/store/slices/uiSlice';
import { ADD_LABEL, addTargetFor } from './addTarget';

const NAV_ITEMS = [
  { to: '/today', label: 'Today', icon: Compass },
  { to: '/ledger', label: 'Ledger', icon: Receipt },
  { to: '/month', label: 'Months', icon: Calendar },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/cards', label: 'Cards', icon: CreditCard },
  { to: '/debts', label: 'Debts', icon: Landmark },
  { to: '/investments', label: 'Investments', icon: TrendingUp },
  { to: '/goals', label: 'Goals', icon: Target },
] as const;

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
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-space-3 rounded-lg px-space-3 py-space-2 text-label transition-colors duration-150',
                  isActive ? 'bg-accent-wash text-accent font-medium' : 'text-ink-soft hover:bg-sunken hover:text-ink',
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
