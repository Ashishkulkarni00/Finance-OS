import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import { TAG_TYPES } from './tags';

/**
 * The one RTK Query root. Every feature's service file injects endpoints into this -
 * see FRONTEND_CONVENTIONS.md §3. Nothing outside `services/` calls `fetch` directly.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});
