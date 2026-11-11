import { useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query. `useMediaQuery('(min-width: 768px)')` is "tablet and up". */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind's `md` breakpoint: the phone / tablet divide used by the overlays (§7.1). */
export const useIsWide = () => useMediaQuery('(min-width: 768px)');
