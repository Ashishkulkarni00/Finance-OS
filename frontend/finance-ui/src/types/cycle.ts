import type { Money } from '@/lib/money';

export interface CycleResponse {
  id: number;
  startDate: string;
  endDate: string;
  label: string;
  closed: boolean;
  closedAt: string | null;
}

export interface CycleSummaryResponse {
  incomeTotal: Money;
  expenseTotal: Money;
  investedTotal: Money;
  transferredTotal: Money;
  net: Money;
  savingsRate: number | null;
}

export interface CycleSnapshotResponse extends CycleSummaryResponse {
  id: number;
  cycleId: number;
  realBalance: Money | null;
  netWorth: Money;
  totalDebt: Money;
  createdAt: string;
}

export interface CategorySpendResponse {
  categoryId: number;
  categoryName: string;
  categoryGroup: string;
  amount: Money;
  /** Fraction of the group total (0.38 means 38%) - never pre-multiplied, same
   *  convention as savingsRate. Null when there's nothing to take a share of. */
  share: number | null;
}

/** Day-to-day spending this cycle. FLEXIBLE-group categories only, largest first -
 *  committed spending already has a home on the worklist. */
export interface FlexibleSpendingResponse {
  total: Money;
  categories: CategorySpendResponse[];
}
