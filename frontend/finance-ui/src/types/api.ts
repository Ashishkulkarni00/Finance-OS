/**
 * Hand-written types mirroring the backend's DTOs exactly.
 *
 * FRONTEND_CONVENTIONS.md §3 says these should come from `openapi-typescript` against
 * a generated spec - that pipeline is blocked (ADR-0013: springdoc-openapi has no
 * verified Spring Framework 7 build yet). Until it lands, these are hand-written and
 * must be kept in sync with the Java DTOs by hand, the same discipline
 * BACKEND_CONVENTIONS.md §3 already applies to its own mappers ("generated mappers
 * hide exactly the kind of silent field-drop that would corrupt a balance").
 */
import type { Money } from '@/lib/money';

export type AccountType = 'BANK' | 'CASH' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT' | 'SYSTEM';
export type BalanceConfidence = 'CONFIRMED' | 'ESTIMATED' | 'UNKNOWN';

/** The workings behind an account's `available` figure. */
export interface AccountHold {
  /** Total of the reservations against this account. */
  reserved: Money;
  /** The minimum balance, but only when it's mandatory - an aspirational one locks nothing. */
  minimumHold: Money;
  /** What's actually subtracted: max(reserved, minimumHold), never the sum. */
  locked: Money;
  /** The reservations' own labels ("Emergency fund") - names the money, doesn't just deduct it. */
  reservedFor: string[];
}

export interface AccountResponse {
  id: number;
  name: string;
  type: AccountType;
  typeLabel: string;
  institution: string | null;
  lastFour: string | null;
  currency: string;
  openingBalance: Money;
  openingAsOf: string;
  openingConfidence: BalanceConfidence;
  currentBalance: Money;
  balanceAsOf: string;
  /** balance − reserved − mandatory minimum (never both subtracted - see AccountAvailableCalculator.java). */
  available: Money;
  /** Why available is lower than the balance, itemised - so the gap can be explained
   *  rather than merely asserted. */
  hold: AccountHold;
  minimumBalance: Money | null;
  minimumBalanceMandatory: boolean;
  belowMinimumBalance: boolean;
  includeInSpendable: boolean;
  includeInNetWorth: boolean;
  countsAsSpendable: boolean;
  asset: boolean;
  liability: boolean;
  purpose: string | null;
  displayOrder: number;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  institution?: string | null;
  lastFour?: string | null;
  currency?: string | null;
  openingBalance: Money;
  openingAsOf: string;
  openingConfidence?: BalanceConfidence | null;
  minimumBalance?: Money | null;
  minimumBalanceMandatory?: boolean | null;
  includeInSpendable?: boolean | null;
  includeInNetWorth?: boolean | null;
  purpose?: string | null;
  displayOrder?: number | null;
}

export type UpdateAccountRequest = Partial<Omit<CreateAccountRequest, 'type' | 'openingBalance' | 'openingAsOf'>> & {
  openingBalance?: Money | null;
  openingAsOf?: string | null;
};

export interface AccountSummary {
  id: number;
  name: string;
  type: AccountType;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
