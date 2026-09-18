# Backend Conventions

**Binding.** Code that violates this document does not merge.

Spring Boot 3.2 · Java 17 · MySQL 8. Layered MVC — **Controller → Service → Repository** —
with DTOs at the boundary and entities never leaving the service layer.

---

## 1. The layers, and what each may not do

```
HTTP
 │
 ▼
Controller      HTTP only. No business logic. No entities. No @Transactional.
 │  DTO in / DTO out
 ▼
Mapper          Entity ↔ DTO. Pure. No repository access.
 │
 ▼
Service         Business rules. Transaction boundary. Owns entities.
 │  Entity / domain record
 ▼
Repository      Data access only. Spring Data JPA. No business logic.
 │
 ▼
Entity          JPA. No JSON annotations. Never serialised to HTTP.
```

### Hard rules

| Layer | Must | Must never |
|---|---|---|
| **Controller** | Accept a request DTO, call one service method, return a response DTO with a status | Contain an `if` on business state · touch a repository · return an entity · carry `@Transactional` |
| **Service** | Own `@Transactional` · enforce business rules · throw domain exceptions | Know about HTTP · see `HttpServletRequest` · return a response DTO |
| **Repository** | Declare queries | Contain logic beyond a query · be called from a controller |
| **Entity** | Model persistence | Carry `@JsonProperty` · be returned from a controller · hold derived money values |
| **DTO** | Be flat, validated, immutable (`record`) | Contain JPA annotations · contain logic |

**The one-sentence test:** if you deleted the REST layer and drove the app from a CLI,
the services would still work unchanged.

---

## 2. Package structure — feature first, layers inside

```
in.kosh
├── transaction
│   ├── TransactionController.java
│   ├── TransactionService.java          interface
│   ├── TransactionServiceImpl.java
│   ├── TransactionRepository.java
│   ├── TransactionMapper.java
│   ├── domain/     Transaction.java  Posting.java  TransactionType.java
│   ├── dto/        CreateTransactionRequest.java  TransactionResponse.java
│   └── exception/  TransactionNotFoundException.java
├── account/ · cycle/ · commitment/ · debt/ · card/ · goal/ · position/
├── common/
│   ├── exception/  KoshException.java  GlobalExceptionHandler.java  ErrorCode.java
│   ├── money/      Money.java  MoneySerializer.java
│   ├── audit/      AuditableEntity.java
│   ├── web/        PageResponse.java
│   ├── idempotency/ IdempotencyKey.java  IdempotencyKeyRepository.java  IdempotencyService.java
│   └── validation/ custom constraints
└── config/
```

**Cross-feature calls go through the service interface, never the repository.**
`CommitmentService` may call `TransactionService`. It may not touch `TransactionRepository`.

---

## 3. DTOs

Java `record`s. Three kinds, and never reuse one for another purpose.

```java
// REQUEST — what the client may send
public record CreateTransactionRequest(
    @NotNull            LocalDate date,
    @NotBlank @Size(max = 200) String description,
    @NotNull            TransactionType type,
    @NotNull @Positive  BigDecimal amount,
    @NotNull            Long accountId,
                        Long toAccountId,
                        Long categoryId,
                        Long commitmentInstanceId,
    @Size(max = 500)    String note
) {}

// RESPONSE — what we choose to expose
public record TransactionResponse(
    Long id,
    LocalDate date,
    String description,
    TransactionType type,
    BigDecimal amount,          // serialised as a STRING - see §4
    AccountSummary account,
    AccountSummary toAccount,
    CategorySummary category,
    String cycleLabel,
    Instant createdAt
) {}

// SUMMARY — a nested reference, never the full entity
public record AccountSummary(Long id, String name, AccountType type) {}
```

