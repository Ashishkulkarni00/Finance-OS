import { useState } from 'react';
import { Archive, ArchiveRestore, Trash2, Check, X, Plus, CornerDownRight } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import { CATEGORY_GROUP_LABELS } from '@/lib/categoryGroups';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useArchiveCategoryMutation,
  useUnarchiveCategoryMutation,
  useDeleteCategoryMutation,
} from '@/services/categoryService';
import { useGetTransactionViewSummaryQuery } from '@/services/transactionService';
import { cn } from '@/lib/cn';
import type { CategoryGroup, CategoryResponse } from '@/types/category';

const GROUP_OPTIONS: { value: CategoryGroup; label: string }[] = (
  ['INCOME', 'FIXED', 'FLEXIBLE', 'EVENT'] as const
).map((g) => ({ value: g, label: CATEGORY_GROUP_LABELS[g] }));

const TOP_LEVEL = '__top__';

/**
 * One row - rename inline, regroup or re-parent, archive/unarchive, or delete.
 *
 * <p>One query per row for its usage count (`GET /transactions/summary?categoryId=X`,
 * already built for the Ledger's own stated view) - the same "one query per dynamic
 * item" pattern `ShortfallRow`/`CardRow` already use, rather than one call fetching a
 * count per category up front.
 *
 * <p>Delete is soft (ADR-0004) and technically never orphans a transaction - lookups
 * for display already go through `getByIdIncludingDeleted`. But a category still in use
 * is steered toward Archive instead: deleting something 18 rows still point to reads as
 * more final than it is, and Archive says the same thing - "not offered for new entries
 * any more" - without the word "delete" attached to real history
 * (LEDGER_IMPROVEMENT_PLAN §2, Option A/B combined).
 */
