import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TransactionType } from '@/types/transaction';
import type { LedgerQuery } from '@/services/transactionService';

/**
 * The Ledger's filter state - lives entirely in the URL, never component state
 * (LEDGER_UX_SPEC.md §1). `?cycle=1&category=2` must fully reconstruct the view: that's
 * what lets a figure elsewhere on the product link straight into a pre-filtered ledger
 * (the "justification loop", LEDGER_EXPERIENCE.md §4), and it's why nothing here is
 * `useState`.
 */
export interface LedgerFilterState {
  /** 'current' (default, no `cycle` param) · 'all' · a specific past cycle's id, for a
   *  deep link from somewhere that already knows which cycle it means. */
  cycle: 'current' | 'all' | number;
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  q?: string;
}

const TRANSACTION_TYPES: readonly TransactionType[] = ['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT', 'REFUND'];

function isTransactionType(value: string): value is TransactionType {
  return (TRANSACTION_TYPES as readonly string[]).includes(value);
}

export function useLedgerFilters(): {
  filters: LedgerFilterState;
  setFilter: (patch: Partial<LedgerFilterState>) => void;
} {
  const [params, setParams] = useSearchParams();

  const filters: LedgerFilterState = useMemo(() => {
    const cycleParam = params.get('cycle');
    const typeParam = params.get('type');
    return {
      cycle: cycleParam === 'all' ? 'all' : cycleParam ? Number(cycleParam) : 'current',
      accountId: params.get('account') ? Number(params.get('account')) : undefined,
      categoryId: params.get('category') ? Number(params.get('category')) : undefined,
      type: typeParam && isTransactionType(typeParam) ? typeParam : undefined,
      q: params.get('q') || undefined,
    };
  }, [params]);

  const setFilter = (patch: Partial<LedgerFilterState>) => {
    // `replace`, not push: filter changes are edits to one view, not new pages to visit -
    // otherwise every keystroke in search would spam the back button. The URL still
    // reflects the current filters at all times, which is what deep-linking needs.
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const set = (key: string, value: string | number | undefined) => {
          if (value === undefined || value === '') next.delete(key);
          else next.set(key, String(value));
        };
        if ('cycle' in patch) set('cycle', patch.cycle === 'current' ? undefined : patch.cycle);
        if ('accountId' in patch) set('account', patch.accountId);
        if ('categoryId' in patch) set('category', patch.categoryId);
        if ('type' in patch) set('type', patch.type);
        if ('q' in patch) set('q', patch.q);
        return next;
      },
      { replace: true },
    );
  };

  return { filters, setFilter };
}

/** Resolves the filter state's `cycle` into the id the backend endpoints take - or
 *  `undefined` for 'all', which asks for no cycle bound at all. */
export function resolveCycleId(cycle: LedgerFilterState['cycle'], currentCycleId: number | undefined): number | undefined {
  if (cycle === 'all') return undefined;
  if (cycle === 'current') return currentCycleId;
  return cycle;
}

/** The shared query object every Ledger endpoint (list, summary, day-subtotals) takes -
 *  built once so the three calls can never drift out of sync with each other. */
export function toLedgerQuery(filters: LedgerFilterState, currentCycleId: number | undefined): LedgerQuery {
  return {
    accountId: filters.accountId,
    categoryId: filters.categoryId,
    type: filters.type,
    cycleId: resolveCycleId(filters.cycle, currentCycleId),
    q: filters.q,
  };
}
