import { baseApi } from './api/baseApi';
import type { UserSettingsResponse, UpdateUserSettingsRequest } from '@/types/user';

export const userService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<UserSettingsResponse, void>({
      query: () => '/me',
      providesTags: ['User'],
    }),

    updateMe: build.mutation<UserSettingsResponse, UpdateUserSettingsRequest>({
      query: (body) => ({ url: '/me', method: 'PATCH', body }),
      invalidatesTags: ['User', 'Cycle', 'Position'],
    }),
  }),
});

export const { useGetMeQuery, useUpdateMeMutation } = userService;
