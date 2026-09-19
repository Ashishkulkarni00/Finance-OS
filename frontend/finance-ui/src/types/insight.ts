import type { Money } from '@/lib/money';

export type InsightSurface = 'TODAY' | 'MONTH';

export type InsightType =
  | 'SHORTFALL'
  | 'OVERDUE'
  | 'DUE_SOON'
  | 'NEEDS_AMOUNT'
  | 'NEEDS_REVIEW'
  | 'UNVERIFIED'
  | 'INCOME_LATE'
  | 'PLANNED_ITEM_MISSED'
  | 'CARD_BILL_DUE'
  | 'CARD_BILL_OVERDUE'
  | 'GOAL_BEHIND';

/** CRITICAL = money is lost if nothing happens. Shown in attention tone, never red. */
export type InsightSeverity = 'CRITICAL' | 'ATTENTION' | 'OPPORTUNITY' | 'INFO';

export interface InsightAction {
  kind: 'SETTLE' | 'ESTIMATE' | 'CONFIRM' | 'TRANSFER' | 'OPEN';
  label: string;
  instanceId?: number;
  fromAccountId?: number;
  toAccountId?: number;
  amount?: Money;
  route?: string;
}

export interface InsightItem {
  key: string;
  type: InsightType;
  severity: InsightSeverity;
  /** Server wording - the same on every screen. */
  title: string;
  /** The basis: which figures and dates this comes from. */
  explanation: string;
  impact?: Money;
  when?: string;
  action?: InsightAction;
}

/** GET /insights?surface= - ranked, capped (Today 3, Month 5); `total` counts them all. */
export interface InsightListResponse {
  items: InsightItem[];
  total: number;
}
