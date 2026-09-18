import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Select } from '@/components/Select';
import { groupCategories } from '@/lib/categoryGroups';
import { cn } from '@/lib/cn';
import type { LedgerFilterState } from '../useLedgerFilters';
import type { TransactionType } from '@/types/transaction';
import type { AccountResponse } from '@/types/api';
import type { CategoryResponse } from '@/types/category';

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'Expenses' },
  { value: 'INCOME', label: 'Income' },
  { value: 'TRANSFER', label: 'Transfers' },
  { value: 'INVESTMENT', label: 'Investments' },
  { value: 'REFUND', label: 'Refunds' },
];

interface FilterBarProps {
  filters: LedgerFilterState;
  setFilter: (patch: Partial<LedgerFilterState>) => void;
  accounts: AccountResponse[];
  categories: CategoryResponse[];
}

/**
 * Zone 2 - filters, plus search. Cycle · Account · Category · Type, left to right,
 * matching LEDGER_UX_SPEC.md §2. Every change writes straight to the URL via
 * `setFilter`, which is the only state that exists for this screen.
 *
 * <p>Everything in this row is 32px tall and pill-shaped, including the search field and
 * the cycle toggle - one visual language across the whole bar. The toggle used to fill
 * its active half with solid accent, which is the product's <em>primary action</em>
 * colour (the Add button, and nothing else); next to outline pills it read as the loudest
 * thing on a page it isn't the subject of. It now uses the same accent-wash treatment
 * every other "this one is selected" state in the product uses.
 */
export function FilterBar({ filters, setFilter, accounts, categories }: FilterBarProps) {
  // Search is the one filter that needs to feel responsive to typing without rewriting
  // the URL on every keystroke - local state, debounced into the URL.
  const [searchText, setSearchText] = useState(filters.q ?? '');
  useEffect(() => setSearchText(filters.q ?? ''), [filters.q]);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchText !== (filters.q ?? '')) setFilter({ q: searchText || undefined });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  return (
    <div className="flex flex-wrap items-center gap-space-2">
      <span className="inline-flex h-8 overflow-hidden rounded-full border border-border text-label">
        {(['current', 'all'] as const).map((value) => {
          const active = filters.cycle === value || (value === 'current' && typeof filters.cycle === 'number');
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter({ cycle: value })}
              className={cn(
                'cursor-pointer px-space-3 transition-colors duration-150',
                active ? 'bg-accent-wash font-medium text-accent' : 'text-ink-soft hover:bg-sunken',
              )}
            >
              {value === 'current' ? 'This cycle' : 'All time'}
            </button>
          );
        })}
      </span>

      <Select
        variant="chip"
        ariaLabel="Filter by account"
        value={filters.accountId ? String(filters.accountId) : ''}
        active={filters.accountId != null}
        placeholder="All accounts"
        widthClass="max-w-[11rem]"
        options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
        onChange={(v) => setFilter({ accountId: v ? Number(v) : undefined })}
      />

      <Select
        variant="chip"
        ariaLabel="Filter by category"
        value={filters.categoryId ? String(filters.categoryId) : ''}
        active={filters.categoryId != null}
        placeholder="All categories"
        widthClass="max-w-[11rem]"
        // The same grouped, indented list the Add form shows - a filter that listed the
        // categories flat, in a different order, was a second way of presenting one list.
        groups={groupCategories(categories)}
        onChange={(v) => setFilter({ categoryId: v ? Number(v) : undefined })}
      />

      <Select
        variant="chip"
        ariaLabel="Filter by type"
        value={filters.type ?? ''}
        active={filters.type != null}
        placeholder="All types"
        widthClass="max-w-[11rem]"
        options={TYPE_OPTIONS}
        onChange={(v) => setFilter({ type: (v || undefined) as TransactionType | undefined })}
      />

      <label
        className={cn(
          'ml-auto flex h-8 items-center gap-space-2 rounded-full border px-space-3 text-label transition-colors duration-150',
          searchText ? 'border-accent text-accent' : 'border-border text-ink-soft',
        )}
      >
        <Search size={13} strokeWidth={1.5} className="shrink-0" aria-hidden />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search"
          aria-label="Search descriptions"
          className="w-28 bg-transparent text-ink outline-none placeholder:text-ink-muted"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => setSearchText('')}
            aria-label="Clear search"
            className="cursor-pointer text-ink-muted transition-colors hover:text-ink-soft"
          >
            <X size={12} strokeWidth={2} />
          </button>
        )}
      </label>
    </div>
  );
}
