import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';

const TABS = [
  { to: '/money/accounts', label: 'Overview' },
  { to: '/money/cards', label: 'Cards' },
  { to: '/money/debts', label: 'Debts' },
  { to: '/money/investments', label: 'Investments' },
  // The fifth register answers a different question from the other four: not what you have
  // or owe, but what you wouldn't have to find if something happened (ADR-0016).
  { to: '/money/cover', label: 'Cover' },
] as const;

/**
 * Money - "what do I have and owe?" (STRATEGY_DEEP_DIVE §D, decision S2). The registers
 * that used to be separate menu items are tabs of one place: people come to check their
 * money, not to "open Cards". The old addresses (/accounts, /cards, /debts, /investments)
 * redirect here.
 */
export default function MoneyLayout() {
  return (
    <div className="flex flex-col gap-space-6">
      <nav aria-label="Money" className="flex gap-space-1 border-b border-line">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                '-mb-px border-b-2 px-space-3 py-space-2 text-label transition-colors duration-150',
                isActive ? 'border-accent font-medium text-accent' : 'border-transparent text-ink-soft hover:text-ink',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
