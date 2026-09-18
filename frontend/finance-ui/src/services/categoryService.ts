import { baseApi } from './api/baseApi';
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category';
import type { PageResponse } from '@/types/api';

/** the Months page's plan is grouped under category names, so renaming, archiving or deleting
 *  one has to refresh it. */
const PLAN_HEADINGS = [{ type: 'CommitmentInstance' as const, id: 'LIST' }];

export const categoryService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<PageResponse<CategoryResponse>, { includeArchived?: boolean } | void>({
      query: (args) => ({ url: '/categories', params: { includeArchived: args?.includeArchived ?? false, size: 100 } }),
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    createCategory: build.mutation<CategoryResponse, CreateCategoryRequest>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    updateCategory: build.mutation<CategoryResponse, { id: number; body: UpdateCategoryRequest }>({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }, ...PLAN_HEADINGS],
    }),

    archiveCategory: build.mutation<CategoryResponse, number>({
      query: (id) => ({ url: `/categories/${id}/archive`, method: 'POST' }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }, ...PLAN_HEADINGS],
    }),

    unarchiveCategory: build.mutation<CategoryResponse, number>({
      query: (id) => ({ url: `/categories/${id}/unarchive`, method: 'POST' }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }, ...PLAN_HEADINGS],
    }),

    /** Soft delete (ADR-0004) - existing transactions keep the category via
     *  `getByIdIncludingDeleted`, so this never orphans history. The manage sheet still
     *  steers toward Archive first and shows the usage count before this is offered. */
    deleteCategory: build.mutation<void, number>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }, ...PLAN_HEADINGS],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useArchiveCategoryMutation,
  useUnarchiveCategoryMutation,
  useDeleteCategoryMutation,
} = categoryService;
