import { baseApi } from './api/baseApi';
import type { MomentumItem } from '@/types/momentum';

export const momentumService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMomentum: build.query<MomentumItem[], void>({
      query: () => '/momentum',
      providesTags: ['Position', 'Commitment', 'CommitmentInstance'],
    }),
  }),
});

export const { useGetMomentumQuery } = momentumService;