**Rules**
- **Never expose an entity.** Not once, not "just for this endpoint."
- No `Optional` in DTO fields — use `null` and document it.
- No entity graphs in responses. Nest a `*Summary`, or return an id.
- Request and response DTOs are separate types even when identical today.
- Ids are `Long` internally; **exposed as opaque strings from Phase 3** so they can become
  ULIDs without an API break.

### Mapping

**Manual mappers.** Not MapStruct.

```java
@Component
public class TransactionMapper {
    public TransactionResponse toResponse(Transaction t) { ... }
    public Transaction toEntity(CreateTransactionRequest r, Account acc, Category cat) { ... }
}
```

*Why manual:* money and postings need deliberate handling, the mapping count is small
(~10 features), and generated mappers hide exactly the kind of silent field-drop that
would corrupt a balance. Revisit if mappers exceed ~40 methods.

---

## 4. Money — the rules that override everything else

```java
// Entity
@Column(precision = 15, scale = 2, nullable = false)
private BigDecimal amount;

// JSON  →  "6375.00", a STRING, always
@JsonSerialize(using = MoneySerializer.class)
private BigDecimal amount;
```

1. **`BigDecimal` everywhere. `double`/`float` are banned in any package touching money.**
2. **Serialised as a JSON string.** `6375.00` as a JSON number becomes a JS float and
   eventually loses a paisa. Non-negotiable.
3. `DECIMAL(15,2)` in MySQL.
4. Amounts are always **positive**; direction lives in the posting sign.
5. Rounding `HALF_UP`, applied **once**, at presentation.
6. Never compare with `equals()` — use `compareTo() == 0`.

A checkstyle/ArchUnit rule enforces #1.

---

## 5. Exceptions

### Hierarchy

```java
public abstract class KoshException extends RuntimeException {
    private final ErrorCode code;
    private final String field;     // nullable
    private final String fix;       // nullable - a route the user can act on
}

ResourceNotFoundException      → 404
ValidationException            → 400   malformed input
BusinessRuleException          → 422   well-formed but not allowed
ConflictException              → 409   version conflict, duplicate
IdempotencyConflictException   → 409
```

### Domain exceptions carry their meaning

```java
public class PostingsDoNotBalanceException extends BusinessRuleException {
    public PostingsDoNotBalanceException(BigDecimal delta) {
        super(ErrorCode.POSTINGS_UNBALANCED,
              "This transaction doesn't balance. Please try again.",
              null, null);
        log.error("Postings unbalanced by {}", delta);   // detail to logs, not the user
    }
}
```

**Split the audience.** The user gets a plain sentence. The log gets the diagnostic.

### `ErrorCode` is an enum, not a string

```java
public enum ErrorCode {
    ACCOUNT_NOT_FOUND, TRANSACTION_NOT_FOUND,
    TRANSFER_SAME_ACCOUNT, POSTINGS_UNBALANCED,
    COMMITMENT_AMOUNT_UNKNOWN, CONFIRMATION_WRONG_CYCLE,
    DUPLICATE_IMPORT_ROW, OPTIMISTIC_LOCK, IDEMPOTENCY_CONFLICT
}
```

The frontend switches on `code`, never on `message`. Messages are copy and will change.

### ⚠ "We don't know" is **not** an exception

`Principle 1` says the product must refuse to show a number when data is incomplete.
That is a **valid 200 response with a state**, not an error:

```json
{ "state": "INCOMPLETE",
  "realBalance": null,
  "reason": "One mandatory commitment has no amount set.",
  "blockers": [ { "commitmentId": 9, "name": "Electricity", "fix": "/commitments/9" } ] }
```

Throwing here would be wrong — nothing failed. This distinction is easy to get wrong and
it is central to the product.

---

## 6. Error responses — RFC 7807 + extensions

Spring Boot 3's `ProblemDetail`, plus our fields. **This supersedes the ad-hoc shape in
`TECHNICAL_ARCHITECTURE.md` §4.**

