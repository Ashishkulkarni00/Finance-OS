import { baseApi } from './api/baseApi';
import type {
  CommitmentInstanceResponse,
  CommitmentPlanProgressResponse,
  CommitmentInstanceDetailResponse,
  CycleStandingResponse,
  CycleShapeResponse,
  CycleReviewResponse,
} from '@/types/commitment';

export const commitmentInstanceService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCommitmentInstancesForCycle: build.query<CommitmentInstanceResponse[], number>({
      query: (cycleId) => `/cycles/${cycleId}/commitment-instances`,
      providesTags: (result) =>
        result
          ? [...result.map((i) => ({ type: 'CommitmentInstance' as const, id: i.id })), { type: 'CommitmentInstance' as const, id: 'LIST' }]
          : [{ type: 'CommitmentInstance' as const, id: 'LIST' }],
    }),

    getCommitmentPlanProgress: build.query<CommitmentPlanProgressResponse, number>({
      query: (cycleId) => `/cycles/${cycleId}/plan-progress`,
      providesTags: [{ type: 'CommitmentInstance' as const, id: 'LIST' }],
    }),

    getCycleStanding: build.query<CycleStandingResponse, number>({
      query: (cycleId) => `/cycles/${cycleId}/standing`,
      providesTags: [{ type: 'CommitmentInstance' as const, id: 'LIST' }],
    }),

    /** Reads transactions too ("spent"), so it refreshes whenever Position does. */
    getCycleShape: build.query<CycleShapeResponse, number>({
      query: (cycleId) => `/cycles/${cycleId}/shape`,
      providesTags: [{ type: 'CommitmentInstance' as const, id: 'LIST' }, 'Position'],
    }),

    getCycleReview: build.query<CycleReviewResponse, number>({
      query: (cycleId) => `/cycles/${cycleId}/review`,
      providesTags: [{ type: 'CommitmentInstance' as const, id: 'LIST' }, 'Position'],
    }),

    getCommitmentInstanceDetail: build.query<CommitmentInstanceDetailResponse, number>({
      query: (id) => `/commitment-instances/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'CommitmentInstance' as const, id }],
    }),

    confirmCommitmentInstance: build.mutation<CommitmentInstanceResponse, number>({
      query: (id) => ({ url: `/commitment-instances/${id}/confirm`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'CommitmentInstance', id: 'LIST' }, { type: 'CommitmentInstance', id }, 'Position', 'Timeline'],
    }),

    settleCommitmentInstance: build.mutation<CommitmentInstanceResponse, { id: number; transactionId: number; amount: string }>({
      query: ({ id, ...body }) => ({ url: `/commitment-instances/${id}/settle`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'CommitmentInstance', id: 'LIST' }, { type: 'CommitmentInstance', id }, 'Position', 'Timeline'],
    }),

    /** Optional bills only: stop it counting against what's free this cycle. */
    skipCommitmentInstance: build.mutation<CommitmentInstanceResponse, number>({
      query: (id) => ({ url: `/commitment-instances/${id}/skip`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'CommitmentInstance', id: 'LIST' }, { type: 'CommitmentInstance', id }, 'Position', 'Timeline'],
    }),

    unskipCommitmentInstance: build.mutation<CommitmentInstanceResponse, number>({
      query: (id) => ({ url: `/commitment-instances/${id}/unskip`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'CommitmentInstance', id: 'LIST' }, { type: 'CommitmentInstance', id }, 'Position', 'Timeline'],
    }),

    /** An estimate is fine - it's what lets a variable bill stop blocking Room. */
    setCommitmentInstanceAmount: build.mutation<CommitmentInstanceResponse, { id: number; expectedAmount: string }>({
      query: ({ id, ...body }) => ({ url: `/commitment-instances/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'CommitmentInstance', id: 'LIST' }, { type: 'CommitmentInstance', id }, 'Position', 'Timeline'],
    }),
  }),
});

export const {
  useGetCommitmentInstancesForCycleQuery,
  useGetCommitmentPlanProgressQuery,
  useGetCycleStandingQuery,
  useGetCycleShapeQuery,
  useGetCycleReviewQuery,
  useGetCommitmentInstanceDetailQuery,
  useConfirmCommitmentInstanceMutation,
  useSettleCommitmentInstanceMutation,
  useSetCommitmentInstanceAmountMutation,
  useSkipCommitmentInstanceMutation,
  useUnskipCommitmentInstanceMutation,
} = commitmentInstanceService;
