import { baseApi } from './api/baseApi';
import type { TimelineItemResponse } from '@/types/timeline';

export const timelineService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTimeline: build.query<TimelineItemResponse[], { days?: number } | void>({
      query: (args) => ({ url: '/timeline', params: { days: args?.days ?? 30 } }),
      providesTags: ['Timeline'],
    }),
  }),
});

export const { useGetTimelineQuery } = timelineService;
