# Excel → Product Mapping

Source: `G:\Finance\Finance.xlsx` — 13 sheets, ~47 named ranges, 5 tables, built and
used in production by one real user, 06–08 Sep 2026.

Every concept is classified: **KEEP · SIMPLIFY · AUTOMATE · REPLACE · COMBINE · REMOVE · ADD**

---

## Sheet-by-sheet

### `Today` — the 30-second screen

| Excel element | Verdict | In the product |
|---|---|---|
| Bank + cash balance | **KEEP** | Position strip, collapsed by default |
| Reserved (emergency fund) | **KEEP** | First-class `Reservation` entity |
| Unreserved balance | **SIMPLIFY** | Intermediate step; shown only when the user expands |
| Mandatory payments still due | **KEEP** | `Committed` — driven by commitment instances |
| Truly disposable | **KEEP → RENAME** | **Real Balance.** The hero number |
| Days until next salary | **AUTOMATE** | Derived from the cycle; never displayed alone |
| Allowance for today | **KEEP → RENAME** | **Room Today** |
| Spent today (discretionary) | **KEEP** | Live, from today's uncommitted transactions |
| LEFT TO SPEND TODAY | **KEEP → RENAME** | **Room Left** — the number on the home screen |
| Credit-card block (4 lines) | **KEEP** | Card detail; summarised to one line on home |
| Held long term | **SIMPLIFY** | Folds into Net Worth |
| Where the extra went (top 5 over budget) | **REPLACE** | Ranked *variance vs personal baseline*, not vs a static budget |
| Next actions (7 rows) | **KEEP** | Timeline, the product's second-most-used surface |
| Needs attention (8 counters) | **REPLACE** | Inline resolution — each item is fixable in place, not a count to chase |

**The whole sheet is the product's home screen.** It is already correct; it is
constrained only by being a spreadsheet.

---

### `C-Month` — the monthly workspace

| Excel element | Verdict | In the product |
|---|---|---|
| Cycle start / next salary / days left | **AUTOMATE** | `Cycle` entity, generated forever |
| Month summary (9 lines) | **KEEP** | Cycle summary |
| Action Center (14 rows × 15 cols) | **KEEP → SPLIT** | Timeline (dates) + Commitments (rules) |
| `Paid So Far` | **AUTOMATE** | Derived from matched transactions |
| `Status` (7-branch formula) | **KEEP** | Same state machine, server-side. See DOMAIN_MODEL |
| `Confirmed?` manual tick | **REPLACE** | Confirmation carries the cycle it belongs to and expires automatically |
| `_MandDue` / `_Unknown` / `_Sort` | **REMOVE** | Spreadsheet plumbing. Query concerns |
| Planned vs actual, 20 categories | **SIMPLIFY** | Flexible categories only; committed money is not a "budget" |
| Month close checklist (7 items) | **KEEP → AUTOMATE** | Guided month-close flow; most steps disappear |

**Critical fix.** `Confirmed?` is a manual override with no expiry. Seven ticks were
live on 08 Sep that would have hidden **₹22,800** of real obligations when the cycle
rolled on the 28th. In the product, a confirmation is stamped with its cycle and cannot
leak forward. *This single defect justifies the rewrite.*

---

### `Tracker` — the ledger

| Column | Verdict | In the product |
|---|---|---|
| Date, Description, Amount | **KEEP** | Core fields |
| Type (5 values) | **KEEP** | The integrity backbone — see DOMAIN_MODEL §3 |
| Category | **SIMPLIFY** | 14 → ~10, plus learned merchant rules |
| Account / To Account | **KEEP** | Double-entry in disguise; formalised as postings |
| Recurring ID | **AUTOMATE** | Auto-matched by amount + account + date window; manual link is the fallback |
| Notes | **KEEP** | |
| Cycle Start / Cycle | **AUTOMATE** | Computed, indexed, never stored by hand |
| Check (13-branch validation) | **KEEP → ELEVATE** | Becomes schema constraints + a resolution queue |
| 400 pre-built rows | **REMOVE** | An artefact of spreadsheets. Real cause of the P7 failures |

---

### `Imports`

| Element | Verdict | In the product |
|---|---|---|
| Paste block | **REPLACE** | File upload + column mapping, remembered per source |
| Category mapping table | **KEEP → LEARN** | Seeded, then learned from corrections |
| Mode → Account mapping | **KEEP** | Explicit, never inferred *(a deliberate Excel decision worth preserving)* |
| `NEEDS REVIEW` flags | **KEEP** | Review queue |
| Manual copy into Tracker | **REMOVE** | Staged import with a diff preview |
| **Duplicate detection** | **ADD** | Missing in Excel and a known live hazard — overlapping exports double-count silently |

