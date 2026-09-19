import { baseApi } from './api/baseApi';
import type { InsightListResponse, InsightSurface } from '@/types/insight';

export const insightService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Derived from the plan, balances, cards and goals - so it refreshes whenever any of those change. */
    getInsights: build.query<InsightListResponse, InsightSurface>({
      query: (surface) => `/insights?surface=${surface}`,
      providesTags: [
        { type: 'CommitmentInstance' as const, id: 'LIST' },
        'Position',
        'Projection',
        'CardTerms',
        'CardStatement',
        'Goal',
        'Timeline',
      ],
    }),
  }),
});

export const { useGetInsightsQuery } = insightService;
