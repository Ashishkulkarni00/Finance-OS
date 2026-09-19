import { baseApi } from './api/baseApi';
import type { CycleResponse, CycleSummaryResponse, CycleSnapshotResponse, FlexibleSpendingResponse } from '@/types/cycle';
import type { PageResponse } from '@/types/api';

export const cycleService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCurrentCycle: build.query<CycleResponse, void>({
      query: () => '/cycles/current',
      providesTags: ['Cycle'],
    }),

    getCycles: build.query<PageResponse<CycleResponse>, void>({
      query: () => ({ url: '/cycles', params: { size: 12 } }),
      providesTags: ['Cycle'],
    }),

    getCycle: build.query<CycleResponse, number>({
      query: (id) => `/cycles/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Cycle', id }],
    }),

    /** The cycle containing a date, created on demand - how Months steps to the
     *  previous or next month. */
    getCycleForDate: build.query<CycleResponse, string>({
      query: (date) => ({ url: '/cycles/for-date', params: { date } }),
      providesTags: (result) => (result ? [{ type: 'Cycle', id: result.id }] : ['Cycle']),
    }),

    getCycleSnapshot: build.query<CycleSnapshotResponse, number>({
      query: (id) => `/cycles/${id}/snapshot`,
    }),

    getCycleSummary: build.query<CycleSummaryResponse, number>({
      query: (id) => `/cycles/${id}/summary`,
      providesTags: (_result, _error, id) => [{ type: 'Cycle', id }],
    }),

    getFlexibleSpending: build.query<FlexibleSpendingResponse, number>({
      query: (id) => `/cycles/${id}/flexible-spending`,
      providesTags: (_result, _error, id) => [{ type: 'Cycle', id: `${id}-flexible-spending` }],
    }),

    closeCycle: build.mutation<CycleSnapshotResponse, number>({
      query: (id) => ({ url: `/cycles/${id}/close`, method: 'POST' }),
      invalidatesTags: ['Cycle'],
    }),
  }),
});

export const {
  useGetCurrentCycleQuery,
  useGetCyclesQuery,
  useGetCycleQuery,
  useLazyGetCycleForDateQuery,
  useGetCycleForDateQuery,
  useGetCycleSnapshotQuery,
  useGetCycleSummaryQuery,
  useGetFlexibleSpendingQuery,
  useCloseCycleMutation,
} = cycleService;
