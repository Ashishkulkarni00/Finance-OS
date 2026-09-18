import type { Money } from '@/lib/money';
import type { AccountSummary, BalanceConfidence } from '@/types/api';

export type InvestmentType =
  | 'MUTUAL_FUND_SIP'
  | 'MUTUAL_FUND_LUMPSUM'
  | 'RECURRING_DEPOSIT'
  | 'FIXED_DEPOSIT'
  | 'EPF'
  | 'PPF'
  | 'NPS'
  | 'STOCKS'
  | 'GOLD'
  | 'OTHER';

/** How much of the register has a current value behind it - the modelled form of the
 *  workbook's own "Partly updated" note beside its total. */
export type ValuationState = 'ALL_UPDATED' | 'PARTLY_UPDATED' | 'NONE_UPDATED';

export interface InvestmentResponse {
  id: number;
  name: string;
  type: InvestmentType;
  typeLabel: string;
  /** Null for a holding tracked outside the ledger - an employer-deducted fund. */
  account: AccountSummary | null;
  /** Where the contribution comes from. Null when nothing of ours pays it. */
  payFromAccount: AccountSummary | null;
  monthlyContribution: Money | null;
  contributionDay: number | null;
  openingInvested: Money | null;
  /** Null without a ledger account - nothing is recorded, so there is no figure. */
  addedSince: Money | null;
  totalInvested: Money | null;
  /** The hand-kept figure. Null = never valued, which is not zero. */
  currentValue: Money | null;
  currentValueAsOf: string | null;
  /** How long ago it was valued. Null when never valued. */
  valuationAgeDays: number | null;
  /** Null until valued - "Not updated" in the workbook's own words. */
  gain: Money | null;
  /** Fraction (0.08 is 8%), never pre-multiplied. Null until valued. */
  gainPercent: number | null;
  confidence: BalanceConfidence;
  liquid: boolean;
  /** True when this has no ledger account, so it sits outside net worth. */
  outsideLedger: boolean;
  note: string | null;
  /** The plan bill that pays this holding's instalment (it follows the holding); null if none. */
  planCommitmentId: number | null;
}

export interface InvestmentSummaryResponse {
  count: number;
  totalInvested: Money;
  /** What has gone into the holdings that have been valued - the only figure
   *  `totalCurrentValue` may honestly be compared against. */
  valuedTotalInvested: Money;
  totalCurrentValue: Money;
  /** Null when nothing has been valued at all. */
  totalGain: Money | null;
  /** Fraction (0.08 is 8%), never pre-multiplied. Null on the same terms. */
  totalGainPercent: number | null;
  outsideLedgerTotal: Money;
  illiquidTotal: Money;
  valuedCount: number;
  valuationState: ValuationState;
  /** Invested in holdings that could be reached if needed. */
  liquidTotal: Money;
  /** Every holding's monthly contribution, added up server-side. "0.00" when none is set. */
  monthlyContributionTotal: Money;
  /** Each holding's slice of what's invested, largest first. */
  allocation: InvestmentAllocation[];
}

export interface InvestmentAllocation {
  investmentId: number;
  name: string;
  totalInvested: Money;
  /** Fraction of the summary's totalInvested (0.94 is 94%), never pre-multiplied. Null
   *  when nothing is invested. */
  share: number | null;
  liquid: boolean;
}

export interface CreateInvestmentRequest {
  name: string;
  type: InvestmentType;
  /** Omit for a holding tracked outside the ledger entirely - an employer-deducted
   *  provident fund has no account money ever moves through. */
  accountId?: number | null;
  payFromAccountId?: number | null;
  monthlyContribution?: Money | null;
  contributionDay?: number | null;
  /** Required when there's no account - otherwise the account's balance is the truth. */
  statedInvested?: Money | null;
  currentValue?: Money | null;
  confidence?: BalanceConfidence | null;
  liquid?: boolean | null;
  note?: string | null;
}

export interface RecordValuationRequest {
  currentValue: Money;
  asOf?: string;
}

export interface UpdateInvestmentRequest {
  name?: string;
  type?: InvestmentType;
  payFromAccountId?: number;
  monthlyContribution?: Money;
  contributionDay?: number;
  statedInvested?: Money;
  confidence?: BalanceConfidence;
  liquid?: boolean;
  note?: string;
}
