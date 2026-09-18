import { useSearchParams } from 'react-router-dom';
import { useGetCurrentCycleQuery, useGetCycleQuery, useLazyGetCycleForDateQuery } from '@/services/cycleService';
import { shiftIsoDays, todayLocalIso } from '@/lib/dates';

/**
 * Which cycle Months is showing - `?cycle=<id>` in the URL, or the current cycle when
 * there's no parameter.
 *
 * <p>In the URL, not in component state, for the same reason the Ledger's filters are:
 * "October's plan" should survive a refresh and be a link you can open again. The
 * current cycle never carries the parameter, so `/month` always means "now".
 *
 * <p>Stepping resolves the neighbouring cycle on the server by date - the day before
 * this one starts, or the day after it ends - because cycle boundaries follow the user's
 * salary day, which the browser doesn't know and shouldn't guess.
 */
export function useSelectedCycle() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('cycle');
  const explicitId = raw && /^\d+$/.test(raw) ? Number(raw) : undefined;

  const current = useGetCurrentCycleQuery();
  const explicit = useGetCycleQuery(explicitId ?? 0, { skip: explicitId == null });
  const [resolveForDate, { isFetching: moving }] = useLazyGetCycleForDateQuery();

  const cycle = explicitId != null ? explicit.data : current.data;
  const today = todayLocalIso();

  const isCurrent = !!cycle && !!current.data && cycle.id === current.data.id;
  const isFuture = !!cycle && cycle.startDate > today;
  const isPast = !!cycle && cycle.endDate < today;

  const show = (cycleId: number | null) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cycleId == null) next.delete('cycle');
      else next.set('cycle', String(cycleId));
      return next;
    });

  const goToDate = async (date: string) => {
    const target = await resolveForDate(date).unwrap();
    show(current.data && target.id === current.data.id ? null : target.id);
  };

  return {
    cycle,
    currentCycle: current.data,
    isCurrent,
    isFuture,
    isPast,
    isLoading: current.isLoading || (explicitId != null && explicit.isLoading),
    isError: current.isError || (explicitId != null && explicit.isError),
    moving,
    refetch: explicitId != null ? explicit.refetch : current.refetch,
    goPrevious: () => cycle && goToDate(shiftIsoDays(cycle.startDate, -1)),
    goNext: () => cycle && goToDate(shiftIsoDays(cycle.endDate, 1)),
    goCurrent: () => show(null),
  };
}
