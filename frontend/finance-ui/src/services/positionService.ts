import { baseApi } from './api/baseApi';
import type { CashPositionResponse, NetWorthResponse, PositionResponse } from '@/types/position';

export const positionService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPosition: build.query<PositionResponse, void>({
      query: () => '/position',
      providesTags: ['Position'],
    }),
    getCashPosition: build.query<CashPositionResponse, void>({
      query: () => '/position/cash',
      providesTags: ['Position'],
    }),
    getNetWorth: build.query<NetWorthResponse, void>({
      query: () => '/net-worth',
      providesTags: ['NetWorth'],
    }),
  }),
});

export const { useGetPositionQuery, useGetCashPositionQuery, useGetNetWorthQuery } = positionService;
