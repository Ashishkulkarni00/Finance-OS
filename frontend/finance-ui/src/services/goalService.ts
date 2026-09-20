import { baseApi } from './api/baseApi';
import type { GoalResponse, CreateGoalRequest, UpdateGoalRequest } from '@/types/goal';
import type { PageResponse } from '@/types/api';

export const goalService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getGoals: build.query<PageResponse<GoalResponse>, void>({
      query: () => ({ url: '/goals', params: { size: 50 } }),
      // 'Position' too: a goal's progress is its linked account's balance, which any
      // transaction moves - Today's "behind its pace" card must not go stale.
      providesTags: (result) => [
        ...(result?.content.map((g) => ({ type: 'Goal' as const, id: g.id })) ?? []),
        { type: 'Goal' as const, id: 'LIST' },
        'Position' as const,
        // Its schedule reads the payments planned against it and whether they're paid.
        'Commitment' as const,
        'CommitmentInstance' as const,
      ],
    }),

    getGoal: build.query<GoalResponse, number>({
      query: (id) => `/goals/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Goal', id }, 'Position', 'Commitment', 'CommitmentInstance'],
    }),

    createGoal: build.mutation<GoalResponse, CreateGoalRequest>({
      query: (body) => ({ url: '/goals', method: 'POST', body }),
      invalidatesTags: [{ type: 'Goal', id: 'LIST' }],
    }),

    updateGoal: build.mutation<GoalResponse, { id: number; body: UpdateGoalRequest }>({
      query: ({ id, body }) => ({ url: `/goals/${id}`, method: 'PATCH', body }),
      // Its bills follow it (a funding transfer's destination, an archived goal's bills end).
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Goal', id }, { type: 'Goal', id: 'LIST' }, 'Commitment', 'CommitmentInstance', 'Position'],
    }),

    archiveGoal: build.mutation<GoalResponse, number>({
      query: (id) => ({ url: `/goals/${id}/archive`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Goal', id }, { type: 'Goal', id: 'LIST' }, 'Commitment', 'CommitmentInstance', 'Position'],
    }),

    unarchiveGoal: build.mutation<GoalResponse, number>({
      query: (id) => ({ url: `/goals/${id}/unarchive`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Goal', id }, { type: 'Goal', id: 'LIST' }],
    }),

    deleteGoal: build.mutation<void, number>({
      query: (id) => ({ url: `/goals/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Goal', id }, { type: 'Goal', id: 'LIST' }, 'Commitment', 'CommitmentInstance', 'Position'],
    }),
  }),
});

export const {
  useGetGoalsQuery,
  useGetGoalQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useArchiveGoalMutation,
  useUnarchiveGoalMutation,
  useDeleteGoalMutation,
} = goalService;
