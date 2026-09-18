import { baseApi } from './api/baseApi';
import type {
  LoanResponse,
  AmortisationEntryResponse,
  LoanSummaryResponse,
  CreateLoanRequest,
  UpdateLoanRequest,
  LoanEstimateRequest,
  LoanEstimateResponse,
} from '@/types/loan';
import type { PageResponse } from '@/types/api';

export const loanService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLoans: build.query<PageResponse<LoanResponse>, void>({
      query: () => ({ url: '/loans', params: { size: 50 } }),
      providesTags: [{ type: 'Loan', id: 'LIST' }],
    }),

    getLoan: build.query<LoanResponse, number>({
      query: (id) => `/loans/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Loan', id }],
    }),

    getLoanSchedule: build.query<AmortisationEntryResponse[], number>({
      query: (id) => `/loans/${id}/schedule`,
      providesTags: (_result, _error, id) => [{ type: 'Loan', id: `${id}-schedule` }],
    }),

    getLoanSummary: build.query<LoanSummaryResponse, void>({
      query: () => '/loans/summary',
      providesTags: [{ type: 'Loan', id: 'LIST' }],
    }),

    /** Pre-fills the loan forms. Saves nothing, so invalidates nothing. */
    estimateLoan: build.mutation<LoanEstimateResponse, LoanEstimateRequest>({
      query: (body) => ({ url: '/loans/estimate', method: 'POST', body }),
    }),

    createLoan: build.mutation<LoanResponse, CreateLoanRequest>({
      query: (body) => ({ url: '/loans', method: 'POST', body }),
      invalidatesTags: [{ type: 'Loan', id: 'LIST' }, { type: 'Account', id: 'LIST' }, 'NetWorth'],
    }),

    updateLoan: build.mutation<LoanResponse, { id: number; body: UpdateLoanRequest }>({
      query: ({ id, body }) => ({ url: `/loans/${id}`, method: 'PATCH', body }),
      // A corrected principal or start date also re-bases the loan's own account; an EMI
      // day or amount moves what's coming up. So accounts, position and timeline refresh
      // too, not only the loan.
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Loan', id },
        { type: 'Loan', id: 'LIST' },
        { type: 'Loan', id: `${id}-schedule` },
        'Account',
        'Position',
        'NetWorth',
        'Timeline',
        // A bill that follows this loan was updated with it.
        'Commitment',
        'CommitmentInstance',
      ],
    }),
  }),
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
  useGetLoanScheduleQuery,
  useGetLoanSummaryQuery,
  useEstimateLoanMutation,
  useCreateLoanMutation,
  useUpdateLoanMutation,
} = loanService;
