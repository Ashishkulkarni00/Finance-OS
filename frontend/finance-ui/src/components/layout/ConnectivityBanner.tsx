import { useCallback, useEffect, useRef, useState } from 'react';
import { WifiOff, Check } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { formatClock } from '@/lib/dates';
import { baseApi } from '@/services/api/baseApi';
import { TAG_TYPES } from '@/services/api/tags';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { browserOffline, clearRecovered, serverAnswered } from '@/store/slices/connectivitySlice';

/** Seconds between probes: 2, 4, 8, 16, 30, then every 30 (UI_UX_REVAMP_PLAN §6.11). */
const SCHEDULE: readonly number[] = [2, 4, 8, 16, 30];
const JITTER = 0.2;
const RECOVERED_MS = 4000;


/** Seconds until the nth probe, with +-20% jitter so many tabs don't retry in step. */
function delayFor(attempt: number): number {
  const base = SCHEDULE[Math.min(attempt, SCHEDULE.length - 1)] ?? 30;
  return base * (1 + (Math.random() * 2 - 1) * JITTER);
}

/**
 * Connectivity mode (UI_UX_REVAMP_PLAN §6.11). While the server cannot be reached this says so,
 * prints when the figures on screen were last confirmed, and probes for recovery on a capped
 * backoff. It never retries faster than every ~2s, never in a hidden tab, and never makes stale
 * data look current: the time is the last moment the server actually answered.
 *
 * <p>The probe is one cheap GET (`/me`), not a refetch of every query. Only once it succeeds do
 * the active queries refetch, and the banner clears only after that, so the page is not declared
 * fresh before it is.
 */
export function ConnectivityBanner() {
  const dispatch = useAppDispatch();
  const { offline, lastOkAt, recoveredAt } = useAppSelector((s) => s.connectivity);
  const attempt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [probing, setProbing] = useState(false);
  const nextAt = useRef<number | null>(null);

  const probe = useCallback(async () => {
    window.clearTimeout(timer.current);
    nextAt.current = null;
    setProbing(true);
    try {
      // Any HTTP response means the server is there; only a thrown fetch means it is not.
      await fetch(`${import.meta.env.VITE_API_URL ?? '/api/v1'}/me`, { cache: 'no-store' });
      attempt.current = 0;
      dispatch(serverAnswered());
      dispatch(baseApi.util.invalidateTags([...TAG_TYPES]));
    } catch {
      attempt.current += 1;
      schedule();
    } finally {
      setProbing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    if (document.hidden) {
      nextAt.current = null;
      setSecondsLeft(null);
      return; // paused while the tab is hidden; visibilitychange resumes it
    }
    const seconds = delayFor(attempt.current);
    nextAt.current = Date.now() + seconds * 1000;
    setSecondsLeft(Math.ceil(seconds));
    timer.current = window.setTimeout(() => void probe(), seconds * 1000);
  }, [probe]);

  // Start / stop with the mode.
  useEffect(() => {
    if (!offline) {
      window.clearTimeout(timer.current);
      attempt.current = 0;
      setSecondsLeft(null);
      return;
    }
    schedule();
    return () => window.clearTimeout(timer.current);
  }, [offline, schedule]);

  // The browser's own signals: offline -> enter now; online / tab back -> probe immediately.
  useEffect(() => {
    const goOffline = () => dispatch(browserOffline());
    const resume = () => {
      if (offline && !document.hidden) {
        attempt.current = 0;
        void probe();
      }
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [dispatch, offline, probe]);

  // Countdown display.
  useEffect(() => {
    if (!offline) return;
    const id = window.setInterval(() => {
      if (nextAt.current) setSecondsLeft(Math.max(0, Math.ceil((nextAt.current - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [offline]);

  // "Back online" fades itself.
  useEffect(() => {
    if (!recoveredAt) return;
    const id = window.setTimeout(() => dispatch(clearRecovered()), RECOVERED_MS);
    return () => window.clearTimeout(id);
  }, [recoveredAt, dispatch]);

  if (recoveredAt && !offline) {
    return (
      <div role="status" className="flex items-center gap-space-2 bg-positive-wash px-space-4 py-space-2 text-caption text-positive">
        <Check size={14} strokeWidth={1.5} aria-hidden />
        Back online. Figures updated.
      </div>
    );
  }
  if (!offline) return null;

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-space-3 gap-y-space-1 bg-attention-wash px-space-4 py-space-3 text-caption text-attention"
    >
      <WifiOff size={14} strokeWidth={1.5} aria-hidden className="shrink-0" />
      <span className="min-w-0 flex-1 text-ink-soft">
        <strong className="font-medium text-attention">Can&rsquo;t reach {APP_NAME}&rsquo;s server.</strong>{' '}
        {lastOkAt ? (
          <>
            The figures below are from <span className="num">{formatClock(lastOkAt)}</span> and may be out of date.
          </>
        ) : (
          <>Nothing here is confirmed yet.</>
        )}{' '}
        Saving is paused until it is back.
      </span>
      <span className="num text-ink-muted">{probing ? 'Trying…' : secondsLeft != null ? `Retrying in ${secondsLeft}s` : 'Paused'}</span>
      <button
        type="button"
        onClick={() => {
          attempt.current = 0;
          void probe();
        }}
        disabled={probing}
        className="rounded-md px-space-2 py-[2px] font-medium text-accent underline-offset-2 hover:underline disabled:opacity-50"
      >
        Retry now
      </button>
    </div>
  );
}
