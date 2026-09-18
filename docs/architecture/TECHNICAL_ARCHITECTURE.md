# Technical Architecture

**Principle:** build the smallest thing that cannot become the wrong thing.
Prototype-only decisions are marked **[P]**; anything unmarked should survive to production.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Fast iteration; TS is non-negotiable for money |
| Styling | Tailwind + CSS variables for tokens | Tokens in CSS vars so theming is not a rewrite |
| State | **Redux Toolkit + RTK Query** | Redux as specified. RTK Query removes ~40 lines of boilerplate per endpoint and makes the API slices *be* the service layer |
| Routing | React Router | |
| Charts | Recharts | Few charts; not worth D3 |
| Backend | **Java 21 + Spring Boot 4.1.1** | As initialised. Spring Framework 7.0.9, Hibernate 7.4.5, Jackson 3.1.5. See ADR-0013 |
| Persistence | Spring Data JPA / Hibernate | |
| Database | **MySQL 8.0.39** | Verified running locally; schema `finance_planner` |
| Migrations | **Flyway 12.4.0** | Versioned from commit one. Needs `spring-boot-flyway` on Boot 4 — ADR-0013 |
| Testing | JUnit 5 + Mockito + AssertJ · **real local MySQL** | Not H2, and not Testcontainers locally (Docker daemon unavailable). See ADR-0007 |
| Build | Maven wrapper 3.9.16 · npm | `./mvnw` — Maven is not on PATH |

**Deliberately not used in MVP:** Kafka, Redis, microservices, GraphQL, event sourcing,
Kubernetes. A single-user finance app is a modular monolith. Anything else is a
distraction that adds failure modes without adding truth.

---

## 2. Shape

**Actual location:** the Spring Boot project sits at `webapp/backend/finance`
(groupId `com.finance`, artifactId `finance`). The package root is therefore
`com.finance`, not the `in.kosh` proposed during discovery — the initialised project
is the source of truth.

```
webapp/
├── frontend/          React + Vite + TS
│   └── src/
│       ├── features/          money/ transactions/ commitments/ cycles/ debts/ goals/
│       ├── components/        design system primitives
│       ├── lib/               api client, formatting, money helpers
│       └── routes/
├── backend/
│   └── src/main/java/com/finance/
│       ├── account/            IMPLEMENTED (M1)
│       ├── user/  health/      IMPLEMENTED (M1)
│       ├── transaction/  cycle/  commitment/  debt/  card/  goal/   planned
│       ├── common/            money · exception · audit · user · web · config
│       └── config/
└── docs/              product/ · architecture/ · design/
```

**Both convention documents are binding:**
- [BACKEND_CONVENTIONS.md](BACKEND_CONVENTIONS.md) — layering, DTOs, exceptions, error contract
- [FRONTEND_CONVENTIONS.md](FRONTEND_CONVENTIONS.md) — services, Redux, components, money handling

**Package by feature, not by layer.** Each module owns its controller, service,
repository and domain. `transaction` never reaches into `debt`'s repository — it goes
through a service interface. This is what allows a later split, if it is ever needed.

---

## 3. Rules that protect correctness

### Money
- **`DECIMAL(15,2)` in MySQL, `BigDecimal` in Java. Never `double`. Never a float in JSON.**
- Amounts cross the wire as strings: `"6375.00"`
- One `Money` value object; arithmetic goes through it
- `HALF_UP` rounding, applied once, at presentation

### Derived values are never stored
Balances, Real Balance, Room, commitment status, cycle membership — **all computed**.

This is the direct lesson of the spreadsheet: every one of its six failures came from a
value that could be written when it should only ever have been derived. Where a
computation is too slow, cache it with an explicit invalidation key — never persist it
as a column that could drift.

### Postings, not amounts
Every transaction writes ≥2 `Posting` rows summing to zero, in one database transaction.
A balance is `SUM(postings)`. Double-counting becomes arithmetically impossible rather
than merely discouraged.

### Time
- `DATE` for financial dates — a transaction has a date, not an instant
- `TIMESTAMP` UTC for audit fields
- Cycle boundaries computed in the user's timezone **[P: IST hardcoded]**

### Multi-user from day one
Every table carries `user_id`, indexed, in every query — even with one user.
**[P]** A single fixed user id, no auth. Phase 3 adds enforcement, not a migration.

### Audit
`created_at`, `updated_at`, `deleted_at` on every entity. Soft delete only. Financial
records are never hard-deleted.

---

## 4. API

REST, `/api/v1`, JSON. Resource-shaped, with a few genuine computed endpoints.

**Implemented in milestone 1** are marked ✅; the rest are planned.

