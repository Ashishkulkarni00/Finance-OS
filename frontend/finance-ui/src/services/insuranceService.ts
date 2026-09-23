import { baseApi } from './api/baseApi';
import type {
  CreateInsurancePolicyRequest,
  InsurancePolicyResponse,
  InsuranceSummaryResponse,
  UpdateInsurancePolicyRequest,
} from '@/types/insurance';
import type { PageResponse } from '@/types/api';

/**
 * Insurance policies - the protection primitive (ADR-0016).
 *
 * <p>Nothing here invalidates `NetWorth`, and that is deliberate: cover is not an asset,
 * so adding or changing a policy cannot move net worth. If a change here ever needed to,
 * something would be wrong with the model rather than with the cache.
 */
export const insuranceService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getInsurancePolicies: build.query<PageResponse<InsurancePolicyResponse>, { includeArchived?: boolean } | void>({
      query: (args) => ({
        url: '/insurance-policies',
        params: { size: 50, includeArchived: args?.includeArchived ?? false },
      }),
      providesTags: [{ type: 'Insurance', id: 'LIST' }],
    }),

    getInsurancePolicy: build.query<InsurancePolicyResponse, number>({
      query: (id) => `/insurance-policies/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Insurance', id }],
    }),

    getInsuranceSummary: build.query<InsuranceSummaryResponse, void>({
      query: () => '/insurance-policies/summary',
      providesTags: [{ type: 'Insurance', id: 'LIST' }],
    }),

    createInsurancePolicy: build.mutation<InsurancePolicyResponse, CreateInsurancePolicyRequest>({
      query: (body) => ({ url: '/insurance-policies', method: 'POST', body }),
      invalidatesTags: [{ type: 'Insurance', id: 'LIST' }, 'Timeline'],
    }),

    updateInsurancePolicy: build.mutation<InsurancePolicyResponse, { id: number; body: UpdateInsurancePolicyRequest }>({
      query: ({ id, body }) => ({ url: `/insurance-policies/${id}`, method: 'PATCH', body }),
      // The premium bill follows the policy, so a changed premium changes the plan.
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Insurance', id },
        { type: 'Insurance', id: 'LIST' },
        'Commitment',
        'CommitmentInstance',
        'Position',
        'Timeline',
        'PlanRevision',
      ],
    }),

    archiveInsurancePolicy: build.mutation<InsurancePolicyResponse, number>({
      query: (id) => ({ url: `/insurance-policies/${id}/archive`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Insurance', id }, { type: 'Insurance', id: 'LIST' }, 'Timeline'],
    }),

    unarchiveInsurancePolicy: build.mutation<InsurancePolicyResponse, number>({
      query: (id) => ({ url: `/insurance-policies/${id}/unarchive`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Insurance', id }, { type: 'Insurance', id: 'LIST' }, 'Timeline'],
    }),

    deleteInsurancePolicy: build.mutation<void, number>({
      query: (id) => ({ url: `/insurance-policies/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Insurance', id },
        { type: 'Insurance', id: 'LIST' },
        'Commitment',
        'Timeline',
      ],
    }),
  }),
});

export const {
  useGetInsurancePoliciesQuery,
  useGetInsurancePolicyQuery,
  useGetInsuranceSummaryQuery,
  useCreateInsurancePolicyMutation,
  useUpdateInsurancePolicyMutation,
  useArchiveInsurancePolicyMutation,
  useUnarchiveInsurancePolicyMutation,
  useDeleteInsurancePolicyMutation,
} = insuranceService;
