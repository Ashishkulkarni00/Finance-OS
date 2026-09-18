import type { Money } from '@/lib/money';

/** Whether saving is keeping up with the target date - GoalPace.java. */
export type GoalPace = 'REACHED' | 'OVERDUE' | 'BEHIND' | 'ON_TRACK' | 'UNKNOWN';

export interface GoalResponse {
  id: number;
  name: string;
  targetAmount: Money;
  targetDate: string;
  priority: number;
  linkedReservationId: number | null;
  linkedAccountId: number | null;
  currentAmount: Money;
  progressPercent: number;
  requiredPerMonth: Money | null;
  pace: GoalPace;
  /** 0-100, share of the time from adding the goal to its target date that has gone. */
  timeElapsedPercent: number | null;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  name: string;
  targetAmount: Money;
  targetDate: string;
  priority?: number | null;
  linkedReservationId?: number | null;
  linkedAccountId?: number | null;
}
