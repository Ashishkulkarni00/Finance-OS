import { baseApi } from './api/baseApi';
import type {
  CreateTransactionRequest,
  DaySubtotalResponse,
  TransactionResponse,
  TransactionType,
  TransactionViewSummaryResponse,
  UpdateTransactionRequest,
} from '@/types/transaction';
import type { PageResponse } from '@/types/api';

/** The filter set the Ledger's three endpoints all share - see LEDGER_UX_SPEC.md §6.
 *  `cycleId` takes precedence over `dateFrom`/`dateTo` server-side; the two aren't meant
 *  to be combined. */
export interface LedgerQuery {
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  cycleId?: number;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
}

export const transactionService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<PageResponse<TransactionResponse>, ({ accountId?: number } & LedgerQuery & { size?: number }) | void>({
      query: (args) => ({ url: '/transactions', params: { ...args, size: args?.size ?? 50 } }),
      providesTags: [{ type: 'Transaction', id: 'LIST' }],
    }),

    /** The Ledger's stated-view total - same filters as the list, one row. */
    getTransactionViewSummary: build.query<TransactionViewSummaryResponse, LedgerQuery>({
      query: (args) => ({ url: '/transactions/summary', params: args }),
      providesTags: [{ type: 'Transaction', id: 'SUMMARY' }],
    }),

    /** The Ledger's day-group subtotals - same filters, one row per day. */
    getDaySubtotals: build.query<DaySubtotalResponse[], LedgerQuery>({
      query: (args) => ({ url: '/transactions/day-subtotals', params: args }),
      providesTags: [{ type: 'Transaction', id: 'DAY-SUBTOTALS' }],
    }),

    createTransaction: build.mutation<TransactionResponse, CreateTransactionRequest>({
      query: (body) => ({
        url: '/transactions',
        method: 'POST',
        body,
        // A double-tapped Save must not create two - BACKEND_CONVENTIONS.md §12.
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      }),
      // A spend changes the position, the account balance and possibly a commitment
      // (auto-match) - invalidate all of them. Getting this wrong leaves Room Left
      // stale, which is worse than a crash. FRONTEND_CONVENTIONS.md §3.
      invalidatesTags: [
        { type: 'Transaction', id: 'LIST' },
        { type: 'Transaction', id: 'SUMMARY' },
        { type: 'Transaction', id: 'DAY-SUBTOTALS' },
        { type: 'Account', id: 'LIST' },
        'Position',
        'NetWorth',
        'CommitmentInstance',
        'Timeline',
        // A card swipe or bill payment changes what's owed and what's left on the bill.
        'CardTerms',
        'Cycle',
      ],
    }),

    updateTransaction: build.mutation<TransactionResponse, { id: number; body: UpdateTransactionRequest }>({
      query: ({ id, body }) => ({ url: `/transactions/${id}`, method: 'PATCH', body }),
      invalidatesTags: [
        { type: 'Transaction', id: 'LIST' },
        { type: 'Transaction', id: 'SUMMARY' },
        { type: 'Transaction', id: 'DAY-SUBTOTALS' },
        { type: 'Account', id: 'LIST' },
        'Position',
        'NetWorth',
        'CommitmentInstance',
        'Timeline',
        // A card swipe or bill payment changes what's owed and what's left on the bill.
        'CardTerms',
        'Cycle',
      ],
    }),

    deleteTransaction: build.mutation<void, number>({
      query: (id) => ({ url: `/transactions/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Transaction', id: 'LIST' },
        { type: 'Transaction', id: 'SUMMARY' },
        { type: 'Transaction', id: 'DAY-SUBTOTALS' },
        { type: 'Account', id: 'LIST' },
        'Position',
        'NetWorth',
        'CommitmentInstance',
        'Timeline',
        // A card swipe or bill payment changes what's owed and what's left on the bill.
        'CardTerms',
        'Cycle',
      ],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionViewSummaryQuery,
  useGetDaySubtotalsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionService;
