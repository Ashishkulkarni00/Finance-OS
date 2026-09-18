# Ledger — Improvement Analysis & Plan

**Written 2026-09-12.** Analysis only; nothing implemented. Companion to
`LEDGER_EXPERIENCE.md` (why the Ledger exists) and `LEDGER_UX_SPEC.md` (how it's built).

This responds to a round of product feedback on the Ledger. Several of the requests are
already satisfied by the existing domain model, two would actively break financial
correctness if implemented literally, and three point at real holes that need fixing.
Each is separated below rather than taken at face value.

---

## 1. What the domain model already gets right

Worth stating first, because it constrains everything else.

**Transaction types are behavioural, not cosmetic.** `TransactionType` compiles in three
flags — `requiresDestination`, `requiresCategory`, `countsAsSpending` — and
`PostingFactory` branches on them to produce genuinely different posting shapes:

| Type | Postings | Counts as spending |
|---|---|---|
| `EXPENSE` | one, `−account` | yes — the only type that does |
| `INCOME` / `REFUND` | one, `+account` | no |
| `TRANSFER` / `INVESTMENT` | two, summing to zero | no |

Single-posting types are money crossing the boundary of what's tracked (a merchant, an
employer). Two-posting types move money between accounts the user already owns. That
distinction is the thing that stops money being counted twice, and it's already correct.

**Account types are behavioural too.** `AccountType` carries `spendable` / `asset` /
`liability`. Card and loan balances are negative (money owed), so a `TRANSFER` into one
reduces the debt by exactly the amount transferred. This matters in §3.

---

## 2. Problems found, in severity order

### P1 — Account selection ignores account type *(domain hole, confirmed)*

**Current behaviour.** `TransactionFormFields` passes every non-archived account to
every picker, for every transaction type. The backend's `requireActiveAccount` checks
existence and archived-ness only — no type check anywhere.

**Verified against the running API:** `POST /transactions` with
`type: EXPENSE, accountId: <a LOAN account>` was **accepted** (transaction 50, since
deleted). This is not merely a UI annoyance; the API has the same hole.

**Why it's wrong.** Spending "from" a loan account is meaningless — a loan is a debt you
owe, not a wallet you draw from. It also corrupts the account's balance, and therefore
net worth.

**Fix.** One eligibility rule, expressed once in the domain and reused by both layers:

| Transaction type | Source (`accountId`) | Destination (`toAccountId`) |
|---|---|---|
| `EXPENSE` | BANK · CASH · CREDIT_CARD | — |
| `INCOME` / `REFUND` | BANK · CASH | — |
| `TRANSFER` | BANK · CASH | BANK · CASH · CREDIT_CARD · LOAN · INVESTMENT |
| `INVESTMENT` | BANK · CASH | INVESTMENT |

Two subtleties worth naming:

- **`isSpendable()` is the wrong predicate here.** It means "counts toward Real
  Balance", which excludes `CREDIT_CARD` — but you can obviously spend on a credit card.
  Reusing it would silently ban card spending. This needs its own method
  (`canFundSpending()`), not a borrowed one.
- **`CREDIT_CARD` and `LOAN` must stay valid transfer *destinations*.** Paying a card
  bill is a transfer (the purchase was already counted at swipe — rule 4), and a loan
  prepayment genuinely reduces principal 1:1.

---

### P2 — Categories cannot distinguish income from expense *(domain hole, confirmed)*

**Current behaviour.** `Category` has a name and a `CategoryGroup`
(`FLEXIBLE` / `FIXED` / `EVENT` / `NON_SPEND`) and nothing else. `INCOME` transactions
require a category, so recording a salary means picking from a list of spending
categories.

**Verified against live data:** the category **"Salary Credit" is in the `FLEXIBLE`
group** — an income category filed under discretionary day-to-day spending. The V2
migration seeds fifteen categories and **not one of them is an income category**, despite
`INCOME.requiresCategory()` being `true`.

It isn't corrupting any figure today only because `flexibleSpending` filters on
`type = EXPENSE` as well as group. The moment anyone records an expense against "Salary
Credit", it counts as flexible spending.

