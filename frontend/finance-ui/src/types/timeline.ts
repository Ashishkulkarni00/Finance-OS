import type { Money } from '@/lib/money';

/** INCOME is money coming in (expected salary) - never a payment. */
export type TimelineItemType = 'COMMITMENT' | 'CARD_STATEMENT' | 'LOAN_EMI' | 'INCOME';

export interface TimelineItemResponse {
  type: TimelineItemType;
  sourceId: number;
  name: string;
  dueDate: string;
  amount: Money | null;
  accountName: string;
  accountId: number;
}
