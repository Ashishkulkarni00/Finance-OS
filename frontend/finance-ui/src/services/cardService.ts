import { baseApi } from './api/baseApi';
import type {
  CardStatementResponse,
  CreateCardStatementRequest,
  CreateCreditCardRequest,
  CreateDebitCardRequest,
  CreditCardResponse,
  CreditCardsOverviewResponse,
  DebitCardResponse,
  StatementDraftResponse,
  UpdateCreditCardRequest,
  UpdateDebitCardRequest,
} from '@/types/card';

// A card is an account, and what's owed on it is subtracted from what's free - so a
// change to a card reaches accounts, position, net worth and Coming up, not just Cards.
const AFTER_CARD_CHANGE = ['CardTerms', 'CardStatement', 'Account', 'Position', 'NetWorth', 'Timeline'] as const;

export const cardService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCreditCards: build.query<CreditCardsOverviewResponse, void>({
      query: () => '/credit-cards',
      providesTags: ['CardTerms'],
    }),

    getCreditCard: build.query<CreditCardResponse, number>({
      query: (accountId) => `/credit-cards/${accountId}`,
      providesTags: ['CardTerms'],
    }),

    createCreditCard: build.mutation<CreditCardResponse, CreateCreditCardRequest>({
      query: (body) => ({ url: '/credit-cards', method: 'POST', body }),
      invalidatesTags: [...AFTER_CARD_CHANGE],
    }),

    updateCreditCard: build.mutation<CreditCardResponse, { accountId: number; body: UpdateCreditCardRequest }>({
      query: ({ accountId, body }) => ({ url: `/credit-cards/${accountId}`, method: 'PATCH', body }),
      invalidatesTags: [...AFTER_CARD_CHANGE],
    }),

    getCardStatements: build.query<CardStatementResponse[], number>({
      query: (accountId) => `/accounts/${accountId}/statements`,
      providesTags: ['CardStatement'],
    }),

    /** Pre-fills "Record statement" from the card's entries. Saves nothing. */
    getStatementDraft: build.query<StatementDraftResponse, { accountId: number; statementDate?: string }>({
      query: ({ accountId, statementDate }) => ({
        url: `/accounts/${accountId}/statements/draft`,
        params: statementDate ? { statementDate } : undefined,
      }),
      providesTags: ['CardStatement'],
    }),

    addCardStatement: build.mutation<CardStatementResponse, { accountId: number; body: CreateCardStatementRequest }>({
      query: ({ accountId, body }) => ({ url: `/accounts/${accountId}/statements`, method: 'POST', body }),
      invalidatesTags: ['CardStatement', 'CardTerms', 'Timeline'],
    }),

    deleteCardStatement: build.mutation<void, { accountId: number; statementId: number }>({
      query: ({ accountId, statementId }) => ({ url: `/accounts/${accountId}/statements/${statementId}`, method: 'DELETE' }),
      invalidatesTags: ['CardStatement', 'CardTerms', 'Timeline'],
    }),

    getDebitCards: build.query<DebitCardResponse[], void>({
      query: () => '/debit-cards',
      providesTags: ['DebitCard'],
    }),

    createDebitCard: build.mutation<DebitCardResponse, CreateDebitCardRequest>({
      query: (body) => ({ url: '/debit-cards', method: 'POST', body }),
      invalidatesTags: ['DebitCard'],
    }),

    updateDebitCard: build.mutation<DebitCardResponse, { id: number; body: UpdateDebitCardRequest }>({
      query: ({ id, body }) => ({ url: `/debit-cards/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['DebitCard'],
    }),

    deleteDebitCard: build.mutation<void, number>({
      query: (id) => ({ url: `/debit-cards/${id}`, method: 'DELETE' }),
      invalidatesTags: ['DebitCard'],
    }),
  }),
});

export const {
  useGetCreditCardsQuery,
  useGetCreditCardQuery,
  useCreateCreditCardMutation,
  useUpdateCreditCardMutation,
  useGetCardStatementsQuery,
  useGetStatementDraftQuery,
  useAddCardStatementMutation,
  useDeleteCardStatementMutation,
  useGetDebitCardsQuery,
  useCreateDebitCardMutation,
  useUpdateDebitCardMutation,
  useDeleteDebitCardMutation,
} = cardService;
