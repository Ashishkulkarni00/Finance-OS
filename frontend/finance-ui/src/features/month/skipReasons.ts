import type { SkipReason } from '@/types/commitment';

/** How each skip reason reads - on the chip that picks it and on the Done row that shows it. */
export const SKIP_REASON_LABEL: Record<SkipReason, string> = {
  MONEY_NEEDED_ELSEWHERE: 'Money needed elsewhere',
  NOT_NEEDED: 'Not needed this month',
  PAID_ANOTHER_WAY: 'Paid another way',
  POSTPONED: 'Moved to a later month',
  OTHER: 'Something else',
};

export const SKIP_REASONS = Object.keys(SKIP_REASON_LABEL) as SkipReason[];

/** What a skip can be offered on - the same rule the server enforces. A loan's EMI leaves on the
 *  lender's schedule whatever is marked here, and anything paid or linked has already moved money. */
export function canSkip(i: {
  sourceType: string;
  status: string;
  confirmedAmount: string | null;
  linkedTransactionId?: number | null;
}): boolean {
  return (
    i.sourceType !== 'LOAN' &&
    (i.status === 'PENDING' || i.status === 'OVERDUE') &&
    i.confirmedAmount == null &&
    (i.linkedTransactionId ?? null) == null
  );
}