```
GET  /health                    ✅ liveness + database round-trip
POST /accounts                  ✅ create
GET  /accounts                  ✅ list, paginated, ?includeArchived - derived balances included
GET  /accounts/{id}             ✅ read
PATCH /accounts/{id}            ✅ partial update
POST /accounts/{id}/archive     ✅ archive / unarchive
DELETE /accounts/{id}           ✅ soft delete
POST /categories                ✅ create
GET  /categories                ✅ list, paginated, ?includeArchived
GET  /categories/{id}           ✅ read
PATCH /categories/{id}          ✅ partial update
POST /categories/{id}/archive   ✅ archive / unarchive
DELETE /categories/{id}         ✅ soft delete
POST /transactions               ✅ create (writes postings), Idempotency-Key header
GET  /transactions               ✅ search: ?accountId=&categoryId=&type=&dateFrom=&dateTo=
GET  /transactions/{id}          ✅ read
PATCH /transactions/{id}         ✅ partial update, regenerates postings
DELETE /transactions/{id}        ✅ soft delete
GET  /accounts/{id}/projection      → the shortfall detector
GET  /cycles/current
POST /cycles/{id}/close             writes an immutable snapshot
GET  /commitments
GET  /cycles/{id}/commitment-instances
POST /commitment-instances/{id}/settle
POST /commitment-instances/{id}/confirm       cycle-scoped, cannot leak
GET  /position                      → Real Balance, Room, with full breakdown
GET  /loans/{id}/schedule           generated amortisation
POST /imports                       staged, returns duplicates for review
POST /imports/{id}/commit
```

**`GET /position` returns the breakdown, not just the number.** Principle 2 — traceability —
is an API contract, not a UI nicety.

**Errors** use RFC 7807 `ProblemDetail` plus our extension fields (`code`, `field`,
`fix`, `traceId`). `detail` is shown to the user verbatim, written in the product's voice.

**Full contract: [BACKEND_CONVENTIONS.md](BACKEND_CONVENTIONS.md) §6.**

Note the distinction that matters most here: *"we don't have enough data to compute this"*
is **not** an error. It is a 200 response carrying a state and a list of blockers. See
BACKEND_CONVENTIONS §5.

---

## 5. Correctness testing

Ordinary CRUD tests are not enough here. The test suite must encode the money rules
directly, because these are the failures that actually happened:

| Test | Asserts |
|---|---|
| Card purchase then bill payment | Spending counted **once** |
| Cash withdrawal then cash spend | Counted **once**, at the spend |
| Transfer between own accounts | Neither income nor expense |
| Investment | Not an expense; net worth unchanged |
| Refund | Reduces the original category |
| Confirmation across a cycle roll | **Does not leak** |
| Mandatory commitment with no amount | Real Balance returns `unknown`, never a number |
| Postings | Always sum to zero |
| Amortisation | Σ principal = loan principal, to the paisa |
| Import with overlapping range | Duplicates detected before commit |
| Cycle boundary at the pay date | Transactions land in the right cycle |

**Property-based tests** on the posting invariant: for any random sequence of valid
transactions, every account balance equals the sum of its postings.

---

## 6. Prototype vs production

| Concern | MVP **[P]** | Production |
|---|---|---|
| Auth | None; fixed user | Sessions, Argon2id, MFA optional |
| Transport | HTTP local | HTTPS, HSTS |
| Data at rest | Plain MySQL | Encrypted volume; consider field-level for account identifiers |
| Secrets | `application-local.properties`, **gitignored**; env vars take precedence | Secrets manager |
| Rate limiting | None | Per-user |
| Backups | Local dump script | Automated, tested restores |
| Logging | Console | Structured, **no PII, no amounts** |
| Deployment | Local | Container, single region (India, for DPDP) |

**Security decisions being made now, deliberately:** `user_id` everywhere; no PII in
logs; soft delete; export capability designed in; no third-party analytics that could
see financial data.

**Never in this codebase:** real credentials of any kind, plaintext account numbers
(last 4 only), or any third-party script with access to the DOM containing financial data.

---

## 7. Performance targets

| Operation | Budget |
|---|---|
| `GET /position` | < 200ms |
| Transaction list, 1 cycle | < 150ms |
| Create transaction | < 100ms |
| Amortisation, 60 periods | < 50ms |

At ~1,200 transactions/year per user these are generous. They are recorded so that when
a naive query goes quadratic, it is caught rather than tolerated.

---

## 8. The single most important technical decision

**Derived values are never writable.**

Every failure in the spreadsheet — the invisible EMI, the doubled safe-to-spend, the
leaking confirmations, the double-charged bill — was a stored value that should have
been computed.

The architecture's whole job is to make that class of bug unrepresentable.


---

## 9. Milestone status

| Milestone | Scope | Status |
|---|---|---|
| **M1** | Foundation + Accounts | ✅ **Complete** — verified end to end |
| **M2** | Categories + Transactions + postings + idempotency | ✅ **Complete** — 77 tests green, verified twice |
| M3 | Reservations + Cycles + Commitments | Next |
| M4/5 | Real Balance + Room (`GET /position`) | |
| M6 | Credit cards | |
| M7 | Loans + amortisation | |
| M8 | Per-account projection | |
| M9 | Timeline | |
| M10 | Goals | |
| M11 | Import | |

`Reservation` was scoped to M1 in `MVP_DEFINITION.md` but never built - it now leads M3,
since Real Balance's `held − reserved − committed` needs it and it is otherwise small.

**Architecture decisions** are recorded in [decisions/](decisions/README.md) — 13 ADRs
as of M1, covering money handling, schema ownership, soft deletion, ownership
boundaries, and the Spring Boot 4 consequences that cost real debugging time.
