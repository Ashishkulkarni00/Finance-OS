/** Every cache tag RTK Query invalidates against. One flat list, feature-agnostic. */
export const TAG_TYPES = [
  'Account',
  'Category',
  'Transaction',
  'Reservation',
  'Cycle',
  'Commitment',
  'CommitmentInstance',
  'Position',
  'NetWorth',
  'CardTerms',
  'CardStatement',
  'DebitCard',
  'Loan',
  'Investment',
  'Projection',
  'Timeline',
  'Goal',
  'Import',
  'User',
  'Insurance',
  /** The plan's change log - invalidated by every commitment and goal mutation. ADR-0015. */
  'PlanRevision',
  /** What needs the user. Its own tag because dismissing one changes the list without moving
   *  a single figure — no money tag would notice (ROADMAP 3.2). */
  'Insight',
] as const;

export type TagType = (typeof TAG_TYPES)[number];
