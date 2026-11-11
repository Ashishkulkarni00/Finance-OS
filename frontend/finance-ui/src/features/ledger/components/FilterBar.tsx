import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { AnimatedCollapse } from '@/components/AnimatedCollapse';
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

const CHIP = 'h-7 rounded-full border text-label transition-colors duration-150 pointer-coarse:h-9';

/**
 * Period and search are always in reach; account, category and type sit behind one "Filters"
 * button (UI_UX_REVAMP_PLAN 4.4) - most visits need only a search. The button carries a count when
 * any of the three is set, and the row opens by itself when the page arrives already filtered
 * (a link from Month's day-to-day spending, say), so an active filter is never hidden.
 */
export function FilterBar({ filters, setFilter, accounts, categories }: FilterBarProps) {
  const activeCount = [filters.accountId, filters.categoryId, filters.type].filter((v) => v != null).length;
  const [open, setOpen] = useState(activeCount > 0);
  // A filter set from elsewhere while the row is closed must show itself.
  useEffect(() => {
    if (activeCount > 0) setOpen(true);
  }, [activeCount]);

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
    <div className="flex flex-col gap-space-3">
      <div className="flex flex-wrap items-center gap-space-2">
        <span className={cn('inline-flex overflow-hidden border-border', CHIP)}>
          {(['current', 'all'] as const).map((value) => {
            const active = filters.cycle === value || (value === 'current' && typeof filters.cycle === 'number');
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter({ cycle: value })}
                aria-pressed={active}
                className={cn(
                  'cursor-pointer px-space-3 transition-colors duration-150',
                  active ? 'bg-accent-wash font-medium text-ink' : 'font-normal text-ink-soft hover:bg-sunken',
                )}
              >
                {value === 'current' ? 'This cycle' : 'All time'}
              </button>
            );
          })}
        </span>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            'flex items-center gap-space-1 px-space-3',
            CHIP,
            activeCount > 0 ? 'border-accent bg-accent-wash text-ink' : 'border-border text-ink-soft hover:border-ink-muted',
          )}
        >
          <SlidersHorizontal size={13} strokeWidth={1.5} aria-hidden />
          Filters{activeCount > 0 && <span className="num"> ({activeCount})</span>}
        </button>

        <label
          className={cn(
            // Phone: search is the first thing, full width - the most used control on the page.
            'ml-auto flex items-center gap-space-2 px-space-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25 max-md:order-first max-md:ml-0 max-md:w-full',
            CHIP,
            searchText ? 'border-accent text-ink' : 'border-border text-ink-soft',
          )}
        >
          <Search size={13} strokeWidth={1.5} className="shrink-0" aria-hidden />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search"
            aria-label="Search descriptions"
            className="w-28 bg-transparent text-ink outline-none placeholder:text-ink-muted max-md:min-w-0 max-md:flex-1"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              aria-label="Clear search"
              className="cursor-pointer text-ink-muted transition-colors hover:text-ink-soft"
            >
              <X size={12} strokeWidth={1.75} />
            </button>
          )}
        </label>
      </div>

      <AnimatedCollapse open={open}>
        <div className="flex flex-wrap items-center gap-space-2 pb-space-1">
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
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter({ accountId: undefined, categoryId: undefined, type: undefined })}
              className="px-space-2 text-caption text-accent underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </AnimatedCollapse>
    </div>
  );
}
