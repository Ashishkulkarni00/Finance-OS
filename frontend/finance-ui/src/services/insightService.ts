import { baseApi } from './api/baseApi';
import type { InsightListResponse, InsightSurface } from '@/types/insight';

export const insightService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Derived from the plan, balances, cards and goals - so it refreshes whenever any of those change. */
    getInsights: build.query<InsightListResponse, InsightSurface>({
      query: (surface) => `/insights?surface=${surface}`,
      providesTags: [
        'Insight',
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
        'Insight',
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
     * "I know" — silent until the situation itself changes (ROADMAP 3.2).
     *
     * The key is encoded: insight keys contain colons (`goal:6:pace`), and an unencoded one
     * is at the mercy of whatever the server's path parser makes of them.
     */
    dismissInsight: build.mutation<void, string>({
      query: (key) => ({ url: `/insights/${encodeURIComponent(key)}/dismiss`, method: 'POST' }),
      invalidatesTags: ['Insight'],
    }),

    /** "Not this week" — silent until a date, whatever happens in the meantime. */
    snoozeInsight: build.mutation<void, { key: string; days: number }>({
      query: ({ key, days }) => ({
        url: `/insights/${encodeURIComponent(key)}/snooze?days=${days}`,
        method: 'POST',
      }),
      invalidatesTags: ['Insight'],
    }),

    /** Undo — it speaks again immediately. */
    restoreInsight: build.mutation<void, string>({
      query: (key) => ({ url: `/insights/${encodeURIComponent(key)}/restore`, method: 'POST' }),
      invalidatesTags: ['Insight'],
    }),
  }),
});

export const {
  useGetInsightsQuery,
  useGetAllInsightsQuery,
  useDismissInsightMutation,
  useSnoozeInsightMutation,
  useRestoreInsightMutation,
} = insightService;
