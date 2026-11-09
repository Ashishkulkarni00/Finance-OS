import type { Money } from '@/lib/money';
import type { GoalFeasibilityState } from '@/types/goal';

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

/**
 * One thing freed-up money could do — ROADMAP 4.4. Discriminated on `kind`: a loan option
 * is months and interest, a goal option is a date, keeping it carries no figure. They are
 * deliberately never put on one scale.
 */
export type UnlockOptionKind = 'LOAN' | 'GOAL' | 'KEEP';

export interface UnlockOption {
  kind: UnlockOptionKind;
  targetId: number | null;
  targetName: string;
  amount: Money;
  /** LOAN: how many fewer EMIs. */
  clearsMonthsSooner: number | null;
  /** LOAN: interest those EMIs would have cost. */
  interestSaved: Money | null;
  /** GOAL: when the target would be met instead. */
  reachesOn: string | null;
  /** GOAL: how much earlier. Null when there is no honest current pace. */
  reachesMonthsSooner: number | null;
  /** Why this option could not be (fully) costed. */
  unknownReason: string | null;
}

/** ROADMAP 4.3 — where a lump sum could go. Each kind in its own unit; never ranked across kinds. */
export type LumpSumKind = 'PREPAY' | 'GOAL' | 'KEEP';

export interface LumpSumOption {
  kind: LumpSumKind;
  targetId: number | null;
  targetName: string;
  /** How much of the sum this option can absorb (capped at what the loan owes / the goal needs). */
  applied: Money;
  clearsMonthsSooner: number | null;
  interestSaved: Money | null;
  closesLoan: boolean;
  emiFreed: Money | null;
  annualRate: number | null;
  goalBefore: GoalFeasibilityState | null;
  goalAfter: GoalFeasibilityState | null;
  goalAfterReason: string | null;
  runwayMonthsAfter: number | null;
  unknownReason: string | null;
}

export interface LumpSumResponse {
  amount: Money;
  runwayMonthsBefore: number | null;
  /** An investment must beat this, after tax and with certainty, to do better than prepaying. No return is assumed. */
  breakEvenRate: number | null;
  breakEvenLoan: string | null;
  options: LumpSumOption[];
}
