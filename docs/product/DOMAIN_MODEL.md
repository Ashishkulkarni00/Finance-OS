# Domain Model

Conceptual model. Not a schema — but close enough that the schema falls out of it.

**Governing rule:** *money integrity is enforced by the shape of the data, not by
validation bolted on afterwards.* If a wrong state is representable, it will eventually
be represented.

---

## 1. The core insight — money has three states, not one

Every existing product models one number: balance. Reality has three:

```
        HELD                    what is physically in accounts
          − RESERVED            deliberately set aside (emergency fund)
          − COMMITTED           promised but not yet paid
        = REAL                  genuinely free
```

`Reservation` and `Commitment` are **first-class entities**, not category tags. That
single decision is the domain model's reason to exist.

---

## 2. Entities

### Identity & configuration
| Entity | Purpose |
|---|---|
| `User` | Owner of everything. Present from day one even in single-user MVP — every table carries `user_id` so Phase 3 is a policy change, not a migration |
| `UserSettings` | Pay day, currency, locale, tolerances, first cycle |

### Money containers
| Entity | Key fields | Notes |
|---|---|---|
| `Account` | type, name, institution, **opening_balance, opening_as_of, opening_confidence** | Per-account anchoring fixes Excel A5 |
| `AccountType` | BANK · CASH · CREDIT_CARD · LOAN · INVESTMENT · SYSTEM | Drives sign conventions and which totals it joins |
| `MinimumBalanceRule` | amount, mandatory, penalty | India-specific, genuinely useful |
| `Reservation` | account, amount, purpose, goal_id? | Money present but not spendable |

`SYSTEM` accounts cover opening balances and pre-tracking history — the honest
equivalent of Excel's `Unassigned (pre 06-Sep)` bucket.

### The ledger
| Entity | Key fields |
|---|---|
| `Transaction` | date, description, type, amount, category, merchant?, note, commitment_instance_id? |
| `Posting` | transaction, account, signed_amount |
| `Category` | name, group (FLEXIBLE / FIXED / EVENT / NON_SPEND), system flag |
| `Merchant` | name, default_category — learned |

**A movement between two of the user's own accounts (`TRANSFER`, `INVESTMENT`) always
posts two entries that sum to zero.** A movement across the boundary of what this
ledger tracks (`INCOME`, `EXPENSE`, `REFUND` - a salary source, a merchant) posts a
single entry; there is nothing on the user's side to balance it against. Double-entry
underneath, for the case where it applies; the user never encounters the term either
way. This is what makes a transfer being mistaken for spending *impossible* rather
than *discouraged* - see the posting table below for the exact shape of each type.

| Type | Postings | Counts as spending? |
|---|---|---|
| `INCOME` | +account | no |
| `EXPENSE` | −account | **yes** |
| `TRANSFER` | −from, +to | no |
| `INVESTMENT` | −from, +investment account | no |
| `REFUND` | +account | negative against its category |

A credit-card purchase is an `EXPENSE` posting against the card account (increasing a
liability). Paying the bill is a `TRANSFER` from bank to card. The same rupee cannot be
counted twice because the postings do not permit it.

### Time
| Entity | Purpose |
|---|---|
| `Cycle` | start_date, end_date, label. Generated from pay day |
| `CycleSnapshot` | Immutable close-of-cycle record: balances, net worth, debt, savings rate |

Cycle membership is **derived at query time** from a transaction's date, never stored
on the row. This is precisely what Excel could not do, and precisely why an inserted
row vanished from every total.

### Commitments — the engine
| Entity | Purpose |
|---|---|
| `Commitment` | The **rule**: name, amount or amount_rule, frequency, due_day, account, mandatory, category, requires_verification, active_from, active_to, **settle_as**, **to_account_id**, **source_type**, **source_id** |
| `CommitmentInstance` | The **occurrence**: commitment, cycle, due_date, expected_amount, status, confirmation |

**This split is the most important structural fix in the product.**

Excel had only the rule, so the manual "Confirmed?" tick had nowhere cycle-specific to
live and leaked forward — seven stale ticks would have hidden ₹22,800 at the next roll.
Here, a confirmation belongs to an instance, an instance belongs to a cycle, and
leakage is structurally impossible.

**Instance status:**

```
PENDING ──pay──► PAID
   │              ▲
   ├──partial──► PART_PAID ──┘
   │
   ├──date passed──► OVERDUE
   ├──requires_verification──► UNVERIFIED ──user confirms──► PAID
   ├──mismatch (amount/account)──► NEEDS_REVIEW
   └──prepaid in earlier cycle──► SETTLED_EARLIER
```

