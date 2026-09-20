import type { Money } from '@/lib/money';

/** Whether saving is keeping up with the target date - GoalPace.java. */
export type GoalPace = 'REACHED' | 'OVERDUE' | 'BEHIND' | 'ON_TRACK' | 'UNKNOWN';

export interface GoalResponse {
  id: number;
  name: string;
  targetAmount: Money;
  targetDate: string;
  priority: number;
  /** Left out of the JSON (not null) when unset - read with `?? null`. */
  linkedReservationId?: number | null;
  linkedAccountId?: number | null;
  /** Saved: what's in the linked account or reservation now. */
  currentAmount: Money;
  /** Already paid out of the goal through its planned payments. */
  spentAmount: Money;
  /** (saved + spent) against the target. */
  progressPercent: number;
  requiredPerMonth: Money | null;
  pace: GoalPace;
  /** 0-100, share of the time from adding the goal to its target date that has gone. */
  timeElapsedPercent: number | null;
  /** The goal's dated amounts, earliest first - empty when no payments are planned. */
  schedule: GoalScheduleLine[];
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GoalScheduleLine.java - a payment planned against the goal, or "The rest" (commitmentId
 *  null): the part of the target no payment is planned for, due on the goal's date. */
export interface GoalScheduleLine {
  commitmentId: number | null;
  name: string;
  date: string;
  /** Null when it changes each time and has no figure yet. */
  amount?: Money | null;
  paid: Money;
  stillNeeded?: Money | null;
  /** Every unpaid amount up to and including this one. */
  neededByThen?: Money | null;
  /** How much of neededByThen isn't saved yet. */
  shortBy?: Money | null;
  status: 'PAID' | 'COVERED' | 'SHORT' | 'AMOUNT_UNKNOWN';
}

export interface UpdateGoalRequest {
  name?: string;
  targetAmount?: Money;
  targetDate?: string;
  linkedAccountId?: number;
}

export interface CreateGoalRequest {
  name: string;
  targetAmount: Money;
  targetDate: string;
  priority?: number | null;
  linkedReservationId?: number | null;
  linkedAccountId?: number | null;
}
