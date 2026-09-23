import type { WriteEffect } from '@/types/effect';
import type { Money } from '@/lib/money';
import type { AccountSummary } from '@/types/api';
import type { CategorySummary } from '@/types/category';
import type { CommitmentAmountType, CommitmentFrequency, CommitmentSource, SettleAs } from '@/types/commitmentRule';
import type { TransactionResponse } from '@/types/transaction';

export type CommitmentInstanceStatus =
  | 'PENDING'
  | 'PART_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'UNVERIFIED'
  | 'NEEDS_REVIEW'
  | 'SETTLED_EARLIER'
  /** An optional bill the user chose not to pay this cycle - owes nothing. */
  | 'SKIPPED';

/** How urgently this instance needs the user - not the same as status. Computed
 *  server-side so Month, Today's Needs You, and any future surface agree.
 *  See AttentionTier.java. */
export type AttentionTier = 'NEEDS_YOU' | 'WORTH_KNOWING' | 'SETTLED';

export interface CommitmentInstanceResponse {
  id: number;
  commitmentId: number;
  commitmentName: string;
  cycleId: number;
  dueDate: string;
  expectedAmount: Money | null;
  status: CommitmentInstanceStatus;
  confirmedAmount: Money | null;
  outstanding: Money | null;
  confirmedAt: string | null;
  /** The day the money actually moved - the linked transaction's own date, not the
   *  moment we were told about it. Null while unsettled. */
  settledOn: string | null;
  linkedTransactionId: number | null;
  mandatory: boolean;
  /** "Family depends on it" - the row's own justification. Null when never set. */
  ifSkipped: string | null;
  /** The account this leaves from - shown inline on the row, not behind a click. */
  account: AccountSummary;
  /** The bill's category - Months groups its plan by it. Null when none is set. */
  category: CategorySummary | null;
  /** MANUAL, or the loan (etc.) this bill follows. */
  sourceType: CommitmentSource;
  sourceId: number | null;
  settleAs: SettleAs;
  /** Where the money goes for a TRANSFER or INVESTMENT bill. */
  toAccountId: number | null;
  attentionTier: AttentionTier;
  /** Positive = cost more than planned, negative = less. Null unless settled with both figures known. */
  variance: Money | null;
  /** What this write just did - absent on reads and when nothing moved (ADR-0017). */
  effect?: WriteEffect;
}

export interface CommitmentPlanProgressResponse {
  settledCount: number;
  settledTotal: Money;
  totalCount: number;
  plannedTotal: Money;
  /** Tier 1 - what the Needs You zone is showing. */
  needsYouCount: number;
  needsYouTotal: Money;
  /** Tier 2 - still to come. Sums what's outstanding, not what was expected, so a
   *  part-paid item counts only for the remainder. */
  upcomingCount: number;
  upcomingTotal: Money;
  /** One entry per category with a bill this cycle, in the user's category order; the
   *  uncategorised group (category null) comes last. */
  byCategory: PlanCategoryGroup[];
  /** Expected-income rows (salary) this cycle - not in any total above. */
  incomeCount: number;
  /** Income still to arrive. */
  incomeExpectedTotal: Money;
  /** Income already received against those rows - what arrived. */
  incomeReceivedTotal: Money;
  /** One entry per due date with a bill this cycle, earliest first - the "by when" view. */
  byDueDate: PlanDueDateGroup[];
}

export interface PlanDueDateGroup {
  dueDate: string;
  count: number;
  /** Every known amount due that day, paid or not. */
  plannedTotal: Money;
  /** What is still to leave for that day's unsettled bills. */
  outstandingTotal: Money;
}

export interface PlanCategoryGroup {
  category: CategorySummary | null;
  count: number;
  /** Every known amount in the group, paid or not. */
  plannedTotal: Money;
  /** What is still to leave for the group's unsettled bills. */
  outstandingTotal: Money;
}

/** Plan's "Standing" mirror line. */
/** GET /cycles/{id}/review - a month against its plan ("planned" = the plan as it stands now). */
export interface CycleReviewResponse {
  incomeExpected: Money;
  incomeReceived: Money;
  paymentsPlanned: Money;
  paymentsPaid: Money;
  paymentsCount: number;
  paymentsPaidCount: number;
  setAsidePlanned: Money;
  setAsideMade: Money;
  /** Absent when nothing was coming in. */
  flexible?: Money;
  spentOutsidePlan: Money;
  notDone: CycleReviewItem[];
  skipped: CycleReviewItem[];
  differences: { instanceId: number; name: string; planned: Money; actual: Money; difference: Money }[];
  largestUnplanned: { transactionId: number; description: string; date: string; amount: Money; category?: string }[];
}

export interface CycleReviewItem {
  instanceId: number;
  name: string;
  amount?: Money;
  dueDate: string;
  mandatory: boolean;
  /** A set-aside item (savings, SIP) rather than a payment. */
  savings: boolean;
}

/** GET /cycles/{id}/shape - expected in − committed − planned savings = flexible. */
export interface CycleShapeResponse {
  /** NO_INCOME: nothing coming in, so no flexible figure. INCOMPLETE: a bill needs an amount - flexible is an upper bound. */
  state: 'COMPLETE' | 'INCOMPLETE' | 'NO_INCOME';
  expectedIn: Money;
  /** The part of expectedIn that hasn't arrived yet. */
  incomeStillExpected: Money;
  /** Bills that are spent - expenses, and transfers paying a card or loan. */
  committed: Money;
  /** SIP/RD instalments and transfers into a non-spendable account. */
  plannedSavings: Money;
  /** Absent when NO_INCOME. May be negative. */
  flexible?: Money;
  unknownAmountCount: number;
  /** Spending no bill accounts for, less refunds. */
  spent: Money;
  /** spent ÷ flexible as a fraction; absent when flexible isn't positive. */
  spentShare?: number;
  /** Share of the cycle's days gone (0-1). */
  cycleElapsed: number;
}

export interface CycleStandingResponse {
  /** Received plus still expected this cycle. */
  incomeTotal: Money;
  /** The part of incomeTotal that hasn't arrived yet - "0.00" once it's all in. */
  incomeExpectedTotal: Money;
  committedTotal: Money;
  uncommittedTotal: Money;
  /** Fraction (0.42 means 42%) - never pre-multiplied, same as CycleSummaryResponse.savingsRate. */
  committedShare: number | null;
}

export interface CommitmentInstanceHistoryEntry {
  instanceId: number;
  cycleId: number;
  dueDate: string;
  status: CommitmentInstanceStatus;
  confirmedAmount: Money | null;
}

export interface CommitmentInstanceDetailResponse {
  id: number;
  dueDate: string;
  expectedAmount: Money | null;
  status: CommitmentInstanceStatus;
  confirmedAmount: Money | null;
  outstanding: Money | null;
  confirmedAt: string | null;
  attentionTier: AttentionTier;
  variance: Money | null;
  commitmentId: number;
  commitmentName: string;
  why: string | null;
  ifSkipped: string | null;
  amountType: CommitmentAmountType;
  fixedAmount: Money | null;
  frequency: CommitmentFrequency;
  dueDay: number;
  mandatory: boolean;
  requiresVerification: boolean;
  account: AccountSummary;
  category: CategorySummary | null;
  sourceType: CommitmentSource;
  sourceId: number | null;
  settleAs: SettleAs;
  toAccountId: number | null;
  linkedTransaction: TransactionResponse | null;
  history: CommitmentInstanceHistoryEntry[];
}
