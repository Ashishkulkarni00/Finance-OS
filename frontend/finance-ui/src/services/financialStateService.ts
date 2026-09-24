import { baseApi } from './api/baseApi';
import type { FinancialStateResponse } from '@/types/financialState';

export const financialStateService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * The whole position. Invalidated by everything that could move any part of it - this
     * is a composition, so a stale Pulse is a Pulse that contradicts the screen beside it,
     * which is worse than one that takes a moment to refresh.
     */
    getFinancialState: build.query<FinancialStateResponse, void>({
      query: () => '/financial-state',
      providesTags: [
        'Position',
        'NetWorth',
        'Projection',
        'Goal',
        'Timeline',
        'CardTerms',
        'CardStatement',
        // Runway reads holdings to know what is actually reachable.
        { type: 'Investment' as const, id: 'LIST' },
        { type: 'CommitmentInstance' as const, id: 'LIST' },
        { type: 'Transaction' as const, id: 'LIST' },
        { type: 'Account' as const, id: 'LIST' },
        { type: 'Loan' as const, id: 'LIST' },
      ],
    }),
  }),
});

export const { useGetFinancialStateQuery } = financialStateService;