**Fix — the smallest correct one.** Add `INCOME` to `CategoryGroup` and seed income
categories (Salary, Freelance, Interest, Other income). Then filter the picker by
transaction type: `INCOME`/`REFUND` offer the income group, `EXPENSE` offers the rest.

*Deliberately not doing:* adding a new `applicability` column. `CategoryGroup` already
exists to group categories and is already carried on every DTO; a second parallel
classification would be two things to keep in sync.

*Deliberately not doing:* renaming the existing groups to the suggested
Essentials/Lifestyle/Financial taxonomy. `FLEXIBLE` is load-bearing — Month's entire
flexible-spending section keys off it, and the committed/flexible split is the product's
core idea. The **labels** can be humanised in the UI without touching the enum.

---

### P3 — EMI handling *(recommend NOT doing what was asked)*

**The request:** add a distinct "Financial Obligation / EMI" transaction type, where an
EMI is recorded as a movement from the bank account to the loan account.

**Why this would be wrong.** `PostingFactory.balancedPair` posts `−amount` to source and
`+amount` to destination. A ₹6,145 EMI transferred to a loan account would reduce the
liability by the full ₹6,145 — but only the principal portion (say ₹4,645) actually
repays the loan; the rest is interest, which is a genuine expense. **The model would
report the debt shrinking faster than it really is**, and overstate net worth every month.

