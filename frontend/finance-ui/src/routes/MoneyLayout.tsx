import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ScrollStrip } from '@/components/ScrollStrip';

const TABS = [
  { to: '/money/accounts', label: 'Overview' },
  { to: '/money/cards', label: 'Cards' },
  { to: '/money/debts', label: 'Debts' },
  { to: '/money/investments', label: 'Investments' },
  // The fifth register answers a different question from the other four: not what you have
  // or owe, but what you wouldn't have to find if something happened (ADR-0016).
  { to: '/money/insurance', label: 'Insurance' },
] as const;

/** What the layout hands each tab: where on the title row the tab's own actions (help, add) go. */
export interface MoneyOutletContext {
  actionsSlot: HTMLElement | null;
}

/**
 * Money - "what do I have and owe?" (STRATEGY_DEEP_DIVE §D, decision S2). The registers
 * that used to be separate menu items are tabs of one place: people come to check their
 * money, not to "open Cards". The old addresses (/accounts, /cards, /debts, /investments)
 * redirect here.
 *
 * <p>The tab row is a `ScrollStrip`: on a phone five tabs do not fit, and the row scrolls
 * sideways with no visible bar and an edge fade, never pushing the page itself wider.
 *
 * <p><strong>The title row carries the tab's actions</strong> (2026-11-11). Each tab's help icon
 * and add button used to sit on a row of their own under the tab strip, a full row of mostly
 * nothing before the first figure. They now render into `actionsSlot` on the title row through
 * `TabToolbar`, so the first thing under the tabs is the answer.
 */
export default function MoneyLayout() {
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);
  return (
    <div className="reveal-shell flex w-full flex-col gap-space-5 md:gap-space-8">
      <div className="flex flex-wrap items-center justify-between gap-x-space-3 gap-y-space-2">
        <h1 className="text-page text-ink">Money</h1>
        {/* A tab with two add buttons (Cards) does not fit beside the title on a phone: the row wraps and the
            actions drop to their own right-aligned line, rather than running off the edge. */}
        <div ref={setActionsSlot} className="ml-auto flex flex-wrap items-center justify-end gap-space-2" />
      </div>
      <ScrollStrip as="nav" aria-label="Money" className="flex gap-space-1 border-b border-line">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                '-mb-px shrink-0 whitespace-nowrap border-b-[1.5px] px-space-3 py-space-2 text-label transition-colors duration-150',
                isActive ? 'border-accent font-medium text-ink' : 'border-transparent font-normal text-ink-soft hover:text-ink',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </ScrollStrip>
      <div className="flex flex-col gap-space-6 md:gap-10">
        <Outlet context={{ actionsSlot } satisfies MoneyOutletContext} />
      </div>
    </div>
  );
}
