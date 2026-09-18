# Frontend Conventions

**Binding.** Code that violates this document does not merge.

React 18 · Vite · TypeScript (strict) · **Redux Toolkit + RTK Query** · Tailwind.
Functional components and hooks only — no class components anywhere.

---

## 1. State: the decision, and why

You asked for Redux. Redux it is — but **Redux Toolkit with RTK Query**, not hand-written
thunks and reducers for every fetch.

| Approach | Verdict |
|---|---|
| Plain Redux + `createAsyncThunk` per call | Works, familiar if you come from Spring. ~40 lines of boilerplate per endpoint, and you hand-write caching, invalidation and loading flags |
| **RTK Toolkit + RTK Query** ✅ | Still Redux — one store, DevTools, predictable. The API definitions *are* the service layer. Caching, invalidation, `isLoading`/`isError` come free |

**This supersedes TanStack Query + Zustand in `TECHNICAL_ARCHITECTURE.md` §1.**

### The split — and it is strict

| Kind of state | Lives in | Example |
|---|---|---|
| **Server state** | RTK Query cache | accounts, transactions, position, commitments |
| **UI state** | Redux slices | selected cycle, sheet open, filters |
| **Ephemeral** | `useState` | an input's value before submit |

**Server data is never copied into a slice.** The moment you `dispatch(setAccounts(data))`
you own a second copy that will go stale. If a component needs accounts, it calls the hook.

---

## 2. Structure — feature-first, mirroring the backend

```
frontend/src/
├── services/                    ← ALL network access lives here. Nothing else calls the API
│   ├── api/
│   │   ├── baseApi.ts           createApi + baseQuery + tag types
│   │   ├── baseQuery.ts         fetch wrapper, ProblemDetail normalisation
│   │   └── tags.ts
│   ├── accountService.ts        injected endpoints
│   ├── transactionService.ts
│   ├── commitmentService.ts
│   ├── positionService.ts
│   ├── cycleService.ts
│   ├── debtService.ts
│   └── goalService.ts
├── store/
│   ├── index.ts                 configureStore
│   ├── hooks.ts                 typed useAppDispatch / useAppSelector
│   └── slices/                  uiSlice, filterSlice, cycleSlice
├── features/                    feature UI, mirrors backend packages
│   ├── position/  transactions/  commitments/  accounts/  debts/  goals/  cycles/
│   └── <feature>/{components,hooks,types,utils}
├── components/                  design-system primitives, feature-agnostic
├── lib/                         money.ts, dates.ts, format.ts, errors.ts
├── types/                       shared + generated API types
└── routes/
```

**One rule above all others:** `fetch` / `axios` appears in `services/` and **nowhere else**.
A component that fetches is a bug. An ESLint rule enforces this (§13).

---

## 3. The service layer

### Base query — normalises the backend's RFC 7807 errors

```ts
// services/api/baseQuery.ts
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import type { ProblemDetail, AppError } from '@/types/errors';

const raw = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;                        // auth header lands here in Phase 3
  },
});

export const baseQuery: typeof raw = async (args, api, opts) => {
  const result = await raw(args, api, opts);

  if (result.error) {
    const problem = result.error.data as ProblemDetail | undefined;
    const appError: AppError = {
      code: problem?.code ?? 'NETWORK_ERROR',
      // `detail` is written in the product's voice by the backend - show it as-is
      message: problem?.detail ?? "We couldn't reach the server. Check your connection.",
      field: problem?.field,
      fix: problem?.fix,
      status: Number(result.error.status) || 0,
      traceId: problem?.traceId,
    };
    return { error: appError };
  }
  return result;
};
```

Every component therefore sees **one error shape**, already in plain English. No component
ever inspects an HTTP status.

### An API slice per feature

