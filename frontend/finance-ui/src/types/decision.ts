import type { Money } from '@/lib/money';

/**
 * What a spend would cost, before it happens — ROADMAP 4.2.
 *
 * Discriminated on `state` so a component cannot read a figure that isn't there. On
 * `INCOMPLETE` every money field is null and `reason` carries the sentence to show
 * instead: a bill with no amount means Free until salary is unknown, and an answer built
 * on an unknown is the most confident wrong number this product could print.
 */
export type AffordabilityState =
  /** It fits, and nothing about the month changes shape. */
  | 'FITS'
  /** It fits, but the rate left to live on drops materially. */
  | 'TIGHTENS'
  /** A specific dated payment stops being covered. */
  | 'SHORTFALL'
  /** More than the chosen account holds today. */
  | 'EXCEEDS_ACCOUNT'
  /** A mandatory bill has no amount, so no honest answer is possible. */
  | 'INCOMPLETE';

export interface AffordabilityResponse {
  state: AffordabilityState;
  amount: Money;
  accountId: number;
  accountName: string;
  /** Null only on INCOMPLETE. */
  freeBefore: Money | null;
  freeAfter: Money | null;
  perDayBefore: Money | null;
  perDayAfter: Money | null;
  daysToSalary: number;
  accountBalanceBefore: Money | null;
  accountBalanceAfter: Money | null;
  /** The first dated payment this spend would leave uncovered. Null when none. */
  shortfallName: string | null;
  shortfallOn: string | null;
  shortBy: Money | null;
  /** Why no answer is possible. Set only on INCOMPLETE. */
  reason: string | null;
}