`UNVERIFIED` and `SETTLED_EARLIER` both come from observed reality, not theory.

`SKIPPED` (optional bills only, untouched ones only) releases the money for that one
cycle; it can be undone.

**How a bill is paid (`settle_as`, V16/V17).** A bill is settled by exactly one kind of
entry, and only that kind can settle or auto-match it:

| `settle_as` | Paid by | `to_account_id` | Counts in Real Balance as |
|---|---|---|---|
| `EXPENSE` (default) | an expense from the bill's account (bank, cash or card) | none | committed until paid |
| `TRANSFER` | a transfer to your own account (savings, a goal's account) | required | committed until paid; ignored if the destination is itself spendable |
| `INVESTMENT` | an investment into an INVESTMENT account (SIP, RD) | required | committed until paid |
| `INCOME` | an income entry into a bank/cash account (expected salary) | none | never counted - not spendable until it lands |

A wrong-type entry is refused (`SETTLE_TYPE_MISMATCH`). Paid transfers and investments
show in the cycle as moved / invested, never as spending.

**Expected income (`settle_as = INCOME`).** Salary is a rule too. It is kept out of every
bill total (planned, tiers, categories) and counted on its own:

```
CycleStanding.income = Σ received (income rows settled this cycle - what arrived)
                     + Σ still expected (open income rows)
                     + Σ income entries dated in the cycle that no row claims
```

A received salary replaces its estimate - never both. It auto-matches within ±5 days of
the pay day, also when that falls in the previous cycle, and within ±20% of the amount; one
entry settles it as received (never part-paid), and the difference is a variance. It is
not in Real Balance or the account projection before it lands (deliberately
conservative). Coming up lists it as `INCOME`.

**What a bill follows (`source_type` + `source_id`, V16).** Enter an obligation once:

| `source_type` | Follows | What comes from the source |
|---|---|---|
| `MANUAL` (default) | nothing | everything is the bill's own |
| `LOAN` | a loan | amount (EMI), day, paying account, last payment, `EXPENSE`. A card-paid loan's bill leaves from the card |
| `INVESTMENT` | a holding with a monthly amount and paying account | amount, day, paying account, `INVESTMENT` into the holding's account |
| `GOAL` | a goal kept in an account | only `TRANSFER` into the goal's account; amount and day stay the bill's own |

At most one bill per loan or holding (`SOURCE_ALREADY_LINKED`); a goal may be funded by
several. Editing, archiving or deleting the source re-syncs its bills
(`SourceBillSync`); unpaid occurrences follow, paid ones never change. `LoanResponse` and
`InvestmentResponse` carry `planCommitmentId`. The timeline skips a loan's own EMI when a
bill follows the loan, so it's listed once.

### Debt
| Entity | Purpose |
|---|---|
| `Loan` | principal, rate, tenure, start, emi, lender, paid_via (BANK / CARD) |
| `AmortisationEntry` | period, due_date, principal, interest, closing_balance — **generated** |
| `LoanPayment` | links a transaction to a schedule entry |

Generating the schedule is what turns three `TBD` principal figures into a real net
worth, and enables prepayment simulation later.

### Cards
| Entity | Purpose |
|---|---|
| `CreditCardTerms` | limit, statement_day, due_day, pay_from_account |
| `CardStatement` | statement_date, due_date, total, minimum_due, entered_by_user (soft-deletable, V15) |
| `DebitCard` | bank account, name, network, last four (V15) |

Statement figures are **typed from the bank's statement, not derived** — deliberately
conservative, inherited from Excel. Derived: outstanding, unbilled, available credit,
and each purchase's real due date. Also derived: a statement's paid-since and remaining
(credits on the card after the statement date), its status (paid / due / overdue), and a
pre-fill total for recording a statement (the card's balance at the end of that date).

**A credit card is its own account, not linked to a bank.** A swipe is an expense on the
card the day it happens; paying the bill is a transfer into the card. What's owed on
credit cards is subtracted from Real Balance
(`held − reserved − committed − owed on credit cards`), so the bill payment moves money
from held to the card and Real Balance doesn't move — counted once. `pay_from_account`
is only a suggestion for the payment form.

**A debit card belongs to one bank account** and has no balance: spends on it are
expenses from that account. Nothing is derived from it.

Card EMIs are loans whose pay-from account is the card; they are listed on the card and
paid through its bill, so Coming up shows the card bill, not each EMI.

### Goals & wealth
| Entity | Purpose |
|---|---|
| `Goal` | name, target, target_date, priority, linked reservation/account |
| `GoalContribution` | derived from transactions and reservations |
| `Asset` / `Liability` | net-worth components; loans and cards project in automatically |
| `Valuation` | manual point-in-time value for investments |

Present in MVP but barely surfaced — they exist so Rohit remains reachable later
without a rewrite.

---

## 3. Relationships

```
User
 ├── UserSettings
 ├── Account ──┬── MinimumBalanceRule
 │             ├── Reservation ──► Goal
 │             ├── CreditCardTerms ──► CardStatement
 │             └── Loan ──► AmortisationEntry
 ├── Transaction ──► Posting ──► Account
 │        ├──► Category, Merchant
 │        └──► CommitmentInstance
 ├── Commitment ──► CommitmentInstance ──► Cycle
 ├── Cycle ──► CycleSnapshot
 └── Goal ──► GoalContribution
```

---

## 4. Business rules

**Integrity**
1. Postings for a two-account movement (transfer, investment) sum to zero; a
   single-account movement (income, expense, refund) posts one entry, crossing the
   boundary of what the ledger tracks
2. Amounts are positive; direction lives in the posting sign
3. Derived values are never writable *(fixes Excel A2)*
4. Transfers require two distinct accounts
5. Cycle membership is derived, never stored *(fixes A1, A7)*

**Money semantics**
6. Only `EXPENSE` counts as spending
7. Card payments are transfers
8. Cash withdrawal is a transfer to the Cash account
9. Investments are transfers to an investment account
10. Refunds reduce their original category

**Commitments**
11. A confirmation is valid only for its own cycle *(fixes A3)*
12. `requires_verification` commitments can never auto-reach `PAID`
13. A mandatory instance with an unknown amount blocks Real Balance from computing *(Principle 1)*
14. Optional commitments are never subtracted from Real Balance

**Balances**
15. Balance = opening + Σ postings after `opening_as_of`
16. Available = balance − reservations − mandatory minimum
17. Real Balance = Σ(spendable account balances) − Σ reservations − Σ open mandatory instances

---

## 5. Calculations

```
RealBalance   = Σ balance(spendable accounts)
                − Σ reservations
                − Σ outstanding(open instances in current cycle: mandatory and optional,
                                 not skipped, not INCOME, not transfers into a spendable account)
                − Σ owed on credit cards

optionalCommitted = the optional part of that third line (shown, not subtracted twice).
An optional bill with no amount yet doesn't block the figure; a mandatory one does (INCOMPLETE).

RoomToday     = (RealBalance + spentToday) ÷ daysRemainingInCycle
RoomLeft      = RoomToday − spentToday
```

Adding `spentToday` back keeps the allowance stable through the day — proven in the
Excel and worth preserving exactly.

```
Projection(account, date) = balance(account)
                            − Σ instances hitting that account before date
                            + Σ expected income to that account before date
```

*This is A6 — the shortfall detector, and the thing no competitor has.*

```
The month's shape (GET /cycles/{id}/shape - This Month's first line)
  expectedIn     = CycleStanding.income (received + still expected + unclaimed)
  committed      = this cycle's bills, not skipped, paid as EXPENSE or as a TRANSFER to a card/loan
  plannedSavings = INVESTMENT bills + TRANSFER bills into a non-spendable account
                   (a transfer between two spendable accounts is neither)
  flexible       = expectedIn − committed − plannedSavings
                   (absent when nothing comes in: NO_INCOME; an upper bound while a bill
                    needs an amount: INCOMPLETE)
  spent          = Σ expenses in the cycle linked to no bill − Σ unlinked refunds (≥ 0)
  spentShare     = spent ÷ flexible;  cycleElapsed = days gone ÷ days in cycle
```

```
NetWorth = Σ assets − Σ liabilities   (loans at amortised outstanding, cards at outstanding)
```

---

## 6. Historical data

**Snapshot every cycle close, permanently.** Balances, net worth, debt, savings rate,
category totals.

Rationale: trends cannot be reconstructed reliably from a mutable ledger, and the entire
Phase 2 insight layer depends on trustworthy baselines. Snapshots are immutable —
correcting the past creates an adjustment, never a rewrite.

---

## 7. Prototype vs production

| Decision | MVP | Production |
|---|---|---|
| `user_id` on every table | Present, single value | Enforced by policy/RLS |
| Auth | None | Required |
| Soft delete + audit | Yes from day one | Same |
| Money type | `DECIMAL(15,2)`, never float | Same |
| Currency | INR only, but stored per account | Multi-currency |
| Timezone | IST | Per user |

**Doing `user_id` and soft-delete on day one costs almost nothing now and saves a
migration later.** Everything else marked prototype-only is genuinely deferrable.
