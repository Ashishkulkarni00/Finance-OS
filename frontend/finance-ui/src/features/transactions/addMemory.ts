import type { TransactionType } from '@/types/transaction';

/**
 * What the Add form remembers between uses (UI_UX_REVAMP_PLAN 4.3): the account last used for
 * each kind of entry, and the categories last used for it. The server has no "recent" endpoint,
 * so this is browser-local convenience only - it can be empty, blocked or stale, and the form
 * must work identically without it. Every access is try/catch'd for that reason.
 *
 * <p>Only ids are stored (never amounts, descriptions or names - ADR-0010). A remembered id is
 * always re-checked against the live account / category list before use, so an archived account
 * or a deleted category simply stops being suggested.
 */
const ACCOUNT_KEY = (t: TransactionType) => `kosh.add.account.${t}`;
const CATEGORY_KEY = (t: TransactionType) => `kosh.add.categories.${t}`;
const MAX_RECENT = 4;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked - the form just forgets */
  }
}

export function lastAccountFor(type: TransactionType): number | null {
  const raw = read(ACCOUNT_KEY(type));
  const id = raw == null ? NaN : Number(raw);
  return Number.isInteger(id) ? id : null;
}

export function rememberAccount(type: TransactionType, accountId: number): void {
  write(ACCOUNT_KEY(type), String(accountId));
}

export function recentCategoriesFor(type: TransactionType): number[] {
  const raw = read(CATEGORY_KEY(type));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n): n is number => Number.isInteger(n)).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

/** Newest first, no duplicates, capped. */
export function rememberCategory(type: TransactionType, categoryId: number): void {
  const next = [categoryId, ...recentCategoriesFor(type).filter((id) => id !== categoryId)].slice(0, MAX_RECENT);
  write(CATEGORY_KEY(type), JSON.stringify(next));
}
