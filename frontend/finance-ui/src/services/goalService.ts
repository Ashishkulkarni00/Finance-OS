import { baseApi } from './api/baseApi';
import type { GoalResponse, CreateGoalRequest } from '@/types/goal';
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
      ],
    }),

    getGoal: build.query<GoalResponse, number>({
      query: (id) => `/goals/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Goal', id }],
    }),

    createGoal: build.mutation<GoalResponse, CreateGoalRequest>({
      query: (body) => ({ url: '/goals', method: 'POST', body }),
      invalidatesTags: [{ type: 'Goal', id: 'LIST' }],
    }),
  }),
});

export const { useGetGoalsQuery, useGetGoalQuery, useCreateGoalMutation } = goalService;
