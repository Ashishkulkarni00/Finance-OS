import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NavRail } from './NavRail';
import { BottomBar, BOTTOM_BAR_PX } from './BottomBar';
import { AddFab } from './AddFab';
import { ConnectivityBanner } from './ConnectivityBanner';
import { PageSkeleton } from './PageSkeleton';
import { PageAddHost } from './PageAddHost';
import { titleFor } from './navItems';
import { EffectToastHost } from '@/components/EffectToastHost';
import { AddSheet } from '@/features/transactions/components/AddSheet';
import { SettleCommitmentSheet } from '@/features/commitments/components/SettleCommitmentSheet';
import { HelpProvider } from '@/features/help/HelpProvider';
import { NeedsYouPanel } from '@/features/attention/NeedsYouPanel';
import { PendingDeleteHost } from '@/features/ledger/components/PendingDeleteHost';
import { useAppDispatch } from '@/store/hooks';
import { openAddSheet } from '@/store/slices/uiSlice';
import { APP_NAME } from '@/lib/brand';

/**
 * The responsive shell (UI_UX_REVAMP_PLAN Phase 3).
 *
 * <ul>
 *   <li>**Phone (< 768px):** content full width, a bottom bar, and an always-visible Add.</li>
 *   <li>**Tablet (768-1023px):** a 72px icon rail.</li>
 *   <li>**Desktop (>= 1024px):** the full sidebar.</li>
 * </ul>
 *
 * <p>The outer container is pinned to exactly `h-dvh` with `overflow-hidden`, so only `<main>`
 * scrolls and the navigation never moves. On a phone `<main>` pads its bottom by the bar, the Add
 * pill and the safe-area inset, so the last row is never behind them.
 *
 * <p>On a route change focus moves to `<main>` and the document title is set to the page's name,
 * so a screen-reader user hears where they are, and a keyboard user is not left on a link in
 * the navigation they just used (§6.8).
 */
export function AppShell() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  // The manual is its own mode (IN_APP_MANUAL.md §5, revised 2026-09-26): on `/help/*` the app
  // rail is replaced by the manual's own navigation (`HelpShell`).
  const isHelpMode = pathname.startsWith('/help');
  // Closing a month is a short, fixed flow: no navigation to wander off into (UI_UX_REVAMP_PLAN 4.6).
  const isFocusMode = pathname.startsWith('/month/close');
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    document.title = titleFor(pathname, APP_NAME);
    // Not on first load (the browser has already placed focus), and not when something inside
    // the page already holds it.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // Ctrl/Cmd+K always records a transaction, whatever the page: it's the everyday capture
  // shortcut and must not change meaning from page to page.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(openAddSheet());
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  return (
    <HelpProvider>
      <div className="flex h-dvh overflow-hidden bg-ground">
        {!isHelpMode && !isFocusMode && <NavRail />}
        <div className="flex min-w-0 flex-1 flex-col">
          <ConnectivityBanner />
          <main
            id="app-main"
            ref={mainRef}
            tabIndex={-1}
            // The bottom padding is only for the phone's bar + Add pill; md+ has neither.
            style={{ ['--phone-bottom' as string]: isFocusMode ? '0px' : `calc(${BOTTOM_BAR_PX}px + env(safe-area-inset-bottom) + 88px)` }}
            className="min-h-0 flex-1 overflow-y-auto pb-(--phone-bottom) outline-none md:pb-0"
          >
            <div
              className={
                isHelpMode
                  ? 'mx-auto max-w-(--width-content-help) px-space-4 py-space-5 md:px-space-5 lg:px-space-8 lg:py-space-8'
                  : 'mx-auto max-w-(--width-content) px-space-4 py-space-5 md:px-space-5 lg:px-10 lg:py-space-8'
              }
            >
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
        {!isHelpMode && !isFocusMode && <BottomBar />}
        {!isHelpMode && !isFocusMode && <AddFab />}
        <AddSheet />
        <SettleCommitmentSheet />
        <PageAddHost />
        <NeedsYouPanel />
        <EffectToastHost />
        <PendingDeleteHost />
      </div>
    </HelpProvider>
  );
}
