import type { Money } from '@/lib/money';
import type { AccountSummary } from '@/types/api';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX' | 'DINERS' | 'OTHER';
export type StatementStatus = 'PAID' | 'DUE' | 'OVERDUE';

/** The latest recorded statement, and how much of it is still to pay - derived server-side. */
export interface CardLatestStatement {
  id: number;
  statementDate: string;
  dueDate: string;
  totalAmount: Money;
  minimumDue: Money;
  /** Payments and refunds on the card after the statement date. */
  paidSince: Money;
  remaining: Money;
  minimumDueRemaining: Money;
  status: StatementStatus;
}

/** A loan whose EMI is charged to this card. */
export interface CardEmi {
  loanId: number;
  name: string;
  emi: Money;
  nextChargeDate: string;
  lastChargeDate: string;
  emisLeft: number;
}

export interface CreditCardResponse {
  accountId: number;
  name: string;
  institution: string | null;
  lastFour: string | null;
  network: CardNetwork | null;
  /** False for a card account with no limit, statement day or due day yet. */
  setUp: boolean;
  creditLimit: Money | null;
  statementDay: number | null;
  dueDay: number | null;
  payFromAccount: AccountSummary | null;
  /** Owed now, billed and unbilled. Negative means in credit. */
  outstanding: Money;
  availableCredit: Money | null;
  /** Fraction of the limit used (0.42 = 42%). */
  utilisation: number | null;
  /** Spent since the latest statement; null when none is recorded. */
  unbilled: Money | null;
  trackedSince: string;
  nextStatementDate: string | null;
  nextStatementDueDate: string | null;
  latestStatement: CardLatestStatement | null;
  emis: CardEmi[];
  emiMonthlyTotal: Money;
}

export interface CreditCardsOverviewResponse {
  totalOutstanding: Money;
  totalLimit: Money;
  totalAvailable: Money;
  utilisation: number | null;
  billsDueCount: number;
  billsDueTotal: Money;
  emiMonthlyTotal: Money;
  cards: CreditCardResponse[];
}

export interface CreateCreditCardRequest {
  name: string;
  institution?: string | null;
  lastFour?: string | null;
  network?: CardNetwork | null;
  creditLimit: Money;
  statementDay: number;
  dueDay: number;
  payFromAccountId?: number | null;
  outstanding?: Money | null;
  outstandingAsOf?: string | null;
}

/** Partial update. On a card with no terms yet, limit + both days set it up. */
export interface UpdateCreditCardRequest {
  name?: string;
  /** "" clears. */
  institution?: string;
  lastFour?: string;
  network?: CardNetwork;
  creditLimit?: Money;
  statementDay?: number;
  dueDay?: number;
  payFromAccountId?: number;
  clearPayFromAccount?: boolean;
}

export interface CardStatementResponse {
  id: number;
  accountId: number;
  statementDate: string;
  dueDate: string;
  totalAmount: Money;
  minimumDue: Money;
  enteredAt: string;
}

export interface CreateCardStatementRequest {
  statementDate: string;
  dueDate: string;
  totalAmount: Money;
  minimumDue: Money;
}

export interface StatementDraftResponse {
  statementDate: string;
  dueDate: string;
  /** From the card's own entries; null when the card was tracked from a later date. */
  totalFromLedger: Money | null;
  alreadyRecorded: boolean;
}

export interface DebitCardResponse {
  id: number;
  account: AccountSummary;
  name: string;
  network: CardNetwork | null;
  lastFour: string | null;
  createdAt: string;
}

export interface CreateDebitCardRequest {
  accountId: number;
  name: string;
  network?: CardNetwork | null;
  lastFour?: string | null;
}

export interface UpdateDebitCardRequest {
  accountId?: number;
  name?: string;
  network?: CardNetwork;
  lastFour?: string;
  clearNetwork?: boolean;
  clearLastFour?: boolean;
}
