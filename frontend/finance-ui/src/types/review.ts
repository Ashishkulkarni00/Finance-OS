import type { Money } from '@/lib/money';

/**
 * One salary month, consolidated.
 *
 * <p>`recorded: false` means no transaction falls in the month, and then **every money
 * field is absent** - the server sends null rather than zero on purpose. Render an em dash
 * (`Amount` already does), never ₹0: a month we know nothing about and a month in which
 * nothing happened are different facts, and only one of them is ever true here.
 */
export interface ReviewMonth {
  cycleId: number;
  startDate: string;
  endDate: string;
  label: string;
  /** The month containing today. Its figures are partial - see `elapsedShare`. */
  current: boolean;
  closed: boolean;
  recorded: boolean;
  /**
   * Whether any commitment fell due in the month at all. **False means `committed`,
   * `flexible` and `committedShare` are absent** - withheld, not zero. A month from before
   * the plan was set up has nothing linked to a bill, so the arithmetic reads "0% committed",
   * which is true of the links and false about the person. Show the spend as one undivided
   * figure and say the plan was not running yet.
   */
  planTracked: boolean;
  /** 0-1. Present only on the current month. */
  elapsedShare?: number;
  income?: Money;
  spend?: Money;
  /** The part of `spend` that settled a planned commitment. */
  committed?: Money;
  /** The rest - day-to-day money. `committed + flexible = spend`. */
  flexible?: Money;
  invested?: Money;
  /** `income − spend`. Investing is not consuming, so it is not subtracted. */
  net?: Money;
  /** `income − spend − invested` - what stayed liquid. */
  leftOver?: Money;
  savingsRate?: number;
  /** `committed ÷ income` - the one figure here that measures progress, not activity. */
  committedShare?: number;
  commitmentsPlanned?: number;
  commitmentsKept?: number;
  /**
   * What the plan said would leave spending money this month - bills **and** money set
   * aside, so it is deliberately larger than `committed`, which counts only what was spent.
   * Absent whenever any bill in the month had no amount yet.
   */
  plannedCommittedTotal?: Money;
  actualCommittedTotal?: Money;
}

/** This month against the last one cut off at the same day in - never against its full total. */
export interface ReviewSamePoint {
  previousCycleId: number;
  previousLabel: string;
  daysIn: number;
  cutOff: string;
  previousSpend: Money;
  /** Negative means less has gone out than by this day last month. Not better or worse. */
  spendChange: Money;
  previousIncome: Money;
  incomeChange: Money;
}

/** GET /review/months?months= - oldest first, so a chart reads left to right. */
export interface ReviewMonthsResponse {
  asOf: string;
  months: ReviewMonth[];
  /** How many of them have anything in them. Said out loud on the page. */
  monthsRecorded: number;
  samePoint?: ReviewSamePoint;
}

export interface DebtTrajectoryPoint {
  /** First of the calendar month, as its label. */
  month: string;
  outstanding: Money;
  /**
   * What the EMIs falling in this month take off the principal, and what they cost in
   * interest. **Both absent on the first point** - the month in progress, which the
   * forward-only walk does not look back into.
   */
  principalDue?: Money;
  interestDue?: Money;
}

export interface DebtTrajectoryLoan {
  loanId: number;
  name: string;
  outstanding: Money;
  emi: Money;
  payoffDate?: string;
  /** False when the loan has no rate recorded, so it contributes nothing to the line. */
  inCurve: boolean;
}

/** GET /review/debt-trajectory - every loan walked forward to the last payoff.
 *  `debtFreeDate` is absent whenever `excludedLoanCount > 0`: a date that omits a loan
 *  would be the most encouraging possible lie. */
export interface DebtTrajectoryResponse {
  asOf: string;
  outstandingNow: Money;
  debtFreeDate?: string;
  monthsToDebtFree?: number;
  /** What the remaining EMIs still cost in interest from here. */
  interestAhead: Money;
  /** EMIs already due with nothing recorded. The curve walks past them regardless. */
  unrecordedEmis: number;
  points: DebtTrajectoryPoint[];
  loans: DebtTrajectoryLoan[];
  excludedLoanCount: number;
  excludedOutstanding: Money;
}

/** One category in a month - GET /review/months/{cycleId}/categories. */
export interface ReviewCategory {
  categoryId: number;
  name: string;
  group: string;
  total: Money;
  /** The part that settled a planned bill. `committed + flexible = total`. */
  committed: Money;
  flexible: Money;
  /** Of the month's spend, 0-1. */
  share?: number | null;
  shareOfFlexible?: number | null;
}

export interface ReviewMonthCategories {
  cycleId: number;
  label: string;
  startDate: string;
  endDate: string;
  recorded: boolean;
  planTracked: boolean;
  spend?: Money;
  committed?: Money;
  flexible?: Money;
  /** Largest first. */
  categories: ReviewCategory[];
}
