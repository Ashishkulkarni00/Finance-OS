/** INCOME is enforced, not just informational: an INCOME transaction requires a
 *  category from this group, EXPENSE/REFUND forbid one - see CategoryGroup.java. */
export type CategoryGroup = 'FLEXIBLE' | 'FIXED' | 'EVENT' | 'NON_SPEND' | 'INCOME';

export interface CategoryResponse {
  id: number;
  name: string;
  group: CategoryGroup;
  systemDefined: boolean;
  displayOrder: number;
  archived: boolean;
  archivedAt: string | null;
  /** The category this one sits under, or null if top-level. Exactly one level deep -
   *  a sub-category never has children of its own (backend V12). */
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  id: number;
  name: string;
  group: CategoryGroup;
}

export interface CreateCategoryRequest {
  name: string;
  group: CategoryGroup;
  /** Create this as a sub-category. When given, `group` is ignored server-side and the
   *  parent's group is used - a child always groups with its parent. */
  parentId?: number;
  displayOrder?: number;
}

/** Partial update - `undefined` means "leave unchanged". */
export interface UpdateCategoryRequest {
  name?: string;
  group?: CategoryGroup;
  /** Move this category under another. Ignored when `makeTopLevel` is true. */
  parentId?: number;
  /** Promote a sub-category back to top level. A separate flag because `undefined`
   *  already means "leave unchanged" for `parentId`. */
  makeTopLevel?: boolean;
  displayOrder?: number;
}
