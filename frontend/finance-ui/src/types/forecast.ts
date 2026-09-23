import type { Money } from '@/lib/money';

export type CommitmentBucket = 'INCOME' | 'PAYMENT' | 'SET_ASIDE' | 'NEITHER';

export interface ForecastUnlock {
  commitmentId: number;
  name: string;
  amount: Money;
  bucket: CommitmentBucket;
}

export interface ForecastAnnualItem {
  commitmentId: number;
  name: string;
  amount?: Money;
  dueDate: string;
}

export interface ForecastMonth {
  cycleStart: string;
  cycleEnd: string;
  incomeExpected: Money;
  committed: Money;
  setAside: Money;
  /** Absent when nothing is planned to come in this month. */
  flexible?: Money;
  unknownAmountCount: number;
  unlocks: ForecastUnlock[];
  annualItems: ForecastAnnualItem[];
}

/** GET /forecast?months= - the plan projected forward, month[0] = the current cycle.
 *  A pure projection of the rules as they stand today, not blended with what's actually
 *  happened - see the field-level notes on why a variable bill is always "unknown" here. */
export interface ForecastResponse {
  months: ForecastMonth[];
  /**
   * What stops leaving every month once everything that ends in the horizon has ended.
   * Computed on the server — the browser never adds money up (FRONTEND_CONVENTIONS §4
   * rule 2), which this component used to do with a `reduce`.
   */
  unlockedMonthlyTotal: Money;
}
