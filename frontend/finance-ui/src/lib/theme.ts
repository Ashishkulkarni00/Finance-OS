/**
 * Light / dark / system (UI_UX_REVAMP_PLAN 4.17). "System" follows the device; light and dark force
 * `data-theme` on <html>, which the CSS tokens read. The choice is remembered per browser under
 * `kosh.theme` and applied before first paint by the script in `index.html`, so there is no flash.
 *
 * <p>Browser storage can be missing or blocked: every access is wrapped, and a failed write still
 * applies the choice for this visit.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

const KEY = 'kosh.theme';

export function readTheme(): ThemeChoice {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
  try {
    if (choice === 'system') window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, choice);
  } catch {
    /* storage blocked - the choice holds for this visit only */
  }
}

/** Remove everything Kosh remembers on this device except the theme. Returns how many were cleared. */
export function clearRemembered(): number {
  let cleared = 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('kosh.') && k !== KEY) keys.push(k);
    }
    for (const k of keys) {
      window.localStorage.removeItem(k);
      cleared += 1;
    }
  } catch {
    /* nothing to clear if storage is unavailable */
  }
  return cleared;
}
