import type { Money } from '@/lib/money';
import type { AccountSummary } from '@/types/api';

export type LoanPaidVia = 'BANK' | 'CARD';
export type RateType = 'FIXED' | 'FLOATING';

/**
 * How much of this loan's terms came from paperwork rather than memory. Not a label -
 * it gates the derived figures: at TBD the backend withholds `outstandingPrincipal`,
 * `amountRepaid` and `payoffDate` rather than computing them from terms nobody supplied.
 * See LoanConfidence.java.
 */
export type LoanConfidence = 'CONFIRMED' | 'ESTIMATED' | 'TBD';

/** ACTIVE · UNCONFIRMED (a payment we can't verify - never assume it's paid) ·
 *  SCHEDULED (first EMI still in the future) · CLOSED. */
export type LoanStatus = 'ACTIVE' | 'UNCONFIRMED' | 'SCHEDULED' | 'CLOSED';

export interface LoanResponse {
  id: number;
  /** The LOAN account - the liability itself, not where the EMI comes from. */
  account: AccountSummary;
  /** The account the EMI debits. Null when never recorded - never inferred. */
  payFromAccount: AccountSummary | null;
  lender: string;
  /** Where the loan stands (V13): what was owed on `balanceAsOf`, as stated. Every figure
   *  below is derived forward from these four. */
  outstandingBalance: Money;
  balanceAsOf: string;
  /** EMIs still to pay as of `balanceAsOf`. */
  emisRemaining: number;
  /** The first EMI after `balanceAsOf`. */
  firstEmiDate: string;
  /** The original loan - background only, and optional. */
  principal: Money | null;
  /** Null when the rate was never supplied - the workbook's "TBD". */
  annualRate: number | null;
  rateType: RateType;
  tenureMonths: number | null;
  /** When the loan was disbursed. */
  startDate: string | null;
  /** The original loan's first EMI. */
  originalFirstEmiDate: string | null;
  emiDay: number | null;
  emi: Money;
  paidVia: LoanPaidVia;
  confidence: LoanConfidence;
  status: LoanStatus;
  note: string | null;
  /** Owed today. The stated balance until an EMI falls due after it; after that it needs
   *  the rate, and is null without one. */
  outstandingPrincipal: Money | null;
  /** Repaid since `balanceAsOf`. Null whenever `outstandingPrincipal` is. */
  amountRepaid: Money | null;
  /** The last remaining EMI's due date - known without a rate. */
  payoffDate: string | null;
  /** EMIs still to come today - an EMI counts as paid once its due date passes. */
  emisLeft: number;
  /** EMIs whose due date has passed with no payment recorded (ROADMAP 1.2). The balance
   *  does not move for these - an unpaid EMI is never assumed paid. */
  unrecordedEmis: number;
  /** Due date of the earliest unrecorded EMI. Null when there are none. */
  oldestUnrecordedDue: string | null;
  remainingPayments: Money;
  /** EMIs it actually takes to clear what's owed at this rate; -1 if never; null without a rate. */
  impliedEmisRemaining: number | null;
  /** Whether owed, rate, EMI and EMIs left agree. Null without a rate. */
  termsConsistent: boolean | null;
  /** The plan bill that pays this EMI (it follows the loan); null if the EMI isn't in the plan. */
  planCommitmentId: number | null;
}

export interface LoanSummaryResponse {
  count: number;
  /** Leaves a bank account directly. */
  bankEmiTotal: Money;
  /** Arrives inside the card bill, not separately. Never added to the figure above -
   *  doing so counts the same money twice (rule 4). */
  cardEmiTotal: Money;
  remainingPaymentsTotal: Money;
  unconfirmedCount: number;
  tbdCount: number;
}

/** POST /loans/estimate - whatever is known so far; every field optional. */
export interface LoanEstimateRequest {
  principal?: Money | null;
  annualRate?: number | null;
  tenureMonths?: number | null;
  startDate?: string | null;
  originalFirstEmiDate?: string | null;
  emi?: Money | null;
  outstandingBalance?: Money | null;
  emisRemaining?: number | null;
  emiDay?: number | null;
  asOf?: string | null;
}

/** What the server could work out. Null wherever the inputs don't determine it. */
export interface LoanEstimateResponse {
  asOf: string;
  standardEmi: Money | null;
  emi: Money | null;
  emiDiffersFromTerms: boolean | null;
  originalFirstEmiDate: string | null;
  lastEmiDate: string | null;
  emisPaid: number | null;
  emisRemaining: number | null;
  nextEmiDate: string | null;
  outstandingBalance: Money | null;
}

export interface CreateLoanRequest {
  accountId: number;
  lender: string;
  /** Where it stands - required. */
  outstandingBalance: Money;
  balanceAsOf: string;
  emisRemaining: number;
  firstEmiDate?: string | null;
  /** Omit when it was never supplied - the backend sets confidence to TBD rather than
   *  inventing a rate, and withholds every figure derived from one. */
  annualRate?: number | null;
  /** The original loan - optional background. */
  principal?: Money | null;
  tenureMonths?: number | null;
  startDate?: string | null;
  originalFirstEmiDate?: string | null;
  emi: Money;
  paidVia: LoanPaidVia;
  confidence?: LoanConfidence | null;
  status?: LoanStatus | null;
  emiDay?: number | null;
  /** The account the EMI debits - not the loan's own liability account. */
  payFromAccountId?: number | null;
  rateType?: RateType | null;
  note?: string | null;
}

/** Partial update - `null`/absent means "leave unchanged". Supplying real terms is what
 *  moves a loan out of TBD and turns its derived figures back on. */
export interface UpdateLoanRequest {
  lender?: string;
  /** Re-stating where the loan stands is how a missed or early EMI is corrected. */
  outstandingBalance?: Money;
  balanceAsOf?: string;
  emisRemaining?: number;
  firstEmiDate?: string;
  principal?: Money;
  tenureMonths?: number;
  startDate?: string;
  originalFirstEmiDate?: string;
  /** Remove a rate entered by mistake - puts the loan back to TBD. */
  clearAnnualRate?: boolean;
  /** Forget which account the EMI leaves from. */
  clearPayFromAccount?: boolean;
  annualRate?: number;
  emi?: Money;
  paidVia?: LoanPaidVia;
  confidence?: LoanConfidence;
  status?: LoanStatus;
  emiDay?: number;
  payFromAccountId?: number;
  rateType?: RateType;
  note?: string;
}

export interface AmortisationEntryResponse {
  period: number;
  dueDate: string;
  principalComponent: Money;
  interestComponent: Money;
  closingBalance: Money;
  paid: boolean;
}
