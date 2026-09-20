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
