import type { Money } from '@/lib/money';

export type ImportRowType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT' | 'REFUND';

export interface ImportRowResponse {
  id: number;
  rowNumber: number;
  date?: string;
  description?: string;
  type?: ImportRowType;
  amount?: Money;
  accountId?: number;
  toAccountId?: number;
  /** Pre-filled from the user's own last entry with the same description, when there is one. */
  categoryId?: number;
  merchant?: string;
  note?: string;
  /** Set when the line couldn't be read (or is left out on purpose, e.g. a card payment). */
  parseError?: string;
  duplicate: boolean;
  duplicateOfTransactionId?: number;
  committedTransactionId?: number;
}

export interface ImportBatchResponse {
  id: number;
  originalFilename?: string;
  status: 'STAGED' | 'COMMITTED';
  totalRows: number;
  duplicateRows: number;
  invalidRows: number;
  uploadedAt: string;
  committedAt?: string;
  rows: ImportRowResponse[];
}

export interface UpdateImportRowRequest {
  type?: ImportRowType;
  categoryId?: number;
  clearCategory?: boolean;
  toAccountId?: number;
  description?: string;
}