```ts
// services/transactionService.ts
import { baseApi } from './api/baseApi';
import type { TransactionResponse, CreateTransactionRequest, PageResponse } from '@/types/api';

export const transactionService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<PageResponse<TransactionResponse>, TransactionQuery>({
      query: (q) => ({ url: '/transactions', params: q }),
      providesTags: ['Transaction'],
    }),

    createTransaction: build.mutation<TransactionResponse, CreateTransactionRequest>({
      query: (body) => ({
        method: 'POST',
        url: '/transactions',
        body,
        headers: { 'Idempotency-Key': crypto.randomUUID() },   // see BACKEND_CONVENTIONS §12
      }),
      // a spend changes the position, the cycle and the commitment - invalidate all three
      invalidatesTags: ['Transaction', 'Position', 'Cycle', 'CommitmentInstance'],
    }),
  }),
});

export const { useGetTransactionsQuery, useCreateTransactionMutation } = transactionService;
```

**Cache invalidation is the whole game here.** Adding a transaction must make Room Left
recompute — that visible drop is the product's core feedback loop (`USER_JOURNEYS` J2).
Get `invalidatesTags` wrong and the number goes stale, which is worse than a crash.

### Types come from the backend, not from typing

`springdoc-openapi` emits the spec; `openapi-typescript` generates `types/api.ts` into the
build. Hand-written DTO types drift from the backend within weeks — and a drifted money
field is a wrong number on screen.

---

## 4. Money on the frontend — the rules

```ts
// lib/money.ts
export type Money = string;                     // "6375.00" — ALWAYS a string

export function formatMoney(v: Money | null, opts?: { compact?: boolean }): string {
  if (v == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(v));                          // Number() for DISPLAY only
}
```

1. **Money is a `string` end-to-end.** Never `number` in a type, prop or store.
2. **The frontend never does money arithmetic.** No adding, no subtracting, no percentages.
   Every derived figure comes from the server. If a screen needs a total, add an endpoint.
3. `Number()` appears only inside `formatMoney`, for rendering.
4. `en-IN` formatting → **₹1,31,000**, lakh grouping. Anything else reads as a foreign product.
5. `null` renders as `—`, never `₹0`. Unknown and zero are different facts (`Principle 1`).

*Rule 2 is not caution — it is the architecture. Derivation lives server-side so it can
be tested; duplicating it in JS creates a second, untested implementation that will disagree.*

---

## 5. The `INCOMPLETE` state — model it in the types

The position endpoint can legitimately return "we don't know". Make that unrepresentable-as-a-number:

```ts
export type Position =
  | { state: 'OK'; realBalance: Money; roomToday: Money; roomLeft: Money; breakdown: Breakdown }
  | { state: 'INCOMPLETE'; reason: string; blockers: Blocker[] };
```

```tsx
if (position.state === 'INCOMPLETE') {
  return <NeedsANumber reason={position.reason} blockers={position.blockers} />;
}
return <RoomLeft value={position.roomLeft} />;   // TS guarantees roomLeft exists here
```

A discriminated union makes it **impossible to render a number that isn't there.** This is
`Principle 1` enforced by the compiler.

---

## 6. Components

**Functional only. No classes.** The single exception is one `ErrorBoundary`, which React
still requires as a class.

```tsx
interface RoomLeftProps {
  value: Money;
  allowance: Money;
  spentToday: Money;
}

export function RoomLeft({ value, allowance, spentToday }: RoomLeftProps) { ... }
```

**Rules**
- Named function exports. No `React.FC`, no default exports (except route modules)
- Props are a named `interface`, never inlined
- A component either **fetches** (container) or **renders** (presentational) — not both
- Presentational components take data as props and are trivially testable
- Under ~150 lines. Past that, extract
- No business logic. Money rules live on the server; formatting lives in `lib/`

**Three categories**

| Kind | Location | Knows about the domain? |
|---|---|---|
| Primitive | `components/` | No — `Button`, `Card`, `NumberDisplay`, `Sheet` |
| Feature | `features/x/components/` | Yes — `CommitmentRow`, `RoomLeftCard` |
| Layout | `components/layout/` | No |