```json
{
  "type": "https://kosh.in/errors/transfer-same-account",
  "title": "Cannot transfer to the same account",
  "status": 422,
  "detail": "Money can't move from HDFC Salary to itself. Pick a different destination.",
  "instance": "/api/v1/transactions",
  "code": "TRANSFER_SAME_ACCOUNT",
  "field": "toAccountId",
  "fix": null,
  "traceId": "01J8XQ2M4K",
  "timestamp": "2026-09-08T22:41:03Z"
}
```

`detail` is shown to the user **verbatim** — so it is written in the product's voice
(`UX_PRINCIPLES` §7), not developer English.

### One handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(KoshException.class)
    ProblemDetail onKosh(KoshException ex, HttpServletRequest req) { ... }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail onBeanValidation(...) { ... }   // → 400, with per-field errors

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ProblemDetail onConcurrentEdit(...) { ... }   // → 409

    @ExceptionHandler(Exception.class)
    ProblemDetail onUnexpected(Exception ex, HttpServletRequest req) {
        log.error("Unhandled", ex);
        // NEVER leak the stack trace or message to the client
        return problem(500, "Something went wrong", "We couldn't complete that. Please try again.");
    }
}
```

Field errors on validation failures:

```json
{ "status": 400, "code": "VALIDATION_FAILED",
  "errors": [ { "field": "amount", "message": "Amount must be more than zero" } ] }
