import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const PARAM = 'needs';

/**
 * Whether the Needs-you panel is open. The state lives in the URL (`?needs=1`) rather than in
 * the store, for the same reasons the help overlay's does: Back closes it, a refresh keeps it,
 * and a link can open it. It also means the panel opens over *whatever page the user is on*,
 * which is why it is a panel and not a page - the thing it lists is about the page behind it
 * (UI_UX_REVAMP_PLAN 3.3, 4.2).
 *
 * <p>Other parameters (`?help=`, `?cycle=`) are preserved when it opens or closes.
 */
export function useNeedsPanel() {
  const [params, setParams] = useSearchParams();
  const isOpen = params.get(PARAM) === '1';

  const show = useCallback(() => {
    const next = new URLSearchParams(params);
    next.set(PARAM, '1');
    setParams(next);
  }, [params, setParams]);

  const hide = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete(PARAM);
    setParams(next);
  }, [params, setParams]);

  return { isOpen, show, hide };
}