---

### `Accounts`

| Element | Verdict | In the product |
|---|---|---|
| Account list, types | **KEEP** | `Account` with a proper type taxonomy |
| Opening balance + as-at date | **KEEP → PER ACCOUNT** | Excel has one global as-at date for all accounts; this caused a real reconciliation ambiguity. Per-account anchoring fixes it |
| Min balance / MAB mandatory | **KEEP** | Rare elsewhere, genuinely useful in India |
| Reserved | **KEEP → PROMOTE** | Its own entity, so a reserve can have a purpose and a goal link |
| Current balance / Available | **AUTOMATE** | Derived from postings |
| "In cash total?" flag | **SIMPLIFY** | Implied by account type |
| `Unassigned (pre-tracking)` bucket | **KEEP** | Honest handling of history. Becomes a system account |
| **Per-account forward projection** | **ADD** | Solves P10. Excel cannot do it |

---

### `Cards`

| Element | Verdict | In the product |
|---|---|---|
| Limit, statement day, due day | **KEEP** | `CreditCardTerms` |
| Statement log (manual entry) | **KEEP** | The bank's printed figures stay authoritative — correctly conservative |
| Paid so far / outstanding / status | **AUTOMATE** | Derived |
| Purchases since statement | **KEEP** | Unbilled — a genuinely useful concept most apps omit |
| Available credit | **AUTOMATE** | |
| **Statement-cycle attribution** | **ADD** | Show each purchase's actual due date. Excel cannot |

---

### `Loans`

| Element | Verdict | In the product |
|---|---|---|
| EMI, day, account, rate, end date | **KEEP** | |
| EMIs left, remaining payments | **AUTOMATE** | From the schedule |
| Principal outstanding | **AUTOMATE** | **Amortisation schedule** — three loans currently sit at `TBD` because computing this by hand is impractical |
| Confidence column | **KEEP** | Excellent honesty device. Becomes a data-quality badge |
| Paid via bank / card | **KEEP** | Card-billed EMIs must not double-count as cash outflow |
| **Payoff projection, interest-to-date, prepayment simulation** | **ADD** | The highest-value thing Excel cannot do for this user |

---

### `Recurring` — the engine

**KEEP ENTIRELY.** This is the best idea in the workbook. 14 rules generate the whole
month. In the product it becomes `Commitment` (the rule) + `CommitmentInstance` (this
cycle's occurrence) — the split Excel could not express, and the reason `Confirmed?`
leaks across cycles.

Additions: variable-amount commitments (electricity), end dates, pause, and
*"prepaid in an earlier cycle"* as a first-class state — currently handled with a
manual tick and a hand-written note.

---

### `Investments`, `Goals`, `History`

| Element | Verdict | Notes |
|---|---|---|
| Invested vs current value | **KEEP** | Manual valuation is fine for MVP |
| "Not updated" honesty | **KEEP** | |
| Goal target / date / required-per-month | **KEEP** | |
| Progress % | **KEEP** | |
| **Goal funding from real surplus** | **ADD** | Excel's required-per-month is arithmetic (remaining ÷ months); it does not know whether the user can actually afford it |
| History, 24 cycles, formula-driven | **KEEP → EXTEND** | Add net worth, debt, savings rate over time |

---

### `Setup` and `Legend`

| Element | Verdict | Notes |
|---|---|---|
| Salary day, tolerances, budgets | **KEEP** | Becomes user settings |
| Category list | **SIMPLIFY** | |
| **Legend sheet + 61 cell tooltips** | **KEEP → ELEVATE** | Built because the user asked. In the product, explanation is *ambient* — every term is tappable, in place. This is P8, and it is a differentiator |

---

## Concepts worth stealing wholesale

1. **Real Balance** — the entire product thesis
2. **Reserved vs Committed vs Free** — three states of money, not one balance
3. **Salary-cycle months**
4. **Confidence / TBD** — refusing to guess
5. **The five transaction types** — integrity by construction
6. **Commitment rules generating the month**
7. **Unverified as a payment state**
8. **The `Check` column** — validation as a visible, plain-language feature
9. **MAB awareness**
10. **Explanation embedded at the point of confusion**

## Concepts to leave behind

1. Pre-built empty rows · 2. Helper columns · 3. Manual status ticks that never expire ·
4. One global as-at date · 5. Copy-paste import · 6. A single global budget table ·
7. Row-order sensitivity · 8. Manual cross-sheet reconciliation
