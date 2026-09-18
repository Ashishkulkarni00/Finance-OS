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
] as const;

export type TagType = (typeof TAG_TYPES)[number];
