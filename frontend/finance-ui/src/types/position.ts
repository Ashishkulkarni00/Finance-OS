import type { Money } from '@/lib/money';

export interface NetWorthResponse {
  netWorth: Money;
  totalAssets: Money;
  totalLiabilities: Money;
  totalDebt: Money;
}

/**
 * What's in the bank and the wallet, and how much is already claimed - the Excel's own
 * closing block on its Accounts sheet. A different question from net worth, which folds
 * in investments and loans and so can't tell you what you can move today. Never goes
 * INCOMPLETE the way `/position` does: not knowing a bill's amount doesn't make the
 * money in an account unknown.
 */
export interface CashPositionResponse {
  heldTotal: Money;
  reservedTotal: Money;
  /** held − reserved. Before commitments, so larger than Real Balance. */
  unreservedTotal: Money;
  /** Owed on credit cards, expressed positive. */
  cardLiability: Money;
  accountCount: number;
}

interface PositionBreakdownAccount {
  accountId: number;
  name: string;
  balance: Money;
}

interface PositionBreakdownCommitment {
  commitmentInstanceId: number;
  name: string;
  outstanding: Money;
  /** False for an optional bill - one that could be skipped this cycle. */
  mandatory: boolean;
}

interface PositionBreakdown {
  held: Money;
  reserved: Money;
  committed: Money;
  /** The optional-bill part of `committed` - what skipping them would free. */
  optionalCommitted: Money;
  /** Owed on credit cards - already spent, paid later from held money. */
  cardDues: Money;
  accounts: PositionBreakdownAccount[];
  commitments: PositionBreakdownCommitment[];
  /** Each card with something owed; `balance` is the amount owed (positive). */
  cards: PositionBreakdownAccount[];
}

interface PositionBlocker {
  commitmentInstanceId: string;
  name: string;
  fix: string;
}

/**
 * Discriminated on `state` - mirrors the backend's flat shape exactly
 * (BACKEND_CONVENTIONS.md §5) so a consuming component can narrow on it and TypeScript
 * makes "render a number that isn't there" a compile error. FRONTEND_CONVENTIONS.md §5.
 */
export type PositionResponse =
  | {
      state: 'OK';
      realBalance: Money;
      roomToday: Money;
      roomLeft: Money;
      spentToday: Money;
      breakdown: PositionBreakdown;
      reason: null;
      blockers: null;
    }
  | {
      state: 'INCOMPLETE';
      realBalance: null;
      roomToday: null;
      roomLeft: null;
      spentToday: null;
      breakdown: null;
      reason: string;
      blockers: PositionBlocker[];
    };
