/**
 * The backend's RFC 7807 error shape (BACKEND_CONVENTIONS.md §6), and the normalised
 * shape every component actually sees. No component inspects an HTTP status directly.
 */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  field?: string;
  fix?: string | null;
  traceId?: string;
  timestamp?: string;
  errors?: { field: string; message: string }[];
}

export interface AppError {
  code: string;
  message: string;
  field?: string;
  fix?: string | null;
  status: number;
  traceId?: string;
  fieldErrors?: { field: string; message: string }[];
}
