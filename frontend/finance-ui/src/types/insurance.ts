import type { Money } from '@/lib/money';

/** What a policy covers. Typed so a warranty or AMC can join later without a migration. */
export type InsuranceType = 'HEALTH' | 'LIFE' | 'MOTOR' | 'HOME' | 'OTHER';

export type PremiumFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'ONE_OFF';

/**
 * Where a policy stands against its renewal date.
 *
 * `UNKNOWN` rather than `ACTIVE` when no renewal date was given: a lapsed policy is the one
 * case where the money looks fine and the exposure is total, so cover is never implied.
 */
export type CoverStatus = 'LAPSED' | 'RENEWS_SOON' | 'ACTIVE' | 'UNKNOWN';

export interface InsurancePolicyResponse {
  id: number;
  type: InsuranceType;
  typeLabel: string;
  name: string;
  insurer: string | null;
  policyLastFour: string | null;

  /**
   * What you'd be covered for. **Not an asset** — never in net worth, never spendable
   * (ADR-0016). Null when it was never recorded, which is common and fine.
   */
  coverAmount: Money | null;

  /** Null when the user pays nothing — an employer policy still has cover worth recording. */
  premium: Money | null;
  premiumFrequency: PremiumFrequency | null;

  /** The premium spread over the months it covers. Null when unknown, never zero. */
  monthlyCost: Money | null;

  renewsOn: string | null;
  startedOn: string | null;
  status: CoverStatus;
  /** Negative once lapsed. Null without a renewal date. */
  daysToRenewal: number | null;

  covers: string | null;
  note: string | null;
  /** The loan that financed this premium, when it was put on a card in instalments. */
  loanId: number | null;
  /** The bill that pays this premium, or null if it isn't in the plan. */
  premiumCommitmentId: number | null;

  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceSummaryResponse {
  policies: number;
  /** For reassurance only. Never net worth, and not a pot you could spend. */
  totalCover: Money;
  /** Null when any policy's premium is unknown, rather than a total silently missing one. */
  monthlyPremium: Money | null;
  lapsed: number;
  renewingSoon: number;
  unknownRenewal: number;
}

export interface CreateInsurancePolicyRequest {
  type: InsuranceType;
  name: string;
  insurer?: string | null;
  policyLastFour?: string | null;
  coverAmount?: Money | null;
  premium?: Money | null;
  premiumFrequency?: PremiumFrequency | null;
  renewsOn?: string | null;
  startedOn?: string | null;
  covers?: string | null;
  note?: string | null;
  loanId?: number | null;
}

export interface UpdateInsurancePolicyRequest extends Partial<CreateInsurancePolicyRequest> {
  /** Remove the renewal date — a flag, because null already means "unchanged". */
  clearRenewsOn?: boolean;
  /** Unlink the loan that financed the premium. The loan itself is untouched. */
  clearLoan?: boolean;
}