Custom hooks in `features/x/hooks/` for anything stateful and reusable. Data-fetching hooks
are just the RTK Query hooks — do not wrap them for the sake of wrapping.

---

## 7. UI state slices

Only for genuinely client-side concerns.

```ts
// store/slices/uiSlice.ts
const uiSlice = createSlice({
  name: 'ui',
  initialState: { addSheetOpen: false, selectedCycleId: null as string | null },
  reducers: {
    openAddSheet: (s) => { s.addSheetOpen = true; },
    closeAddSheet: (s) => { s.addSheetOpen = false; },
    selectCycle: (s, a: PayloadAction<string>) => { s.selectedCycleId = a.payload; },
  },
});
```

Typed hooks only — `useAppSelector` / `useAppDispatch`, never the raw ones.
Select narrowly: `useAppSelector(s => s.ui.addSheetOpen)`, never the whole slice.

---

## 8. Forms

**react-hook-form + zod.** Zod schemas mirror the backend's Bean Validation, so the user
gets instant feedback — but **the server remains the authority.** Client validation is a
convenience, never a guarantee.

Server field errors (`field` on `AppError`) map back onto the form via `setError`, so a
422 lands under the right input rather than in a toast.

---

## 9. Every async surface has four states

Never ship a component that only handles success.

```tsx
const { data, isLoading, isError, error } = useGetCommitmentsQuery();

if (isLoading) return <CommitmentsSkeleton />;              // matches final layout
if (isError)   return <ErrorState error={error} onRetry={refetch} />;
if (!data?.length) return <EmptyState kind="commitments" />; // teaches (UX_PRINCIPLES §6)
return <CommitmentList items={data} />;
```

Skeletons, not spinners — **and never a spinner over the hero number.** A number that
flickers to a spinner on every refetch makes the product feel unreliable. Use
`keepPreviousData` on refetch.

---

## 10. Optimistic updates — exactly one place

On `createTransaction`, so Room Left moves the instant the user hits Save. That immediacy
*is* the behaviour-change mechanism.

Everywhere else: wait for the server. Optimism in a financial UI is a way to show someone
a number that turns out to be false.

---

## 11. Routing

React Router, file-mirroring structure, lazy-loaded routes. Five top-level routes matching
`INFORMATION_ARCHITECTURE` §2: `/today` `/month` `/money` `/plan` — and `add` is a sheet
overlaying the current route, **not a route**, so closing it returns you where you were.

---

## 12. Testing

| What | How |
|---|---|
| Primitives | Vitest + RTL, props in / DOM out |
| Feature components | RTL with a mock store and MSW |
| Services | MSW — assert the request shape and cache invalidation |
| Money formatting | Unit tests incl. lakh grouping, null, negatives |
| Journeys | Playwright — J1 glance, J2 capture, J3 settle |

**Mandatory test:** *add a transaction → Room Left decreases by that amount.* That is the
product's core loop; if it silently breaks, nothing else matters.

---

## 13. Enforced by tooling

```jsonc
// .eslintrc — the rules that matter
"no-restricted-imports": ["error", {
  "paths": [{ "name": "axios", "message": "Network access belongs in services/ only." }]
}],
"@typescript-eslint/no-restricted-types": ["error", {
  "types": { "number": "Money must be a string. See FRONTEND_CONVENTIONS §4." }
}]                                    // scoped to money-typed props via naming convention
```

Plus: `tsconfig` `strict: true`, `noUncheckedIndexedAccess: true`; a dependency-cruiser
rule that `features/` may not import from another feature's internals; Prettier.

---

## 14. The three rules that matter most

1. **Network access only in `services/`.** Everything else is a component or a formatter.
2. **Money is a string, and the frontend never calculates it.** Display only.
3. **Cache invalidation is correctness, not performance.** A stale Room Left is a wrong
   number, and a wrong number is worse than an error message.
