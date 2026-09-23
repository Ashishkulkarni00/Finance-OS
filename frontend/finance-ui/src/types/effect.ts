import type { Money } from '@/lib/money';
import type { InsightItem } from '@/types/insight';

/**
 * What a write just did (ADR-0017, ROADMAP 0.4).
 *
 * Attached to the response of a write, never a read, and **absent whenever nothing moved** -
 * so the presence of this object is itself the signal that there is something to say.
 *
 * Every figure is optional, and a missing figure means **unknown, not zero**: position
 * refuses to compute while a mandatory commitment has no amount yet.
 */
export interface WriteEffect {
  /**
   * What is left to spend **today**, before and after. Compare these; never subtract them -
   * money arithmetic belongs on the server (FRONTEND_CONVENTIONS §4 rule 2).
   *
   * This is `roomLeft`, not `roomToday`. The day's allowance adds today's spending back
   * before dividing, so it does not move when you spend; an effect built on it always
   * reported "unchanged".
   */
  leftTodayBefore?: Money;
  leftTodayAfter?: Money;
  realBalanceBefore?: Money;
  realBalanceAfter?: Money;
  /** Warnings that just became true. Capped at two by the server. */
  started: InsightItem[];
  /** Warnings that just stopped being true - the recovery. */
  cleared: ClearedInsight[];
  moreStarted: number;
  moreCleared: number;
  /** HELD when something needs acknowledging; QUIET for everything else. */
  prominence: 'HELD' | 'QUIET';
}

export interface ClearedInsight {
  key: string;
  title: string;
}
