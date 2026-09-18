import { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { Select } from '@/components/Select';
import { groupCategories, CATEGORY_GROUP_LABELS } from '@/lib/categoryGroups';
import { useCreateCategoryMutation } from '@/services/categoryService';
import type { CategoryResponse, CategoryGroup } from '@/types/category';

/** The groups offered when creating a category from a spending context - never
 *  INCOME here, so a category created while picking an expense category can't end up
 *  ineligible for the very list it was created from (`eligibleCategories` in
 *  `transactionForm.ts` would silently drop it otherwise). */
const SPENDING_GROUP_OPTIONS: { value: CategoryGroup; label: string }[] = [
  { value: 'FLEXIBLE', label: 'Flexible - groceries, drinks, transport' },
  { value: 'FIXED', label: 'Fixed - rent, EMIs, subscriptions' },
  { value: 'EVENT', label: 'One-off - a trip, a gift, a festival' },
];

const TOP_LEVEL = '';

/**
 * The category picker, with a way to add a category - or a sub-category - from inside it.
 *
 * <p>The Ledger's own audit found this as a real dead end: every category in the app is
 * seeded, and there had never been a way to add one - so a spend that didn't fit an
 * existing category had nowhere honest to go (DATA_ENTRY_AUDIT.md, `POST /categories`
 * existed and nothing called it). Putting the affordance in the dropdown itself, rather
 * than a separate "manage categories" screen, means the moment you'd actually want a new
 * category - picking one and not finding it - is the moment you can make it.
 *
 * <p>It sits in the panel's footer rather than as a trailing option, because it is an
 * action and not a category: a "+ New category" row inside the list is arrowed onto by
 * Home/End and picked up by the type-to-filter box as though it were one more thing you
 * could spend money on.
 */
export function CategorySelect({
  value,
  onChange,
  categories,
  variant = 'row',
  className,
  income = false,
}: {
  value: number | '';
  onChange: (id: number | null) => void;
  /** Already filtered for eligibility by the caller (`eligibleCategories`) - this
   *  component only presents, it doesn't decide what belongs. */
  categories: CategoryResponse[];
  variant?: 'row' | 'field';
  className?: string;
  /** Whether this picker is showing income categories. Controls what a category
   *  created inline is allowed to be, so it never comes out ineligible for the list
   *  it was created from. */
  income?: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [group, setGroup] = useState<CategoryGroup>(income ? 'INCOME' : 'FLEXIBLE');
  const [parentId, setParentId] = useState<string>(TOP_LEVEL);
  const [createCategory, { isLoading }] = useCreateCategoryMutation();

  /** Only a top-level category can take children (one level deep, backend V12), so a
   *  sub-category never appears as something to nest under. */
  const parentOptions = [
    { value: TOP_LEVEL, label: 'Top level - a category of its own' },
    ...categories
      .filter((c) => c.parentId == null)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((c) => ({ value: String(c.id), label: `Under ${c.name}`, hint: CATEGORY_GROUP_LABELS[c.group] })),
  ];

  const reset = () => {
    setCreating(false);
    setName('');
    setParentId(TOP_LEVEL);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const created = await createCategory({
      name: trimmed,
      // Sent anyway when nesting - the server ignores it and takes the parent's group,
      // which is the rule we'd rather have enforced in one place than mirrored here.
      group,
      ...(parentId === TOP_LEVEL ? {} : { parentId: Number(parentId) }),
    }).unwrap();
    onChange(created.id);
    reset();
  };

  if (creating) {
    return (
      <div className="flex flex-col gap-space-2">
        <div className="flex items-center gap-space-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                save();
              }
              if (e.key === 'Escape') reset();
            }}
            placeholder="New category name"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-label text-ink outline-none placeholder:text-ink-muted"
          />
          <button
            type="button"
            onClick={save}
            disabled={isLoading || !name.trim()}
            aria-label="Save category"
            className="shrink-0 text-positive disabled:opacity-40"
          >
            <Check size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Cancel"
            className="shrink-0 text-ink-muted hover:text-ink-soft"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {income ? (
          <p className="text-caption text-ink-muted">Added under Income.</p>
        ) : (
          <>
            <Select
              variant="row"
              className="-ml-space-1 max-w-full"
              ariaLabel="Where this category sits"
              value={parentId}
              options={parentOptions}
              onChange={setParentId}
            />
            {parentId === TOP_LEVEL ? (
              <Select
                variant="row"
                className="-ml-space-1 max-w-full"
                ariaLabel="What kind of spending is this"
                value={group}
                options={SPENDING_GROUP_OPTIONS}
                onChange={(v) => setGroup(v as CategoryGroup)}
              />
            ) : (
              <p className="text-caption text-ink-muted">
                Groups with its parent, and its spend counts toward it.
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <Select
      variant={variant}
      className={className}
      ariaLabel="Category"
      value={value === '' ? '' : String(value)}
      placeholder="Choose one"
      // Sectioned by group, with sub-categories indented under their parent - see
      // `groupCategories`. A long flat alphabetical list is what this replaces.
      groups={groupCategories(categories)}
      onChange={(v) => onChange(v ? Number(v) : null)}
      footer={
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center gap-space-2 px-space-3 py-space-2 text-left text-label text-accent transition-colors hover:bg-sunken"
        >
          <Plus size={14} strokeWidth={2} aria-hidden />
          New category
        </button>
      }
    />
  );
}
