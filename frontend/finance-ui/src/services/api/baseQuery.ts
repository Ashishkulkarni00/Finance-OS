import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { ProblemDetail, AppError } from '@/types/errors';
import { serverAnswered, serverUnreachable } from '@/store/slices/connectivitySlice';

const raw = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  prepareHeaders: (headers, { arg }) => {
    // A file upload (FormData) sets its own multipart boundary - forcing JSON would break it.
    const body = typeof arg === 'object' && arg !== null && 'body' in arg ? (arg as FetchArgs).body : undefined;
    if (!(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return headers; // an auth header lands here in Phase 4
  },
});

/**
 * Normalises the backend's RFC 7807 errors into one flat {@link AppError} shape, so no
 * component ever inspects an HTTP status or a ProblemDetail directly. See
 * BACKEND_CONVENTIONS.md §6 and FRONTEND_CONVENTIONS.md §3.
 */
export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, AppError> = async (args, api, extraOptions) => {
  // While the server cannot be reached (connectivity mode, UI_UX_REVAMP_PLAN 6.11) a write is
  // not attempted at all: nothing is sent, nothing is queued, and the form keeps what was typed.
  // Refusing here covers every form at once instead of trusting each to disable its own button.
  const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET').toUpperCase();
  const offline = (api.getState() as { connectivity?: { offline: boolean } }).connectivity?.offline === true;
  if (offline && method !== 'GET') {
    return {
      error: {
        code: 'OFFLINE',
        message: "Can't make changes while the server can't be reached. Nothing was sent and what you entered is still here - try again once the banner clears.",
        status: 0,
      },
    };
  }

  const result = await raw(args, api, extraOptions);

  // Connectivity mode watches every request. A response of ANY status means the server is
  // there; only failing to get a response at all counts as unreachable (§6.11).
  const noResponse = result.error?.status === 'FETCH_ERROR' || result.error?.status === 'TIMEOUT_ERROR';
  api.dispatch(noResponse ? serverUnreachable() : serverAnswered());

  if (result.error) {
    const fetchError = result.error as FetchBaseQueryError;
    const problem = fetchError.data as ProblemDetail | undefined;
    const status = typeof fetchError.status === 'number' ? fetchError.status : 0;

    const appError: AppError = {
      code: problem?.code ?? 'NETWORK_ERROR',
      // `detail` is written in the product's voice by the backend - shown as-is.
      message: problem?.detail ?? "We couldn't reach the server. Check your connection.",
      field: problem?.field,
      fix: problem?.fix,
      status,
      traceId: problem?.traceId,
      fieldErrors: problem?.errors,
    };
    return { error: appError };
  }
  return { data: result.data };
};