function CategoryManageRow({
  category,
  parents,
  childCount,
  onAddChild,
}: {
  category: CategoryResponse;
  /** Top-level categories in the same group, excluding this one - what it may move under. */
  parents: CategoryResponse[];
  childCount: number;
  onAddChild: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(category.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { data: usage } = useGetTransactionViewSummaryQuery({ categoryId: category.id, cycleId: undefined });
  const [updateCategory] = useUpdateCategoryMutation();
  const [archiveCategory, { isLoading: archiving }] = useArchiveCategoryMutation();
  const [unarchiveCategory, { isLoading: unarchiving }] = useUnarchiveCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();

  const inUse = (usage?.entryCount ?? 0) > 0;
  const isIncome = category.group === 'INCOME';
  const isChild = category.parentId != null;

  const saveName = () => {
    const trimmed = name.trim();
    setEditingName(false);
    if (!trimmed || trimmed === category.name) {
      setName(category.name);
      return;
    }
    updateCategory({ id: category.id, body: { name: trimmed } });
  };

  // A category with children can't itself be nested (one level deep), so it is offered
  // the group picker instead - the same control the shape of the row already implies.
  const canNest = childCount === 0 && !isIncome;

  return (
    <div
      className={cn(
        'flex items-center gap-space-3 border-b border-line py-space-3 last:border-b-0',
        category.archived && 'opacity-50',
        isChild && 'ml-space-5 border-l border-line pl-space-3',
      )}
    >
      <div className="min-w-0 flex-1">
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                saveName();
              }
              if (e.key === 'Escape') {
                setName(category.name);
                setEditingName(false);
              }
            }}
            autoComplete="off"
            className="w-full bg-transparent text-label text-ink outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            disabled={category.archived}
            className="truncate text-left text-label text-ink hover:underline disabled:no-underline"
          >
            {category.name}
          </button>
        )}
        <p className="text-caption text-ink-muted">
          {usage ? `${usage.entryCount} ${usage.entryCount === 1 ? 'entry' : 'entries'}` : '…'}
          {childCount > 0 && ` · ${childCount} sub`}
          {category.archived && ' · archived'}
        </p>
      </div>

      <div className="w-44 shrink-0">
        {canNest ? (
          <Select
            variant="row"
            className="-ml-space-1 max-w-full"
            ariaLabel={`Where ${category.name} sits`}
            value={category.parentId == null ? TOP_LEVEL : String(category.parentId)}
            options={[
              { value: TOP_LEVEL, label: CATEGORY_GROUP_LABELS[category.group], hint: 'top level' },
              ...parents.map((p) => ({ value: String(p.id), label: `Under ${p.name}` })),
            ]}
            onChange={(v) =>
              updateCategory({
                id: category.id,
                body: v === TOP_LEVEL ? { makeTopLevel: true } : { parentId: Number(v) },
              })
            }
          />
        ) : (
          <Select
            variant="row"
            className="-ml-space-1 max-w-full"
            ariaLabel={`Group for ${category.name}`}
            // Income never regroups here - it's enforced server-side, and reassigning an
            // income category into a spending group would silently break every past
            // salary/income row's category direction.
            value={category.group}
            options={isIncome ? [{ value: 'INCOME', label: 'Income' }] : GROUP_OPTIONS.filter((g) => g.value !== 'INCOME')}
            onChange={(v) => updateCategory({ id: category.id, body: { group: v as CategoryGroup } })}
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-space-1">
        {!isChild && !isIncome && !category.archived && (
          <button
            type="button"
            onClick={onAddChild}
            title={`Add a sub-category under ${category.name}`}
            className="rounded-md p-space-2 text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <CornerDownRight size={15} strokeWidth={1.5} />
          </button>
        )}

        {category.archived ? (
          <button
            type="button"
            onClick={() => unarchiveCategory(category.id)}
            disabled={unarchiving}
            title="Unarchive - show this category again when adding entries"
            className="rounded-md p-space-2 text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <ArchiveRestore size={15} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => archiveCategory(category.id)}
            disabled={archiving}
            title={
              childCount > 0
                ? `Archive - also archives the ${childCount} sub-categor${childCount === 1 ? 'y' : 'ies'} under it`
                : 'Archive - stop offering this category for new entries, keep it on past ones'
            }
            className="rounded-md p-space-2 text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <Archive size={15} strokeWidth={1.5} />
          </button>
        )}

        {confirmingDelete ? (
          <span className="flex items-center gap-space-1">
            <button
              type="button"
              onClick={() => deleteCategory(category.id)}
              disabled={deleting}
              title="Confirm delete"
              className="rounded-md p-space-2 text-critical transition-colors hover:bg-critical/10"
            >
              <Check size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              title="Cancel"
              className="rounded-md p-space-2 text-ink-muted transition-colors hover:bg-sunken"
            >
              <X size={15} strokeWidth={2} />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={inUse || childCount > 0}
            title={
              childCount > 0
                ? 'Has sub-categories - move or delete those first'
                : inUse
                  ? `Used by ${usage?.entryCount} ${usage?.entryCount === 1 ? 'entry' : 'entries'} - archive it instead`
                  : 'Delete for good'
            }
            className="rounded-md p-space-2 text-ink-muted transition-colors hover:bg-critical/10 hover:text-critical disabled:pointer-events-none disabled:opacity-30"
          >
            <Trash2 size={15} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

/** The inline "new category" row - used both for a top-level add and for a
 *  sub-category under a named parent, which is the only difference between the two. */
function NewCategoryRow({
  group,
  parent,
  onDone,
}: {
  group: CategoryGroup;
  parent: CategoryResponse | null;
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [createCategory, { isLoading }] = useCreateCategoryMutation();

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return onDone();
    await createCategory({ name: trimmed, group, ...(parent ? { parentId: parent.id } : {}) }).unwrap();
    onDone();
  };

  return (
    <div className={cn('flex items-center gap-space-3 border-b border-line py-space-3', parent && 'ml-space-5 border-l border-line pl-space-3')}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            save();
          }
          if (e.key === 'Escape') onDone();
        }}
        placeholder={parent ? `New sub-category under ${parent.name}` : 'New category name'}
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
      <button type="button" onClick={onDone} aria-label="Cancel" className="shrink-0 text-ink-muted hover:text-ink-soft">
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

interface ManageCategoriesSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Manage categories" - the missing half of the category picker's "+ New category":
 * a way to fix a name, move something into the right group or under another category,
 * or retire one that's no longer used, none of which existed anywhere in the product
 * before this (LEDGER_IMPROVEMENT_PLAN §2 P9). Reads and writes the same `categories`
 * endpoints the pickers already use, so a rename here is visible on every form
 * immediately.
 *
 * <p>Laid out as the tree it now is: group heading, top-level categories, and each one's
 * sub-categories indented beneath it - the same shape the picker shows, so the screen
 * you manage them on and the dropdown you pick them from are recognisably the same list.
 */
export function ManageCategoriesSheet({ open, onClose }: ManageCategoriesSheetProps) {
  const { data } = useGetCategoriesQuery({ includeArchived: true });
  /** Which parent an inline "new" row is open under: a category id, a group name for a
   *  top-level add, or null for none. */
  const [adding, setAdding] = useState<{ group: CategoryGroup; parentId: number | null } | null>(null);

  const all = data?.content ?? [];
  const byId = new Map(all.map((c) => [c.id, c]));
  const childrenOf = new Map<number, CategoryResponse[]>();
  for (const c of all) {
    if (c.parentId != null && byId.has(c.parentId)) {
      childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) ?? []), c]);
    }
  }

  const order = (a: CategoryResponse, b: CategoryResponse) =>
    Number(a.archived) - Number(b.archived) || a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);

  const grouped = (['INCOME', 'FIXED', 'FLEXIBLE', 'EVENT', 'NON_SPEND'] as const)
    .map((group) => ({
      group,
      tops: all.filter((c) => c.group === group && (c.parentId == null || !byId.has(c.parentId))).sort(order),
    }))
    .filter((g) => g.tops.length > 0 || adding?.group === g.group);

  return (
    <Modal open={open} onClose={onClose} title="Manage categories">
      <div className="flex flex-col gap-space-6">
        <p className="text-caption text-ink-soft">
          Click a name to rename it. A sub-category always groups with its parent, and its spend counts toward it -
          so “Transport” stays one comparable line even when you record fuel and cabs separately. Archiving a parent
          archives everything under it; categories already used by a transaction can be archived but not deleted, so
          your past entries keep their category.
        </p>

        {grouped.map(({ group, tops }) => (
          <div key={group}>
            <div className="mb-space-2 flex items-baseline justify-between gap-space-4">
              <p className="text-micro font-medium uppercase tracking-[0.08em] text-ink-muted">
                {CATEGORY_GROUP_LABELS[group]}
              </p>
              {group !== 'NON_SPEND' && (
                <button
                  type="button"
                  onClick={() => setAdding({ group, parentId: null })}
                  className="flex items-center gap-space-1 text-caption text-ink-muted transition-colors hover:text-accent"
                >
                  <Plus size={12} strokeWidth={2} aria-hidden />
                  Add
                </button>
              )}
            </div>

            <div className="flex flex-col">
              {tops.map((parent) => {
                const children = (childrenOf.get(parent.id) ?? []).sort(order);
                const siblings = all.filter(
                  (c) => c.group === group && c.parentId == null && c.id !== parent.id && !c.archived,
                );
                return (
                  <div key={parent.id} className="flex flex-col">
                    <CategoryManageRow
                      category={parent}
                      parents={siblings}
                      childCount={children.length}
                      onAddChild={() => setAdding({ group, parentId: parent.id })}
                    />
                    {children.map((child) => (
                      <CategoryManageRow
                        key={child.id}
                        category={child}
                        parents={siblings.concat(parent)}
                        childCount={0}
                        onAddChild={() => {}}
                      />
                    ))}
                    {adding?.parentId === parent.id && (
                      <NewCategoryRow group={group} parent={parent} onDone={() => setAdding(null)} />
                    )}
                  </div>
                );
              })}

              {adding?.group === group && adding.parentId === null && (
                <NewCategoryRow group={group} parent={null} onDone={() => setAdding(null)} />
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
