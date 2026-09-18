import type { Money } from '@/lib/money';

export interface ProjectionResponse {
  accountId: number;
  accountName: string;
  currentBalance: Money;
  projectedBalance: Money;
  projectionDate: string;
  shortfall: boolean;
  /** Due-date order. */
  deductions: ProjectionDeduction[];
}

export interface ProjectionDeduction {
  commitmentInstanceId: number;
  name: string;
  dueDate: string;
  amount: Money;
  /** The account's balance once this bill and every earlier one in the list have left. */
  balanceAfter: Money;
  /** Whether that stays at or above the account's minimum (else zero). Null on a credit
   *  card, where a negative balance is normal. */
  covered: boolean | null;
}
