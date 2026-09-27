import { flushSync } from 'react-dom';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * Runs `update` (a React state change - typically a `navigate()` call) inside
 * `document.startViewTransition` where the browser supports it, with a plain
 * synchronous update everywhere else - IN_APP_MANUAL.md §5a: "`startViewTransition` on
 * topic-to-topic navigation where supported, plain swap where not. Never block on it."
 *
 * <p>`flushSync` is required here: `startViewTransition`'s callback must have painted the
 * new DOM by the time it returns, and a React state update is otherwise asynchronous -
 * without it the browser would snapshot the *old* page twice and nothing would visibly
 * cross-fade.
 */
export function withViewTransition(update: () => void): void {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  document.startViewTransition(() => {
    flushSync(update);
  });
}
