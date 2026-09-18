import type { CategoryGroup, CategoryResponse } from '@/types/category';
import type { SelectGroup, SelectOption } from '@/components/Select';

/** Plain-language section headers for the category picker and the manage-categories
 *  list - never the raw enum constant in front of a user. */
export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  INCOME: 'Income',
  FIXED: 'Fixed & recurring',
  FLEXIBLE: 'Flexible spending',
  EVENT: 'One-off',
  NON_SPEND: 'Other',
};

/** The order groups appear in a picker - income first when it's present (an income
 *  picker only ever has one group anyway), then roughly most- to least-recurring. */
const GROUP_ORDER: CategoryGroup[] = ['INCOME', 'FIXED', 'FLEXIBLE', 'EVENT', 'NON_SPEND'];

const byOrder = (a: CategoryResponse, b: CategoryResponse) =>
  a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);

/**
 * Sections a flat category list into what a dropdown shows: group heading, then each
 * top-level category, then its sub-categories indented beneath it.
 *
 * <p>Three tiers on screen, only two of them user-owned. The group heading is a section
 * marker, not something you can pick - it comes from `CategoryGroup`, which the
 * calculations depend on (see the backend's V12). The two pickable tiers are the
 * category and its sub-categories.
 *
 * <p>A sub-category is emitted straight after its parent rather than in a list of its
 * own, so "Transport / Fuel / Cab" reads as one decision narrowing down instead of two
 * unrelated lists. A child whose parent isn't in the same filtered set - the parent was
 * archived, or eligibility rules dropped it - is emitted at top level rather than
 * hidden: it is still a real category the user can choose.
 */
export function groupCategories(categories: CategoryResponse[]): SelectGroup[] {
  const present = new Set(categories.map((c) => c.id));

  return GROUP_ORDER.map((group) => {
    const inGroup = categories.filter((c) => c.group === group);
    const childrenOf = new Map<number, CategoryResponse[]>();
    for (const c of inGroup) {
      if (c.parentId != null && present.has(c.parentId)) {
        const siblings = childrenOf.get(c.parentId) ?? [];
        siblings.push(c);
        childrenOf.set(c.parentId, siblings);
      }
    }

    const options: SelectOption[] = [];
    for (const parent of inGroup
      .filter((c) => c.parentId == null || !present.has(c.parentId))
      .sort(byOrder)) {
      options.push({ value: String(parent.id), label: parent.name, depth: 0 });
      for (const child of (childrenOf.get(parent.id) ?? []).sort(byOrder)) {
        options.push({ value: String(child.id), label: child.name, depth: 1 });
      }
    }

    return { label: CATEGORY_GROUP_LABELS[group], options };
  }).filter((g) => g.options.length > 0);
}

/** "Transport · Fuel" for a sub-category, "Transport" for a top-level one - the label a
 *  ledger row needs, where there is no indentation to carry the relationship. */
export function categoryPath(
  category: { id: number; name: string; parentId?: number | null } | null | undefined,
  all: CategoryResponse[],
): string | undefined {
  if (!category) return undefined;
  const parentId = category.parentId ?? all.find((c) => c.id === category.id)?.parentId;
  if (parentId == null) return category.name;
  const parent = all.find((c) => c.id === parentId);
  return parent ? `${parent.name} · ${category.name}` : category.name;
}