**What the product already does, and why it's better.** An EMI is a `Commitment` (the
rule) generating a `CommitmentInstance` (this month's occurrence). Settling it creates an
`EXPENSE` and explicitly links it to the instance — that flow was built this session and
is verified working. Outstanding principal comes from the loan's own **amortisation
schedule**, not from the account balance, so the principal/interest split is handled by
the one component that actually knows the rate.

This also matches the source workbook's own documented decision: *"Principal vs interest
is deliberately NOT split on each transaction — an EMI is logged as one simple row."*

**Recommendation:** no new transaction type. Instead:
1. Keep EMI as `EXPENSE` + commitment link (already built).
2. **Close the real gap:** there is still no `LoanPayment` write path, so
   `amountRepaid` is permanently ₹0 and loan balances never move. Settling a commitment
   that belongs to a loan should also record a `LoanPayment`. *This is the actual
   missing piece behind the complaint* — the user is noticing that EMIs don't seem to
   affect the loan, and they're right, but the cause is the missing payment record, not
   the transaction type.
3. Treat "EMI" as a **category + commitment**, which is how a salaried person thinks of
   it, not as a fourth kind of money movement.

---

### P4 — Transfers are already correct *(no change needed)*

"₹20,000 from HDFC Salary → Emergency Fund is not an expense, it's a transfer" — agreed,
and `TRANSFER` already exists, already posts a balanced pair, and already
`countsAsSpending() == false`. The only defect is P1: the destination picker offers
ineligible accounts. Fixing P1 fixes this.

---

### P5 — Form and dropdown issues *(UX, real but contained)*

| Issue | Current state | Assessment |
|---|---|---|
| Enter submits instead of advancing | native form behaviour | Real. Needs one form-level roving-focus handler, not per-input `onKeyDown`. Enter on the **last** field should still submit. |
| Browser autocomplete/suggestions | `autoComplete="off"` on `AmountInput` only | Real. Description and name inputs show browser autofill. Set it at form level. |
| Category dropdown not grouped | flat list in `CategorySelect` | Real. Use `<optgroup>` keyed on `CategoryGroup` — zero backend change. |
| Chevron alignment | shared `Select`, absolute-positioned | **Already fixed** this session. One `Select` with `chip`/`field`/`row` variants; `grep` confirms no raw `<select>` remains anywhere. Re-verify the `row` variant against long category names. |
| Five different dropdown implementations | — | **Already fixed.** Standardising further is polish, not repair. |
| Validation quality | zod schemas, field-level messages, values preserved on API error | **Largely already done.** Messages are already plain-language ("Amount must be more than zero"). Gap: no backend field-level mapping for account-type violations (P1). |
| Empty / loading / error states | distinct copy for "no data" vs "filters too narrow"; skeletons; `ErrorState` with retry | **Already done.** No work needed. |
| Delete prominence in Edit | text link + `flex-1` primary Save, with a confirm step | Already close to the requested 80/20. Minor: give Delete a fixed width so the ratio is intentional rather than incidental. |

---

### P6 — Category management *(missing, needs building)*

No UI exists to rename, regroup, or archive a category. Backend already has
`PATCH /categories/{id}`, `POST /{id}/archive`, `/unarchive`, and `DELETE`.

**Recommended behaviour — archive, don't delete.** Deleting a category used by
transactions would orphan them. The backend already supports archive, and
`systemDefined` records provenance without locking the row (ADR-0008).

**Usage count comes free:** `GET /transactions/summary?categoryId=X` already returns
`entryCount` — built this session for the Ledger's stated-view header. So
*"Used by 18 transactions"* needs **no new endpoint**.

---

## 3. What the Ledger should and shouldn't carry

The feedback's core principle — the Ledger answers *"what happened to my money?"* and
shouldn't become a dumping ground — is right, and the existing type system already
enforces it:

- **Shown and counted as spending:** `EXPENSE` only.
- **Shown, never counted as spending:** `TRANSFER`, `INVESTMENT` — visibly a different
  kind of row, stated separately in every total. Hiding them would be worse: money did
  move, and a ledger that omits it can't be reconciled against a bank statement.
- **Never in the Ledger:** loan amortisation internals, commitment *rules*, projections.
  Those belong to Debts, Plan and Month respectively. None are currently leaking in.

The one refinement worth making: an EMI expense should be **visibly recognisable as an
obligation** rather than looking like discretionary spending — via its category and its
commitment link, not a new type or a loud colour.

---

## 4. Implementation plan

### Phase 1 — Domain correctness *(the only phase that touches the backend)*
1. `AccountType.canFundSpending()` — BANK, CASH, CREDIT_CARD.
2. Eligibility validation in `TransactionServiceImpl` for both source and destination,
   returning 422 with a `field` so the form can attach the message to the right input.
3. `CategoryGroup.INCOME` + migration seeding income categories, and re-grouping
   "Salary Credit".
4. Frontend: pickers filter by transaction type using the same rules.

**Migration:** one Flyway script (`V11`). No schema change — an enum value and seed rows.

### Phase 2 — Form UX
Roving Enter-key focus; `autoComplete="off"` at form level; grouped category dropdown
with humanised group labels; backend field errors mapped to inputs.

### Phase 3 — Ledger visual hierarchy
Category as the primary line with account/date secondary; restrained income-green /
expense-ink / transfer-muted already partly in place; verify a 20–50 row scan.

### Phase 4 — Category management
Manage sheet: rename, regroup, archive. Usage count from the existing summary endpoint.
Block delete when in use; offer archive.

### Phase 5 — Polish
Responsive check on the filter bar and row grid; keyboard and ARIA pass on `Select`.

### Phase 6 — Documentation & Postman
Update `LEDGER_UX_SPEC.md` and `DOMAIN_MODEL.md` with the eligibility matrix.
**Postman is materially out of date** — it is missing everything added this session:
`/transactions/summary`, `/transactions/day-subtotals`, `cycleId`/`q` params,
`/cycles/{id}/flexible-spending`, `/position/cash`, all `/investments/*`, the changed
`/loans/summary` shape and V9 loan fields, and `/categories` writes.

---

## 5. Explicitly not doing

- **A new EMI transaction type** — would misreport principal repayment (P3).
- **Renaming `CategoryGroup`'s existing values** — `FLEXIBLE` is load-bearing for Month.
- **Hiding transfers from the Ledger** — a ledger you can't reconcile isn't a ledger.
- **A category-applicability column** — `CategoryGroup` already carries this.
- **Rewriting the dropdown system** — one shared `Select` already exists; it needs
  grouping support, not replacement.
- **Adding filters beyond the current five** — cycle/account/category/type/search already
  answer "where did my money go" and "what happened this month".

---

## 6. Open question for you

**Should `REFUND` share income categories or expense ones?** A refund is money coming
back *against an earlier expense* — arguably it belongs to the category it reverses
(a returned shirt is negative Shopping, not "Other income"). Recommendation: `REFUND`
offers **expense** categories, since that keeps the category's net total truthful.
Flagging rather than assuming, because it affects how refunds appear in Month's
flexible-spending figures.
