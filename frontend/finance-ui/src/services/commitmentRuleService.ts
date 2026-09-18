import { baseApi } from './api/baseApi';
import type { CommitmentResponse, CreateCommitmentRequest, UpdateCommitmentRequest } from '@/types/commitmentRule';
import type { CommitmentInstanceHistoryEntry } from '@/types/commitment';
import type { PageResponse } from '@/types/api';

/**
 * The rule ({@code Commitment}), not the cycle-scoped occurrence - see
 * commitmentInstanceService.ts for that. Named `commitmentRuleService` to keep the
 * two apart at a glance in imports, matching how the backend keeps `Commitment` and
 * `CommitmentInstance` as distinct types.
 */
export const commitmentRuleService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCommitmentRules: build.query<PageResponse<CommitmentResponse>, void>({
      query: () => ({ url: '/commitments', params: { size: 50 } }),
      providesTags: [{ type: 'Commitment', id: 'LIST' }],
    }),

    getCommitmentRule: build.query<CommitmentResponse, number>({
      query: (id) => `/commitments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Commitment', id }],
    }),

    getCommitmentRuleInstances: build.query<CommitmentInstanceHistoryEntry[], number>({
      query: (id) => `/commitments/${id}/instances`,
      providesTags: (_result, _error, id) => [{ type: 'Commitment', id: `${id}-instances` }],
    }),

    createCommitmentRule: build.mutation<CommitmentResponse, CreateCommitmentRequest>({
      query: (body) => ({ url: '/commitments', method: 'POST', body }),
      // A new rule creates this cycle's occurrence server-side, so everything that lists
      // occurrences has to refetch - not just the rules list. Invalidating only
      // Commitment/Position was why a bill added from Months didn't appear in the
      // plan (or its progress line, or Today's Coming up) until the page was reloaded.
      invalidatesTags: [{ type: 'Commitment', id: 'LIST' }, { type: 'CommitmentInstance', id: 'LIST' }, 'Position', 'Timeline'],
    }),

    /** A bill for a loan's EMI that follows the loan. Returns the existing one if there is one. */
    createBillFromLoan: build.mutation<CommitmentResponse, number>({
      query: (loanId) => ({ url: `/commitments/from-loan/${loanId}`, method: 'POST' }),
      invalidatesTags: [{ type: 'Commitment', id: 'LIST' }, { type: 'CommitmentInstance', id: 'LIST' }, 'Loan', 'Position', 'Timeline'],
    }),

    /** A bill for a SIP / RD instalment that follows the holding. Returns the existing one if there is one. */
    createBillFromInvestment: build.mutation<CommitmentResponse, number>({
      query: (investmentId) => ({ url: `/commitments/from-investment/${investmentId}`, method: 'POST' }),
      invalidatesTags: [{ type: 'Commitment', id: 'LIST' }, { type: 'CommitmentInstance', id: 'LIST' }, 'Investment', 'Position', 'Timeline'],
    }),

    // An edit or delete changes the unpaid occurrences server-side (amount, due date, or
    // retired), so every occurrence list and detail refetches - the whole tag type.
    updateCommitmentRule: build.mutation<CommitmentResponse, { id: number; body: UpdateCommitmentRequest }>({
      query: ({ id, body }) => ({ url: `/commitments/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Commitment', id },
        { type: 'Commitment', id: 'LIST' },
        { type: 'Commitment', id: `${id}-instances` },
        'CommitmentInstance',
        // Linking or unlinking changes which loan / holding shows "in your plan".
        'Loan',
        'Investment',
        'Goal',
        'Position',
        'Timeline',
      ],
    }),

    deleteCommitmentRule: build.mutation<void, number>({
      query: (id) => ({ url: `/commitments/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Commitment', id },
        { type: 'Commitment', id: 'LIST' },
        'CommitmentInstance',
        'Loan',
        'Investment',
        'Goal',
        'Position',
        'Timeline',
      ],
    }),
  }),
});

export const {
  useGetCommitmentRulesQuery,
  useGetCommitmentRuleQuery,
  useGetCommitmentRuleInstancesQuery,
  useCreateCommitmentRuleMutation,
  useUpdateCommitmentRuleMutation,
  useDeleteCommitmentRuleMutation,
  useCreateBillFromLoanMutation,
  useCreateBillFromInvestmentMutation,
} = commitmentRuleService;
