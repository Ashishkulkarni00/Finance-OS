import { baseApi } from './api/baseApi';
import type { AffordabilityResponse } from '@/types/decision';

export const decisionService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * What spending this amount from this account would cost. A GET: it changes nothing,
     * and is safe to call while the amount is still being typed.
     *
     * Tagged 'Position' because every figure it returns is derived from the position —
     * record a transaction and the answer to "can I afford this" must move with it.
     */
    getAffordability: build.query<AffordabilityResponse, { amount: string; accountId: number }>({
      query: ({ amount, accountId }) => ({ url: '/decisions/afford', params: { amount, accountId } }),
      providesTags: ['Position'],
    }),
  }),
});

export const { useGetAffordabilityQuery } = decisionService;
