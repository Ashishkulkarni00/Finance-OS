/** Date formatting - not money, so plain arithmetic here is fine (FRONTEND_CONVENTIONS §4 is about money only). */

export function formatFullDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export interface CycleProgress {
  totalDays: number;
  dayOfCycle: number;
  /** 0 before the cycle starts is impossible by construction; can be negative once ended. */
  daysRemaining: number;
  /** 0 to 1, clamped - how far through the cycle "today" sits. */
  fraction: number;
  ended: boolean;
  /** Today is before the cycle's first day - a month being planned, not lived. */
  upcoming: boolean;
}

/** `YYYY-MM-DD` shifted by whole days, in UTC so a timezone never moves it by one. */
export function shiftIsoDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` moved by whole months, keeping the day (clamped to the month's length). */
export function shiftIsoMonths(iso: string, months: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

/**
 * The salary month named `month` (1-12) of `year` - its start and end dates - stepped
 * whole months from a known cycle start, so every cycle keeps the salary day. A salary
 * month is named for the month it ends in (28 Sep – 27 Oct is October).
 */
export function salaryMonth(knownStart: string, year: number, month: number): { start: string; end: string } {
  const knownEnd = shiftIsoDays(shiftIsoMonths(knownStart, 1), -1);
  const k = year * 12 + month - (Number(knownEnd.slice(0, 4)) * 12 + Number(knownEnd.slice(5, 7)));
  return { start: shiftIsoMonths(knownStart, k), end: shiftIsoDays(shiftIsoMonths(knownStart, k + 1), -1) };
}

/** The year and month (1-12) a salary month starting on `start` is named for. */
export function salaryMonthOf(start: string): { year: number; month: number } {
  const end = shiftIsoDays(shiftIsoMonths(start, 1), -1);
  return { year: Number(end.slice(0, 4)), month: Number(end.slice(5, 7)) };
}

/**
 * "October" - a salary cycle is named for the month it mostly falls in, which is the
 * month it ends in (28 Sep – 27 Oct is October's). The year is added only when it
 * isn't the current one, so "January 2027" can't be mistaken for this January.
 */
export function cycleMonthName(endDate: string): string {
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00Z`);
  const sameYear = end.getUTCFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat('en-IN', { month: 'long', ...(sameYear ? {} : { year: 'numeric' }), timeZone: 'UTC' }).format(end);
}

/** The raw numbers behind the cycle - shared by everything that needs "where in the
 *  cycle is today" (the band, the crux verdict, the progress rule) so they can't drift. */
export function cycleProgress(startDate: string, endDate: string): CycleProgress {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const rawDay = Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1;
  const dayOfCycle = Math.min(totalDays, Math.max(1, rawDay));
  const daysRemaining = Math.round((end.getTime() - today.getTime()) / 86_400_000);
  const fraction = Math.min(1, Math.max(0, (today.getTime() - start.getTime()) / (end.getTime() - start.getTime())));

  return {
    totalDays,
    dayOfCycle,
    daysRemaining,
    fraction,
    ended: today.getTime() > end.getTime(),
    upcoming: today.getTime() < start.getTime(),
  };
}

/** "28 Aug – 27 Sep · day 13 of 31" - SCREEN_SPECS S1. */
export function cycleProgressLabel(startDate: string, endDate: string): string {
  const { totalDays, dayOfCycle } = cycleProgress(startDate, endDate);
  return `${shortDate(startDate)} – ${shortDate(endDate)} · day ${dayOfCycle} of ${totalDays}`;
}

export function formatShortDate(iso: string): string {
  return shortDate(iso);
}

const SALARY_DATE = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** "Mon, 28 Sept" - the salary date a cycle runs toward, i.e. the day after its last day.
 *  Named on both Today and Months, because both headline figures are "until then". */
export function formatSalaryDate(cycleEnd: string): string {
  const d = new Date(cycleEnd);
  d.setDate(d.getDate() + 1);
  return SALARY_DATE.format(d);
}

/** Local calendar day as `YYYY-MM-DD`. Deliberately not `toISOString().slice(0,10)`:
 *  that converts to UTC first, so anywhere east of Greenwich it names yesterday for the
 *  first hours of every day - and this is what decides whether a ledger header says
 *  "Today". */
function localIsoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today as a local `YYYY-MM-DD` - comparable as text with any ISO date from the API. */
export function todayLocalIso(): string {
  return localIsoDay(new Date());
}

/** Whether a `YYYY-MM-DD` date is the user's own today. */
export function isToday(iso: string): boolean {
  return iso.slice(0, 10) === localIsoDay(new Date());
}

export function isYesterday(iso: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return iso.slice(0, 10) === localIsoDay(d);
}

/** "Overdue by 2 days" / "Due in 3 days" / "Due today" - a day-count is not money, so
 *  this arithmetic is fine (see the file header). */
export function daysBetween(fromIso: string, toIso: string = new Date().toISOString()): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  return Math.round((from.getTime() - to.getTime()) / 86_400_000);
}
