import type { WriteEffect } from '@/types/effect';
import type { Money } from '@/lib/money';
import type { AccountSummary } from '@/types/api';
import type { CategorySummary } from '@/types/category';

export type CommitmentAmountType = 'FIXED' | 'VARIABLE';
export type CommitmentFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
/** Where a bill's figures come from - MANUAL, or the record it follows. */
export type CommitmentSource = 'MANUAL' | 'LOAN' | 'INVESTMENT' | 'GOAL';
/** The kind of Ledger entry that pays a bill. */
export type SettleAs = 'EXPENSE' | 'TRANSFER' | 'INVESTMENT' | 'INCOME';

export interface CreateCommitmentRequest {
  name: string;
  amountType: CommitmentAmountType;
  fixedAmount: Money | null;
  frequency: CommitmentFrequency;
  dueDay: number;
  accountId: number;
  categoryId?: number | null;
  mandatory?: boolean | null;
  requiresVerification?: boolean | null;
  activeFrom: string;
  activeTo?: string | null;
  why?: string | null;
  ifSkipped?: string | null;
  /** How it's paid - EXPENSE when omitted. */
  settleAs?: SettleAs | null;
  /** Where the money goes for a TRANSFER or INVESTMENT bill. */
  toAccountId?: number | null;
  /** What the bill follows - MANUAL when omitted. */
  sourceType?: CommitmentSource | null;
  sourceId?: number | null;
}

/** Partial update - an absent field is left unchanged. Clearing needs the flags. */
export interface UpdateCommitmentRequest {
  name?: string;
  amountType?: CommitmentAmountType;
  fixedAmount?: Money;
  frequency?: CommitmentFrequency;
  dueDay?: number;
  accountId?: number;
  categoryId?: number;
  mandatory?: boolean;
  activeTo?: string;
  /** "" clears. */
  why?: string;
  /** "" clears. */
  ifSkipped?: string;
  clearActiveTo?: boolean;
  clearCategory?: boolean;
  /** Link to a loan: its EMI, day, account and last payment then drive the bill. */
  sourceType?: CommitmentSource;
  sourceId?: number;
  /** Unlink - the bill keeps its current figures. */
  clearSource?: boolean;
  settleAs?: SettleAs;
  toAccountId?: number;
  /** "Apply from" - a cycle start date; earlier months keep the bill as it was (the rule is split). */
  applyFrom?: string;
  /** Why, in the user's own words. Optional and never demanded - recorded on the plan
   *  revision, where it is the part worth reading back a year later. ADR-0015. */
  reason?: string;
}

export interface CommitmentResponse {
  id: number;
  name: string;
  amountType: CommitmentAmountType;
  fixedAmount: Money | null;
  frequency: CommitmentFrequency;
  dueDay: number;
  account: AccountSummary;
  category: CategorySummary | null;
  sourceType: CommitmentSource;
  sourceId: number | null;
  settleAs: SettleAs;
  /** Where the money goes for a TRANSFER or INVESTMENT bill. Left out of the JSON (not null) for any other kind. */
  toAccountId?: number | null;
  mandatory: boolean;
  requiresVerification: boolean;
  activeFrom: string;
  activeTo: string | null;
  why: string | null;
  ifSkipped: string | null;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** What this plan change just did - absent when nothing moved (ADR-0017). */
  effect?: WriteEffect;
}
