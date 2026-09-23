import { baseApi } from './api/baseApi';
import type { CyclePlanChangesResponse, PlanRevisionResponse, PlanSubjectType } from '@/types/plan';
import type { PageResponse } from '@/types/api';

/**
 * The plan's history - ADR-0015. Read-only: a revision is written by the server as a side
 * effect of the change it describes, never posted from here.
 *
 * Every commitment and goal mutation invalidates `PlanRevision`, so the log refreshes with
 * the edit that produced it.
 */
export const planRevisionService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPlanRevisions: build.query<PageResponse<PlanRevisionResponse>, void>({
      query: () => ({ url: '/plan-revisions', params: { size: 50 } }),
      providesTags: ['PlanRevision'],
    }),

    /** Every version of one plan line - the server matches a superseded rule on either side. */
    getPlanRevisionsForSubject: build.query<
      PageResponse<PlanRevisionResponse>,
      { subjectType: PlanSubjectType; subjectId: number }
    >({
      query: ({ subjectType, subjectId }) => ({ url: '/plan-revisions', params: { subjectType, subjectId } }),
      providesTags: (_r, _e, { subjectType, subjectId }) => [
        { type: 'PlanRevision' as const, id: `${subjectType}-${subjectId}` },
        'PlanRevision',
      ],
    }),

    getCyclePlanChanges: build.query<CyclePlanChangesResponse, number>({
      query: (cycleId) => `/plan-revisions/cycles/${cycleId}`,
      providesTags: (_r, _e, cycleId) => [{ type: 'PlanRevision' as const, id: `cycle-${cycleId}` }, 'PlanRevision'],
    }),
  }),
});

export const {
  useGetPlanRevisionsQuery,
  useGetPlanRevisionsForSubjectQuery,
  useGetCyclePlanChangesQuery,
} = planRevisionService;
