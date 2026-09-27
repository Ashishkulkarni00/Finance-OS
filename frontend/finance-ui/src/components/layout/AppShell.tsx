import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NavRail } from './NavRail';
import { PageAddHost } from './PageAddHost';
import { EffectToastHost } from '@/components/EffectToastHost';
import { AddSheet } from '@/features/transactions/components/AddSheet';
import { SettleCommitmentSheet } from '@/features/commitments/components/SettleCommitmentSheet';
import { HelpProvider } from '@/features/help/HelpProvider';
import { useAppDispatch } from '@/store/hooks';
import { openAddSheet } from '@/store/slices/uiSlice';

/**
 * Desktop-first shell: left rail + content. Laptop screens are the priority surface
 * for this build (per explicit product direction) - INFORMATION_ARCHITECTURE.md's
 * mobile-bottom-bar layout is not implemented yet. Content is capped at 1120px
 * (--width-content) and centred, per DESIGN_SYSTEM §5.
 *
 * <p>The outer container is pinned to exactly `h-screen` (not `min-h-screen`) with
 * `overflow-hidden`, so it can never grow past the viewport - only `<main>` scrolls.
 * With `min-h-screen`, a page taller than the viewport grew the whole flex row past
 * 100vh and the *document* scrolled, carrying the rail (a plain flow sibling, not
 * `position: sticky`) up and out of view with it. `NavRail` is already `h-screen`
 * internally, so once the parent can't grow past that, the rail simply never moves.
 */
export function AppShell() {
  const dispatch = useAppDispatch();
  // The manual is its own mode (IN_APP_MANUAL.md §5, revised 2026-09-26): on `/help/*`
  // the app rail is replaced by the manual's own navigation (`HelpShell`), not kept
  // alongside it - a second 240px column repeating product navigation that means
  // nothing while reading was the wrong call. Overlay mode is unaffected: it sits over
  // whatever page is underneath, so the rail there stays exactly where it is.
  const isHelpMode = useLocation().pathname.startsWith('/help');

  // Ctrl/Cmd+K always records a transaction, whatever the page: it's the everyday capture
  // shortcut and must not change meaning from page to page. The rail's button adapts.
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
      <div className="flex h-screen overflow-hidden bg-ground">
        {!isHelpMode && <NavRail />}
        <main id="app-main" className="flex-1 overflow-y-auto">
          <div className={isHelpMode ? 'mx-auto max-w-(--width-content-help) px-space-8 py-space-8' : 'mx-auto max-w-(--width-content) px-space-8 py-space-8'}>
            <Outlet />
          </div>
        </main>
        <AddSheet />
        <SettleCommitmentSheet />
        <PageAddHost />
        <EffectToastHost />
      </div>
    </HelpProvider>
  );
}
