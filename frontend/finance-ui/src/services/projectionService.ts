import { baseApi } from './api/baseApi';
import type { ProjectionResponse } from '@/types/projection';

export const projectionService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjection: build.query<ProjectionResponse, number>({
      query: (accountId) => `/accounts/${accountId}/projection`,
      // Also 'Position': anything that moves Real Balance (a transaction, a settled bill, an
      // edited rule) moves each account's projection too.
      providesTags: (_result, _error, accountId) => [{ type: 'Projection', id: accountId }, 'Position'],
    }),
  }),
});

export const { useGetProjectionQuery } = projectionService;
