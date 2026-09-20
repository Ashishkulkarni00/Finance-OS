import type { PageAddKind } from '@/store/slices/uiSlice';

/** What the rail's Add button adds on a given page. `accountId` means "a transaction,
 *  with this account already chosen". */
export type AddTarget =
  | { kind: 'transaction'; accountId?: number }
  | { kind: PageAddKind; cycleId?: number };

export const ADD_LABEL: Record<AddTarget['kind'], string> = {
  transaction: 'Add transaction',
  bill: 'Add commitment',
  account: 'Add account',
  card: 'Add credit card',
  loan: 'Add loan',
  holding: 'Add holding',
  goal: 'Add goal',
};

/**
 * Add means "add one of what I'm looking at". A page that lists bills adds a bill; a
 * page for one account or card adds an entry on it. Pages with no list of their own
 * (Today, the Ledger, Month close) add a transaction, the everyday case.
 */
export function addTargetFor(pathname: string, search: string): AddTarget {
  const [, section, id] = pathname.split('/');
  const numericId = id && /^\d+$/.test(id) ? Number(id) : undefined;

  switch (section) {
    case 'month': {
      if (id) return { kind: 'transaction' }; // /month/close
      const cycle = new URLSearchParams(search).get('cycle');
      return { kind: 'bill', cycleId: cycle && /^\d+$/.test(cycle) ? Number(cycle) : undefined };
    }
    case 'commitments':
    case 'commitment-rules':
      return { kind: 'bill' };
    case 'accounts':
      return numericId != null ? { kind: 'transaction', accountId: numericId } : { kind: 'account' };
    case 'cards':
      return numericId != null ? { kind: 'transaction', accountId: numericId } : { kind: 'card' };
    case 'debts':
    case 'loans':
      return { kind: 'loan' };
    case 'investments':
      return { kind: 'holding' };
    case 'goals':
    case 'ahead':
      return { kind: 'goal' };
    case 'money':
      // /money/<tab>: add what that tab lists.
      return id === 'cards'
        ? { kind: 'card' }
        : id === 'debts'
          ? { kind: 'loan' }
          : id === 'investments'
            ? { kind: 'holding' }
            : { kind: 'account' };
    default:
      return { kind: 'transaction' };
  }
}
