import { Compass, Calendar, Wallet, Target, Receipt, ChartColumn } from 'lucide-react';

/**
 * The six places, by what people come to do (STRATEGY_DEEP_DIVE §D) - shared by the desktop
 * sidebar, the tablet rail and the phone's bottom bar so the three can never disagree.
 * `owns` lists the path prefixes that belong to each, so a detail page keeps its section lit.
 *
 * <p>`bottom: true` puts it in the phone's bottom bar; the rest live under **More**
 * (UI_UX_REVAMP_PLAN §7.3): Goals and Summary are monthly visits, the four in the bar are
 * the daily and weekly ones.
 */
export const NAV_ITEMS = [
  { to: '/today', label: 'Today', icon: Compass, owns: ['/today', '/needs-you'], bottom: true },
  { to: '/ledger', label: 'Ledger', icon: Receipt, owns: ['/ledger'], bottom: true },
  { to: '/month', label: 'Months', icon: Calendar, owns: ['/month', '/commitments', '/commitment-rules'], bottom: true },
  { to: '/money', label: 'Money', icon: Wallet, owns: ['/money', '/accounts', '/cards', '/loans'], bottom: true },
  // Route stays `/ahead`: `/goals/:id` is a goal's own detail page, so `/goals` cannot also
  // be the section's index without the two fighting. `/goals` redirects here.
  { to: '/ahead', label: 'Goals', icon: Target, owns: ['/ahead', '/goals'], bottom: false },
  { to: '/summary', label: 'Summary', icon: ChartColumn, owns: ['/summary', '/review'], bottom: false },
] as const;

export const isOwned = (pathname: string, owns: readonly string[]) =>
  owns.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** The browser-tab title for a path: "Today · Kosh". Also what a screen reader announces on navigation. */
export function titleFor(pathname: string, appName: string): string {
  if (pathname.startsWith('/help')) return `Help · ${appName}`;
  if (pathname.startsWith('/settings')) return `Settings · ${appName}`;
  const item = NAV_ITEMS.find((i) => isOwned(pathname, i.owns));
  return item ? `${item.label} · ${appName}` : appName;
}
