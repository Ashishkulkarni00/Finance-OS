import { baseApi } from './api/baseApi';
import type { AccountResponse, CreateAccountRequest, UpdateAccountRequest, PageResponse } from '@/types/api';

export const accountService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccounts: build.query<PageResponse<AccountResponse>, { includeArchived?: boolean } | void>({
      query: (args) => ({
        url: '/accounts',
        params: { includeArchived: args?.includeArchived ?? false, size: 50 },
      }),
      providesTags: (result) =>
        result
          ? [...result.content.map((a) => ({ type: 'Account' as const, id: a.id })), { type: 'Account' as const, id: 'LIST' }]
          : [{ type: 'Account' as const, id: 'LIST' }],
    }),

    getAccount: build.query<AccountResponse, number>({
      query: (id) => `/accounts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Account', id }],
    }),

    createAccount: build.mutation<AccountResponse, CreateAccountRequest>({
      query: (body) => ({ url: '/accounts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Account', id: 'LIST' }, 'Position', 'NetWorth'],
    }),

    updateAccount: build.mutation<AccountResponse, { id: number; body: UpdateAccountRequest }>({
      query: ({ id, body }) => ({ url: `/accounts/${id}`, method: 'PATCH', body }),
      // Updating a balance re-bases the account, and three other things read that
      // balance: its own shortfall projection, a goal tracked in it, and an investment
      // held in it. Without these, updating a balance left all three stale.
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Account', id },
        { type: 'Account', id: 'LIST' },
        'Position',
        'NetWorth',
        { type: 'Projection', id },
        'Goal',
        'Investment',
        'CardTerms',
      ],
    }),

    archiveAccount: build.mutation<AccountResponse, number>({
      query: (id) => ({ url: `/accounts/${id}/archive`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Account', id }, { type: 'Account', id: 'LIST' }, 'Position', 'NetWorth'],
    }),

    unarchiveAccount: build.mutation<AccountResponse, number>({
      query: (id) => ({ url: `/accounts/${id}/unarchive`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Account', id }, { type: 'Account', id: 'LIST' }, 'Position', 'NetWorth'],
    }),

    deleteAccount: build.mutation<void, number>({
      query: (id) => ({ url: `/accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Account', id }, { type: 'Account', id: 'LIST' }, 'Position', 'NetWorth'],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useArchiveAccountMutation,
  useUnarchiveAccountMutation,
  useDeleteAccountMutation,
} = accountService;
