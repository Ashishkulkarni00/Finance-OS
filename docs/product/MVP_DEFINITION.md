# MVP Definition

**Goal:** replace the Excel workbook for one real user, without losing a single
capability he depends on, and remove the six failure modes that nearly corrupted it.

**Success test:** he stops opening `Finance.xlsx`. Not because we asked — because the
app is better.

**Timebox:** 6–8 weeks of focused evenings. If it grows beyond that, cut scope, not
quality.

---

## The line

> **In scope:** everything needed to answer *"what can I spend today, and what is coming?"*
> correctly, on a phone, without silent corruption.
>
> **Out of scope:** everything that makes it *smarter*. That is Phase 2, and it needs
> real data first.

---

## MVP scope

### M1 — Accounts *(foundation)*
- Types: Bank, Cash, Credit Card, Loan, Investment
- Per-account opening balance **with its own as-at date and confidence** *(fixes Excel A5)*
- Minimum-balance awareness with penalty flag
- Reservations against an account (emergency fund), with a purpose
- Derived current balance and available balance — never editable *(fixes A2)*

### M2 — Transactions *(the ledger)*
- Five types: Income · Expense · Transfer · Investment · Refund
- Double-entry postings underneath; the user never sees the word *(enforces Principle 9)*
- Amount, date, account, destination account, category, merchant, note
- **Quick-add: under 5 seconds, phone-first, ≤3 taps for a repeat merchant**
- Server-side validation with plain-language messages *(promotes the Excel `Check` column)*
- Search, filter, edit, delete with an audit trail

### M3 — Cycles *(the spine)*
- User-configured pay date; cycles generated forever
- Every transaction resolves to a cycle at query time, never stored by hand *(fixes A1, A7)*
- Cycle summary: in, out, invested, transferred, net, savings rate

### M4 — Commitments *(the engine)*
- `Commitment` (the rule) + `CommitmentInstance` (this cycle's occurrence) — **the split
  Excel could not express**
- Fixed and variable amounts *(fixes B11)*
- Mandatory vs optional; account reference; due day
- Status: Pending · Part paid · Paid · Overdue · **Unverified** · Needs review
- Confirmation **stamped with its cycle, expires automatically** *(fixes A3 — the most
  important single fix in the MVP)*
- Prepaid-in-an-earlier-cycle as a real state
- Auto-match payments by amount + account + date window; manual link as fallback *(B9)*

### M5 — Real Balance & Room *(the product)*
- Real Balance = holdings − reserved − committed
- Room Today = (Real Balance + spent today) ÷ days remaining
- Room Left = Room Today − spent today
- **Refuses to compute when a mandatory amount is unknown** *(Principle 1)*
- Every component tappable down to source transactions *(Principle 2)*

### M6 — Credit cards
- Limit, statement day, due day
- Statement entry (bank's figures stay authoritative)
- Derived outstanding, unbilled, available credit
- **Each purchase shows its actual due date** *(B13)*
- Card payment as settlement, never expense *(P3)*

### M7 — Loans
- Terms, EMI, rate, tenure
- **Generated amortisation schedule** — principal/interest split, payoff date *(B1)*
- Card-billed EMIs flagged so they do not double-count as cash outflow
- Total debt and payoff timeline

### M8 — Per-account projection
- Balance projected to the next pay date, per account
- **"₹6,882 short in IDBI before the 13th"** *(A6 — the novel one)*

### M9 — Timeline
- Every dated obligation, next 30 days, most urgent first
- Sorted, filterable, actionable in place

### M10 — Goals *(light)*
- Target, date, current, required per month, progress
- Emergency fund as a first-class goal linked to a reservation

### M11 — Import
- CSV/XLSX upload with remembered column mapping
- Learned category rules
- **Duplicate detection before commit** *(A4)*
- Staged review; nothing enters the ledger unreviewed

### M12 — Ambient explanation
- Every term and number tappable for a plain-language explanation *(P8, D5)*
- Written for someone with no finance background
- **Not a help centre — in the interface, at the point of confusion**

### M13 — Month close
- Guided flow replacing the 7-item manual checklist
- Snapshot: balances, net worth, debt, savings rate → immutable history *(seeds B3)*

---

## Explicitly NOT in MVP

| Deferred | Why |
|---|---|
| Decision preview | Needs trustworthy baselines. Phase 2. **The hardest cut to make** |
| Insights & baselines | Needs 3+ cycles of data to say anything true |
| Net-worth charts | Snapshot from day one; visualise in Phase 2 |
| Notifications | Needs a reliable server-side cycle engine |
| Bank/AA integration | Phase 4 |
| Authentication, multi-user | Phase 3 — architected for, not built |
| Investment performance | Manual valuation only |
| Budgets per category | Deliberate. Committed vs flexible is the model; per-category budgets may not be needed at all — test before building |
| Native mobile app | Responsive web first |
| Split transactions, merchant enrichment, tags | Not blocking |

---

## Order of build

Each stage should be usable before the next begins.

| Stage | Build | Usable outcome |
|---|---|---|
| 1 | Accounts + Transactions + Cycles | A correct ledger — already beats the app he uses |
| 2 | Commitments + Real Balance + Room | **The product exists.** Excel is replaceable |
| 3 | Cards + Loans + projection | Full parity, plus amortisation Excel never had |
| 4 | Timeline + Goals + month close | The monthly loop closes |
| 5 | Import + explanation + polish | Migration and comprehension |

**Stage 2 is the moment of truth.** If Real Balance is right and takes under two
minutes a day to maintain, everything after is upside.

---

## Definition of done

The MVP ships when, for one real user:

1. Real Balance matches a hand-check against four accounts, three times running
2. Daily maintenance takes **under 2 minutes**
3. No number can be silently corrupted by any user action
4. Every figure traces to source in ≤3 taps
5. A full cycle has been planned, lived, reviewed and closed inside the product
6. **He has not opened the spreadsheet in two weeks**
