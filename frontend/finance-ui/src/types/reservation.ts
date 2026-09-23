import type { WriteEffect } from '@/types/effect';
import type { Money } from '@/lib/money';
import type { AccountSummary } from '@/types/api';

export interface ReservationResponse {
  id: number;
  account: AccountSummary;
  amount: Money;
  purpose: string;
  goalId: number | null;
  createdAt: string;
  updatedAt: string;
  /** What this write just did - absent on reads and when nothing moved (ADR-0017). */
  effect?: WriteEffect;
}

export interface CreateReservationRequest {
  accountId: number;
  amount: Money;
  purpose: string;
  goalId?: number | null;
}

export interface UpdateReservationRequest {
  amount?: Money;
  purpose?: string;
  goalId?: number | null;
}
