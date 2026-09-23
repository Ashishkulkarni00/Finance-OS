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

    /**
     * Everything that needs the user, uncapped - the dedicated "Needs you" page.
     *
     * Polled, because this list is the one place the user leaves open to watch. A due date
     * passing or an EMI falling due changes it with no write to invalidate a tag, so cache
     * tags alone would leave it stale on a screen that claims to be current.
     */
    getAllInsights: build.query<InsightListResponse, void>({
      query: () => '/insights/all',
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

export const { useGetInsightsQuery, useGetAllInsightsQuery } = insightService;
