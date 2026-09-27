import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { HelpContextMenu, type HelpMenuState } from './components/HelpContextMenu';
import { HelpOverlay } from './HelpOverlay';
import { resolveDocKey } from './contextMap';
import { byId } from './content';

/** The `?` key opens help for "the current page" - IN_APP_MANUAL.md §4. Only the
 *  handful of routes Phase A actually wrote content for are mapped; everywhere else
 *  falls back to the manual's home rather than a wrong or generic topic. */
const PAGE_TOPIC: Record<string, string> = {
  '/today': 'today.the-today-screen',
  '/month': 'months.the-month-line',
  '/money/accounts': 'accounts.balance-vs-available',
  '/money/debts': 'loans.understanding-a-loan',
  '/ledger': 'spending.recording-an-expense',
};

/** Sentinel used as the `?help=` value for "the manual's own home", as opposed to a
 *  specific topic id - keeps `DocTopicId` itself free of a magic string. */
export const HELP_HOME = '__home__';

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 10;

interface HelpContextValue {
  /** Opens the overlay on a specific topic - the door a visible help icon or a
   *  "Learn more" link uses. */
  open: (topicId: string) => void;
  /**
   * The last route visited outside `/help/*` - what `← Back to Kosh` returns to
   * (IN_APP_MANUAL.md §5's "The manual is its own mode"). Falls back to `/today` if the
   * manual is opened first, e.g. from a bookmark, with nothing to go back to.
   */
  backTo: string;
}

const HelpContext = createContext<HelpContextValue | null>(null);
const DEFAULT_BACK_TO = '/today';

/** For a visible help icon / "Learn more" link - the fourth door in §4's table. */
export function useHelp(): HelpContextValue {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error('useHelp must be used inside HelpProvider');
  return ctx;
}

/**
 * Owns every door into contextual help (right-click, long-press, the `?` key) and the
 * `?help=` search param the overlay renders from. Mounted once, inside `AppShell`, so
 * every page underneath shares the same listeners and the same overlay instance.
 */
export function HelpProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [menu, setMenu] = useState<HelpMenuState | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);

  // Remembered, not derived from history: `/help/*` never overwrites it, so the button
  // stays correct even after browsing several manual pages in a row.
  const [backTo, setBackTo] = useState(DEFAULT_BACK_TO);
  useEffect(() => {
    if (!location.pathname.startsWith('/help')) {
      setBackTo(`${location.pathname}${location.search}`);
    }
  }, [location.pathname, location.search]);

  const openTopic = useCallback(
    (topicId: string) => {
      const next = new URLSearchParams(searchParams);
      next.set('help', topicId);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const closeOverlay = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('help');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const openForKey = useCallback(
    (key: string, x: number, y: number) => {
      const topicId = resolveDocKey(key);
      if (!topicId) return; // unmapped - contextMap.ts already warned in dev; do nothing
      const title = byId[topicId]?.title ?? 'Coming soon';
      setMenu({ x, y, title, onSelect: () => openTopic(topicId) });
    },
    [openTopic],
  );

  // Right-click: only an element carrying [data-doc] intercepts the menu. Everywhere
  // else the native context menu opens untouched - copy, inspect, open-in-new-tab all
  // keep working on the figures a finance product is full of.
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.('[data-doc]');
      if (!el) return;
      const key = el.getAttribute('data-doc');
      if (!key) return;
      const topicId = resolveDocKey(key);
      if (!topicId) return;
      e.preventDefault();
      openForKey(key, e.clientX, e.clientY);
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, [openForKey]);

  // Long-press (~500ms), cancelled by move or scroll - the touch equivalent of right-click.
  useEffect(() => {
    const clear = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      longPressStart.current = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.('[data-doc]');
      if (!el) return;
      const key = el.getAttribute('data-doc');
      if (!key) return;
      const touch = e.touches[0];
      if (!touch) return;
      longPressStart.current = { x: touch.clientX, y: touch.clientY };
      longPressTimer.current = setTimeout(() => {
        openForKey(key, touch.clientX, touch.clientY);
        clear();
      }, LONG_PRESS_MS);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!longPressStart.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - longPressStart.current.x;
      const dy = touch.clientY - longPressStart.current.y;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE) clear();
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', clear);
    document.addEventListener('touchcancel', clear);
    document.addEventListener('scroll', clear, true);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', clear);
      document.removeEventListener('touchcancel', clear);
      document.removeEventListener('scroll', clear, true);
      clear();
    };
  }, [openForKey]);

  // "?" opens help for the current page - ignored while typing, or with a modifier held
  // (so it never fights a browser/OS shortcut that also uses Shift+/).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) return;
      e.preventDefault();
      const topicId = PAGE_TOPIC[location.pathname] ?? HELP_HOME;
      openTopic(topicId);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [location.pathname, openTopic]);

  const value = useMemo<HelpContextValue>(() => ({ open: openTopic, backTo }), [openTopic, backTo]);
  const activeTopicId = searchParams.get('help');

  return (
    <HelpContext.Provider value={value}>
      {children}
      {menu && <HelpContextMenu menu={menu} onDismiss={() => setMenu(null)} />}
      {activeTopicId && <HelpOverlay topicId={activeTopicId} onClose={closeOverlay} onNavigate={openTopic} />}
    </HelpContext.Provider>
  );
}
