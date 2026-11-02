import { baseApi } from './api/baseApi';
import type { DebtTrajectoryResponse, ReviewMonthsResponse } from '@/types/review';

export const reviewService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReviewMonths: build.query<ReviewMonthsResponse, number | void>({
      query: (months = 12) => `/review/months?months=${months}`,
      // Everything on this screen is derived from transactions, the plan's occurrences and
      // the cycles themselves, so any write to those restates it.
      providesTags: ['Transaction', 'Cycle', { type: 'CommitmentInstance' as const, id: 'LIST' }],
    }),
    getDebtTrajectory: build.query<DebtTrajectoryResponse, void>({
      query: () => '/review/debt-trajectory',
      // Recording a loan payment is what moves the curve - and so is editing a loan's terms.
      providesTags: ['Loan', 'Transaction'],
    }),
  }),
});

export const { useGetReviewMonthsQuery, useGetDebtTrajectoryQuery } = reviewService;
