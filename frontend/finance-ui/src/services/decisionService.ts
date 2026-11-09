import { baseApi } from './api/baseApi';
import type { AffordabilityResponse, LumpSumResponse, UnlockOption } from '@/types/decision';

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
    /**
     * What `amount` a month could do once free from `startsOn` — on each loan, each goal, or
     * kept. Every loan and goal is carried forward to `startsOn` first, so an unlock in
     * February is costed against where things will stand in February.
     */
    /** Where a lump sum could go — prepay, a goal, or keep (ROADMAP 4.3). */
    getLumpSum: build.query<LumpSumResponse, string>({
      query: (amount) => ({ url: '/decisions/lump-sum', params: { amount } }),
      providesTags: ['Position'],
    }),
    getUnlockOptions: build.query<UnlockOption[], { amount: string; startsOn?: string }>({
      query: ({ amount, startsOn }) => ({ url: '/decisions/unlock-options', params: startsOn ? { amount, startsOn } : { amount } }),
      providesTags: ['Position'],
    }),
  }),
});

export const { useGetAffordabilityQuery, useGetUnlockOptionsQuery, useGetLumpSumQuery } = decisionService;
