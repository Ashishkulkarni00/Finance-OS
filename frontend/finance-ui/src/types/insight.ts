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
  | 'GOAL_BEHIND'
  /** A goal funded by a bill with no set amount — its pace cannot be judged at all. */
  | 'GOAL_FUNDING_UNCLEAR'
  /** Money set aside while debt costing more than it can earn is still running. */
  | 'RATE_MISMATCH';

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
  /**
   * What moved, when nothing is urgent (ROADMAP 3.3).
   *
   * Empty is the normal case and means exactly that — nothing moved, so nothing is said.
   * The server withholds it entirely when anything CRITICAL or ATTENTION is showing, so the
   * UI never has to decide whether a reassurance is appropriate.
   */
  whatMoved: string[];
  /**
   * Warnings you've answered (ROADMAP 3.2). Returned by `/insights/all` only.
   *
   * Folded away on screen rather than dropped — a list you can silently lose things from is
   * one you stop trusting, and an accidental dismissal would otherwise have no way back.
   */
  silenced: SilencedInsight[];
}

export interface SilencedInsight {
  key: string;
  title: string;
  /** Set for "until it changes". */
  dismissedAt?: string;
  /** Set for "not this week" — it returns on its own after this. */
  snoozedUntil?: string;
}
