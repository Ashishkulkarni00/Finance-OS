import { baseApi } from './api/baseApi';
import type { ForecastResponse } from '@/types/forecast';

export const forecastService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getForecast: build.query<ForecastResponse, number | void>({
      query: (months = 12) => `/forecast?months=${months}`,
      // Any write to a rule, a transaction, a loan or a goal can change the projection.
      providesTags: ['Commitment', { type: 'CommitmentInstance' as const, id: 'LIST' }, 'Loan', 'Goal', 'Cycle'],
    }),
  }),
});

export const { useGetForecastQuery } = forecastService;