```

**No controller contains a try/catch for business errors.** Ever.

---

## 7. Success responses

**No universal `ApiResponse<T>` wrapper.** HTTP status carries the outcome; a wrapper
adds a layer of noise to every payload and every frontend type.

| Case | Status | Body |
|---|---|---|
| Get one | 200 | the DTO, bare |
| Create | 201 + `Location` | the created DTO |
| Update | 200 | the updated DTO |
| Delete (soft) | 204 | empty |
| List | 200 | `PageResponse<T>` |

```java
public record PageResponse<T>(
    List<T> content, int page, int size, long totalElements, int totalPages, boolean last
) {}
```

*This is a reversible decision — if the frontend ends up wanting a uniform envelope, it
is one class and one advice. I recommend against it.*

---

## 8. Controllers

```java
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService service;
    private final TransactionMapper mapper;

    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @Valid @RequestBody CreateTransactionRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idemKey) {

        Transaction created = service.create(request, idemKey);
        TransactionResponse body = mapper.toResponse(created);
        return ResponseEntity
                .created(URI.create("/api/v1/transactions/" + created.getId()))
                .body(body);
    }

    @GetMapping
    public PageResponse<TransactionResponse> list(@Valid TransactionQuery query, Pageable pageable) {
        return mapper.toPage(service.search(query, pageable));
    }
}
```

Note what is absent: no try/catch, no `if`, no repository, no `@Transactional`,
no entity in a signature.

---

## 9. Services

```java
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository repository;
    private final AccountRepository accountRepository;
    private final PostingFactory postingFactory;
    private final CycleService cycleService;

    @Override
    @Transactional
    public Transaction create(CreateTransactionRequest request, String idempotencyKey) {

        Account account = accountRepository.findByIdAndUserId(request.accountId(), currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.ACCOUNT_NOT_FOUND,
                        "That account no longer exists.", "accountId"));

        // business rules live HERE, not in the controller
        if (request.type().requiresDestination() && request.toAccountId() == null) {
            throw new BusinessRuleException(ErrorCode.DESTINATION_REQUIRED,
                    "Where did the money go? A transfer needs a destination account.", "toAccountId");
        }
        if (Objects.equals(request.accountId(), request.toAccountId())) {
            throw new BusinessRuleException(ErrorCode.TRANSFER_SAME_ACCOUNT,
                    "Money can't move from an account to itself.", "toAccountId");
        }

        Transaction tx = ...;
        tx.setPostings(postingFactory.build(tx));      // enforces sum == 0
        return repository.save(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Transaction> search(TransactionQuery q, Pageable p) { ... }
}
```

**Rules**
- Interface + `Impl`. Keeps controllers testable and the boundary explicit.
- `@Transactional` **only here**. `readOnly = true` on every read path.
- One public method = one use case = one transaction.
- Never call another `@Transactional` method on `this` — self-invocation bypasses the proxy.
- Constructor injection only. No `@Autowired` fields.

---

## 10. Repositories

```java
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    @Query("""
        select t from Transaction t
        where t.userId = :userId and t.date between :from and :to
        order by t.date desc, t.id desc
        """)
    Page<Transaction> findInCycle(Long userId, LocalDate from, LocalDate to, Pageable pageable);
}
```

- **Every query filters by `userId`.** No exceptions, even with one user. This is the
  Phase 3 isolation guarantee, established now.
- Derived-name queries up to ~3 conditions; `@Query` beyond that.
- Projections for read-heavy aggregates rather than loading entities.
- `@EntityGraph` for deliberate fetching. **No `EAGER` associations, anywhere.**

---

## 11. Validation — two layers, different questions

| Layer | Question | Mechanism | On failure |
|---|---|---|---|
| DTO | *Is this well-formed?* | Bean Validation | 400 |
| Service | *Is this allowed?* | Explicit checks | 422 |

`@NotNull`, `@Positive`, `@Size` belong on the DTO. *"You can't transfer to the same
account"* and *"a confirmation can't belong to a different cycle"* belong in the service —
they need state to evaluate.

Domain invariants (postings sum to zero) are additionally enforced in the entity/factory,
so they hold even for a code path that forgets to ask.

---

## 12. Financial-specific concerns

### Idempotency — required on writes
A double-tapped Save must not create two transactions.

`POST` accepts `Idempotency-Key`; the key + user + request hash is stored for 24h and the
original response replayed on repeat. A same-key-different-body request is a `409`.

### Optimistic locking
`@Version` on every mutable financial entity → `OptimisticLockingFailureException` → 409
*"This changed in another tab. Reload and try again."*

### Audit
```java
@MappedSuperclass
public abstract class AuditableEntity {
    @CreatedDate  Instant createdAt;
    @LastModifiedDate Instant updatedAt;
    Instant deletedAt;          // soft delete only
    @Version Long version;
}
```
**Financial records are never hard-deleted.**

### Logging
- Structured JSON, `traceId` on every request
- **Never log an amount, account number, or description.** Log ids and error codes
- `INFO` for state changes, `WARN` for business-rule rejections, `ERROR` for unexpected only

---

## 13. Testing per layer

| Layer | Type | Tool |
|---|---|---|
| Controller | Slice, mocked service | `@WebMvcTest` + MockMvc |
| Service | Unit, mocked repos | JUnit 5 + Mockito |
| Repository | Integration, real MySQL | `@DataJpaTest` + **Testcontainers** |
| Money rules | Integration | Full context + Testcontainers |
| Invariants | Property-based | jqwik |

**No H2.** It disagrees with MySQL on decimals, dates and locking — precisely where this
app is sensitive.

Controller tests must assert the **error contract**, not just the happy path: given a
service that throws `BusinessRuleException`, the response is 422 with the right `code`.

---

## 14. Enforced automatically

ArchUnit tests in the build:

```java
noClasses().that().resideInAPackage("..controller..")
    .should().dependOnClassesThat().resideInAPackage("..repository..");

noClasses().that().resideInAPackage("..controller..")
    .should().beAnnotatedWith(Transactional.class);

noMethods().that().areDeclaredInClassesThat().resideInAPackage("..controller..")
    .should().haveRawReturnType(resideInAPackage("..domain.."));

noClasses().that().resideInAPackage("in.kosh..")
    .should().dependOnClassesThat().haveFullyQualifiedName("java.lang.Double");
```

**A layering violation fails the build.** Conventions that rely on memory decay by month three.
