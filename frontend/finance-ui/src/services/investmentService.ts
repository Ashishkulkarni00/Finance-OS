import { baseApi } from './api/baseApi';
import type {
  CreateInvestmentRequest,
  InvestmentResponse,
  InvestmentSummaryResponse,
  RecordValuationRequest,
  UpdateInvestmentRequest,
} from '@/types/investment';
import type { PageResponse } from '@/types/api';

export const investmentService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getInvestments: build.query<PageResponse<InvestmentResponse>, void>({
      query: () => ({ url: '/investments', params: { size: 50 } }),
      providesTags: [{ type: 'Investment', id: 'LIST' }],
    }),

    getInvestment: build.query<InvestmentResponse, number>({
      query: (id) => `/investments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Investment', id }],
    }),

    getInvestmentSummary: build.query<InvestmentSummaryResponse, void>({
      query: () => '/investments/summary',
      providesTags: [{ type: 'Investment', id: 'LIST' }],
    }),

    createInvestment: build.mutation<InvestmentResponse, CreateInvestmentRequest>({
      query: (body) => ({ url: '/investments', method: 'POST', body }),
      invalidatesTags: [{ type: 'Investment', id: 'LIST' }, { type: 'Account', id: 'LIST' }, 'NetWorth'],
    }),

    /** The screen's primary action - recording what a holding is worth today. Separate
     *  from the generic update so the valuation always gets dated server-side. */
    recordValuation: build.mutation<InvestmentResponse, { id: number; body: RecordValuationRequest }>({
      query: ({ id, body }) => ({ url: `/investments/${id}/value`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Investment', id },
        { type: 'Investment', id: 'LIST' },
      ],
    }),

    updateInvestment: build.mutation<InvestmentResponse, { id: number; body: UpdateInvestmentRequest }>({
      query: ({ id, body }) => ({ url: `/investments/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Investment', id },
        { type: 'Investment', id: 'LIST' },
        // A bill that pays this holding's instalment follows it.
        'Commitment',
        'CommitmentInstance',
        'Position',
        'Timeline',
      ],
    }),
  }),
});

export const {
  useGetInvestmentsQuery,
  useGetInvestmentQuery,
  useGetInvestmentSummaryQuery,
  useCreateInvestmentMutation,
  useRecordValuationMutation,
  useUpdateInvestmentMutation,
} = investmentService;
