import { baseApi } from './api/baseApi';
import type { ImportBatchResponse, UpdateImportRowRequest } from '@/types/import';

export const importService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** A bank or card statement CSV for one account. Stages rows; nothing is imported yet. */
    uploadStatement: build.mutation<ImportBatchResponse, { accountId: number; file: File }>({
      query: ({ accountId, file }) => {
        const body = new FormData();
        body.append('file', file);
        return { url: `/imports/statement?accountId=${accountId}`, method: 'POST', body };
      },
    }),

    updateImportRow: build.mutation<ImportBatchResponse, { batchId: number; rowId: number; body: UpdateImportRowRequest }>({
      query: ({ batchId, rowId, body }) => ({ url: `/imports/${batchId}/rows/${rowId}`, method: 'PATCH', body }),
    }),

    /** Creates the entries - they match planned bills like any recorded entry, so the plan updates too. */
    commitImport: build.mutation<ImportBatchResponse, { batchId: number; includeDuplicateRowIds: number[]; excludeRowIds: number[] }>({
      query: ({ batchId, ...body }) => ({ url: `/imports/${batchId}/commit`, method: 'POST', body }),
      invalidatesTags: [
        { type: 'Transaction', id: 'LIST' },
        { type: 'Transaction', id: 'SUMMARY' },
        { type: 'Transaction', id: 'DAY-SUBTOTALS' },
        { type: 'Account', id: 'LIST' },
        'Position',
        'NetWorth',
        'CommitmentInstance',
        'Timeline',
        'CardTerms',
        'Cycle',
        'Projection',
        'Goal',
      ],
    }),
  }),
});

export const { useUploadStatementMutation, useUpdateImportRowMutation, useCommitImportMutation } = importService;
