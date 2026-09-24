import type { Money } from '@/lib/money';
import type { PositionResponse } from '@/types/position';

/**
 * The whole position in one object (ROADMAP 2.1, `FINANCIAL_STATE.md`).
 *
 * Composed server-side from the calculators that own each part, so nothing here may be
 * recomputed in the browser — comparing and formatting only (FRONTEND_CONVENTIONS §4 rule 2).
 *
 * **Null means unknown, never zero**, throughout.
 */
export interface FinancialStateResponse {
  asOf: string;
  cycle: { id: number; startDate: string; endDate: string; label: string };
  daysToSalary: number;
  /** False when a mandatory bill still has no amount; dependent figures are null, not guessed. */
  complete: boolean;

  position: PositionResponse;
  shape: CycleShapeSlice;
  netWorth: NetWorthSlice;

  runway: RunwaySlice;
  baseline: BaselineSlice;
  debt: DebtSlice;

  attentionCount: number;
}

interface CycleShapeSlice {
  state: 'COMPLETE' | 'INCOMPLETE';
  expectedIn: Money;
  incomeStillExpected: Money;
  committed: Money;
  plannedSavings: Money;
  flexible: Money | null;
  unknownAmountCount: number;
  spent: Money;
}

interface NetWorthSlice {
  netWorth: Money;
  totalAssets: Money;
  totalLiabilities: Money;
}

/**
 * Why a figure is what it is (ROADMAP 2.3).
 *
 * `excluded` lines are inputs the figure could **not** use — a bill with no amount, a
 * holding that is locked away. They are shown, not hidden: they are usually the reason the
 * figure is a ceiling rather than a fact.
 */
export interface Provenance {
  /** The rule in plain words, never algebra. */
  formula: string;
  /** The inputs grouped as the formula reads, each with its own server-computed subtotal. */
  sections: ProvenanceSection[];
  caveats: string[];
}

export interface ProvenanceSection {
  heading: string | null;
  /** The calculator's own figure for this side. Never re-added in the browser. */
  total?: Money;
  lines: ProvenanceLine[];
}

export interface ProvenanceLine {
  label: string;
  /** Absent when the input has no known amount — which is when `excluded` matters. */
  amount?: Money;
  ref?: { kind: 'ACCOUNT' | 'COMMITMENT' | 'LOAN' | 'GOAL' | 'INVESTMENT'; id: number };
  excluded: boolean;
}

/**
 * How long reachable money would cover mandatory obligations if income stopped.
 *
 * Not Real Balance and not comparable to it: this counts the emergency fund, which Real
 * Balance deliberately excludes, and it counts obligations only — day-to-day spending is on
 * top of it.
 */
export interface RunwaySlice {
  /** Null when nothing can be said. Never 0, which would read as "no runway". */
  months: number | null;
  /** True when unpriced bills were left out — say **"at most"**, never a bare figure. */
  upperBound: boolean;
  liquidTotal: Money | null;
  monthlyEssentials: Money | null;
  unknownBillCount: number;
  unknownReason?: string;
  /** Always true today: the UI must not imply living costs are covered. */
  coversEssentialsOnly: boolean;
  basis?: Provenance;
}

/** The user's own usual day-to-day spend. `perCycle` is null until two cycles have ended. */
export interface BaselineSlice {
  perCycle: Money | null;
  cyclesObserved: number;
  observedFrom?: string;
  observedTo?: string;
  lowest?: Money;
  highest?: Money;
}

export interface DebtSlice {
  totalOutstanding: Money;
  bankEmiMonthly: Money;
  cardEmiMonthly: Money;
  /** An **obligation** measure, never cash flow: a card EMI arrives inside the card bill. */
  emiMonthlyTotal: Money;
  /** A fraction — 0.3673 is 36.73%. Null when income isn't known. */
  emiShareOfIncome: number | null;
  weightedAverageRate: number | null;
  debtFreeDate: string | null;
  loanCount: number;
  loansWithoutTerms: number;
  basis?: Provenance;
}
