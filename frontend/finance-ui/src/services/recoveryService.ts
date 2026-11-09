import { baseApi } from './api/baseApi';
import type { RecoveryPlan } from '@/types/recovery';

export const recoveryService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** The way back, if this month needs one. Derived from the position, so it moves with every write. */
    getRecovery: build.query<RecoveryPlan, void>({
      query: () => '/recovery',
      providesTags: ['Position'],
    }),
  }),
});

export const { useGetRecoveryQuery } = recoveryService;
