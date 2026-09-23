import type { Money } from '@/lib/money';

/** What kind of plan line a revision is about. */
export type PlanSubjectType = 'COMMITMENT' | 'GOAL';

/**
 * What kind of change was made.
 *
 * `AMENDED` changed the line everywhere, including months already past. `SUPERSEDED`
 * ended the old rule and started a new one from a date, so history keeps the figures
 * that were true at the time - what "Changes start" on the edit sheet does.
 * `SYNCED` means the bill followed its loan or holding: a real change, but decided at
 * the source, not here.
 */
export type PlanRevisionType =
  | 'CREATED'
  | 'AMENDED'
  | 'SUPERSEDED'
  | 'PAUSED'
  | 'RESUMED'
  | 'ENDED'
  | 'SYNCED';

/** How to read `oldValue`/`newValue` - the server stores every value as a string. */
export type PlanValueKind = 'MONEY' | 'DATE' | 'NUMBER' | 'TEXT' | 'FLAG';

/** One field that moved. Null means absent, not blank or zero. */
export interface PlanFieldChange {
  field: string;
  /** Plain language, written by the server - "Amount", "Last payment". Shown as-is. */
  label: string;
  valueKind: PlanValueKind;
  oldValue: string | null;
  newValue: string | null;
}

export interface PlanRevisionResponse {
  id: number;
  subjectType: PlanSubjectType;
  subjectId: number;
  /** Frozen at the time of the change, so the log still reads after a rename or delete. */
  subjectName: string;
  revisionType: PlanRevisionType;
  /** False only for `SYNCED` - it followed a loan or holding rather than being decided. */
  userDecision: boolean;
  /** On `SUPERSEDED`, the rule this one replaced. */
  supersededSubjectId: number | null;
  decidedAt: string;
  effectiveFrom: string;
  cycleId: number | null;
  /** The user's own words. Null when they gave none - never invented. */
  reason: string | null;
  /**
   * What this costs per month: positive means more money is needed each month.
   * **Null means unknown** (a bill whose amount varies), never zero - render an em dash.
   */
  monthlyEffect: Money | null;
  changes: PlanFieldChange[];
}

/** What changed about the plan during one cycle. */
export interface CyclePlanChangesResponse {
  cycleId: number;
  /** Oldest first - it reads as a story. */
  revisions: PlanRevisionResponse[];
  /** How many the user decided themselves. */
  decisions: number;
  /** How many followed a loan or holding. */
  followedSources: number;
  /**
   * What the cycle's changes did to the monthly cash requirement. **Null whenever any one
   * effect is unknown** - a total with the unknowns dropped would read as a fact.
   * `effectComplete` says which case you are in.
   */
  netMonthlyEffect: Money | null;
  effectComplete: boolean;
}
