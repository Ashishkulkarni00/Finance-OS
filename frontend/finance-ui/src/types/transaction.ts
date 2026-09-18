import type { Money } from '@/lib/money';
import type { AccountSummary } from '@/types/api';
import type { CategorySummary } from '@/types/category';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT' | 'REFUND';

export interface TransactionResponse {
  id: number;
  date: string;
  description: string;
  type: TransactionType;
  typeLabel: string;
  countsAsSpending: boolean;
  amount: Money;
  account: AccountSummary;
  toAccount: AccountSummary | null;
  category: CategorySummary | null;
  merchant: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  date: string;
  description: string;
  type: TransactionType;
  amount: Money;
  accountId: number;
  toAccountId?: number | null;
  categoryId?: number | null;
  merchant?: string | null;
  note?: string | null;
}

/** Partial update - every field optional, `null`/`undefined` means "leave unchanged"
 *  except where explicitly clearing a nullable field (merchant, note, categoryId). */
export interface UpdateTransactionRequest {
  date?: string;
  description?: string;
  type?: TransactionType;
  amount?: Money;
  accountId?: number;
  toAccountId?: number | null;
  categoryId?: number | null;
  merchant?: string | null;
  note?: string | null;
}

/**
 * The Ledger's stated-view total (LEDGER_UX_SPEC.md §2 Zone 1) - the same filters as the
 * list, collapsed into one row, computed independently of pagination.
 *
 * Three figures, not one net: `moneyIn` (INCOME, REFUND) and `moneyOut` (EXPENSE) kept
 * apart, and `transferred` (TRANSFER, INVESTMENT) kept out of both - a transfer is not a
 * gain or a loss, it's the same money in a different pocket. Folding it into spending is
 * the exact double-count rule 4 forbids.
 */
export interface TransactionViewSummaryResponse {
  moneyIn: Money;
  moneyOut: Money;
  transferred: Money;
  entryCount: number;
}

/** One day's totals within the Ledger's current filters - the band above that day's rows. */
export interface DaySubtotalResponse {
  date: string;
  moneyIn: Money;
  moneyOut: Money;
  transferred: Money;
}
