import type { Money } from '@/lib/money';

/** ROADMAP 6.2 — a concrete way back from a month that has gone wrong. */
export type RecoveryState = 'ON_COURSE' | 'STRETCHED' | 'BROKEN' | 'INCOMPLETE';

export interface RecoveryStep {
  /** DEFER an optional payment, RELEASE money set aside, or SPEND_LESS for the rest. */
  kind: 'DEFER' | 'RELEASE' | 'SPEND_LESS';
  refId: number | null;
  label: string;
  amount: Money;
  /** SPEND_LESS only: how much lower than usual the day rate would be. */
  perDayLess: Money | null;
}

export interface RecoveryPlan {
  state: RecoveryState;
  gap: Money | null;
  daysToSalary: number;
  steps: RecoveryStep[];
  stillShort: Money | null;
  /** What gets put back afterwards: deferred + released. */
  catchUp: Money | null;
  catchUpMonths: number | null;
  catchUpPerMonth: Money | null;
  reason: string;
}
