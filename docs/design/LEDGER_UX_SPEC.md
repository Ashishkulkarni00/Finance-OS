# Ledger — UX Spec

**Written 2026-09-11.** The *how* for `docs/product/LEDGER_EXPERIENCE.md`. Nothing here
restates the why; read that first. Concept C ("The Ledger") is assumed.

---

## 1. Route, nav, entry

| | |
|---|---|
| Route | `/ledger`, with filter state in the query string |
| Nav | fifth rail item, after Plan. `Receipt` or `List` icon (lucide) |
| Detail | `/ledger/:transactionId` — or a sheet; see §9 |

**Query parameters are the filter state**, not component state. `?cycle=1&category=2`
must fully reconstruct the view, because §4 of the product doc depends on a figure
elsewhere being able to link into an exact slice. Anything not in the URL cannot be
deep-linked to and therefore does not exist for this screen's purpose.

```
/ledger                          current cycle, everything
/ledger?cycle=1&category=2       Dining Out, this cycle
/ledger?account=5&balance=1      IDBI with the running balance on
/ledger?cycle=all&q=drinks       all time, text search
```

---

## 2. Zones

```
┌─────────────────────────────────────────────────────────────┐
│ Zone 1   The stated view — sentence + total                 │
│ Zone 2   Filter chips + search                              │
│ Zone 3   Data-quality strip          (phase 3, conditional) │
│ Zone 4   Day-grouped rows with day subtotals                │
│ Zone 5   Pagination / "older"                               │
└─────────────────────────────────────────────────────────────┘
```

### Zone 1 — the stated view

The screen's reason to exist. Reuses the hero shape from `MonthCrux` and `NetWorthZone`:
micro label, tabular figure, plain sentence.

```
LEDGER
₹5,344
across 9 entries · Dining Out · 28 Aug – 27 Sep
```

- The figure is the **net of the current view**, server-computed (§6). Never a client sum.
- The sentence is generated from the active filters, in plain language — never
  `category=2`. With no filters: *"everything this cycle, across 43 entries."*
- When the view mixes directions (income and expense together), show **money in** and
  **money out** as two figures rather than one misleading net. A single "₹45,000" that is
  secretly `57,700 − 12,700` explains nothing.
- Transfers are **excluded from both** and stated separately: *"· ₹14,375 moved between
  your own accounts"*. This is rule 4 made visible; it is the single most important line
  on the screen for teaching the model.

### Zone 2 — filters

Plain-language chips, each with an × . Left to right: **Cycle · Account · Category ·
Type**, then a search field. A chip shows its value, not its field name — `This cycle`,
`IDBI`, `Dining Out`, `Expenses only`.

- Removing a chip updates the URL and Zone 1's sentence together.
- `All time` is a cycle-chip value, not a separate control (D2).
- Search (D4) is debounced, matches description and merchant, and appears as its own chip
  (`"drinks"`) so it's visibly part of the view rather than a hidden modifier.

### Zone 3 — data-quality strip *(phase 3)*

Rendered only when a check fires. Same component contract as Accounts' `AttentionCard`:
**what is wrong · the figures that make it true · the consequence** — and dismissible.

> **This looks like a cash withdrawal, not a spend**
> 28 Aug · Cash withdrawn for Pune trip · ₹2,000 from HDFC Salary
> Recorded as an expense, so it will count again when you spend the cash. Recording it as
> a transfer to Cash Wallet counts it once, when it's actually spent.
> [ Make it a transfer ]  [ It really was a spend ]

Never more than three at once; a `+n more` link rather than a wall.

### Zone 4 — the rows

Day-grouped. Each group is a band (reuse `GroupBand` from `PlanZone`) carrying the date
and that day's subtotal:

```
SAT 30 AUG                                            −₹3,209 out
  Hadshi — vadapav, moong bhaje   Dining Out · Cash Wallet     −₹300
  Auto fare                       Transport · IDBI             −₹150
  Drinks                          Drinks · IDBI              −₹1,290
```

Rows use `LedgerRow` — the shared grid built for Month and Accounts. Mapping:

| Slot | Content |
|---|---|
| `leading` | type mark: a domain-hue rule; transfers get a distinct ↔ glyph (§4) |
| `primary` | `description` |
| `secondary` | `note` when present — the workbook's corrections, finally rendered — else merchant |
| `meta` | `MetaFacts`: **Category** · **Account** (or `From → To` for a transfer) · **Settled** (what commitment this paid, phase 3) |
| `amount` | signed figure per §9 of the product doc; running balance beneath it when scoped to one account |

Nothing new is invented. The row is the one the user has already learned twice.

### Zone 5 — more

Page size 50 (the backend's `@PageableDefault`). A plain **"Show older"** that appends,
not numbered pages — a ledger is read backwards in time, not navigated by page number.
The day-subtotal bands survive appending because grouping is by date, not by page.

---

## 3. Ordering

**Date descending, most recent first.** Two exceptions, both when a running balance is on:
the balance only reads correctly walking forward, so scoping to a single account with
`balance=1` flips to ascending and says so in the sentence (*"oldest first, so the balance
adds up"*). Sorting by any other column is not offered — see Concept A's rejection; it is
also what broke the workbook's balance.

---

## 4. Type treatment — the thing that must not blur

Five types, three visual classes:

| Class | Types | Treatment |
|---|---|---|
| Out | `EXPENSE` | `−` figure, default ink |
| In | `INCOME`, `REFUND` | `+` figure, `text-positive` |
| Neither | `TRANSFER`, `INVESTMENT` | no sign, `text-ink-muted`, ↔ glyph, `From → To` in meta |

The third class is the whole point. `Credit card bill — ₹6,375` and `EF Transfer — ₹8,000`
must not read as spending, must not join any "out" subtotal, and must be visibly a
different *kind* of row — otherwise the screen teaches the double-count the product exists
to prevent. A day subtotal counts only Out and In; transfers on that day are stated
separately on the band if present.

---

## 5. Empty, loading, error

- **No transactions at all** — `EmptyState`: *"Nothing recorded yet. Add something and it
  shows up here, forever."*
- **Filters match nothing** — different message, and it must name the filters and offer to
  clear them: *"No entries for Dining Out this cycle."* Never the same empty state as
  "you have no data"; those are opposite problems.
- **Loading** — `Skeleton` rows in day groups, not a spinner.
- **Error** — `ErrorState` with retry, matching Accounts.

---

## 6. Backend work

Everything below is a total or a derived figure, so **all of it is server-side** —
`FRONTEND_CONVENTIONS.md` §4, no exceptions for "it's only a subtotal".

**1. Extend the search endpoint.** `GET /transactions` currently takes
`accountId · categoryId · type · dateFrom · dateTo · pageable` (verified). Add:
- `cycleId` — resolve to the cycle's date range server-side. Membership stays derived
  (ADR-0011); this is a convenience over `dateFrom`/`dateTo`, not a stored column.
- `q` — `LIKE` over `description` and `merchant`, case-insensitive (D4).

**2. A view-summary endpoint.** `GET /transactions/summary` taking the *same* filters and
returning:
```java
record TransactionViewSummary(
    BigDecimal moneyIn, BigDecimal moneyOut, BigDecimal transferred,
    BigDecimal net, int entryCount)
```
Zone 1 renders this directly. Separate from the page so paging doesn't change the total —
the totals describe the *view*, not the page, and that distinction is exactly what makes
the justification loop trustworthy.

**3. Day subtotals.** Either a `GROUP BY date` projection alongside the page, or fold them
into the page response. Prefer the former: `List<DaySubtotal(date, moneyIn, moneyOut, transferred)>`.

**4. Running balance** *(phase 3)*. Only valid for `accountId` + ascending + no type
filter — enforce that server-side and return `null` otherwise rather than a wrong number.
Compute as *balance as of the day before the first row on the page*, then walk forward
across the page. That keeps it O(page), not O(history), and stays correct across pages.

**5. Reverse commitment link** *(phase 3)*. `CommitmentInstanceRepository.findByLinkedTransactionIdIn(ids)`
plus a `settled: { instanceId, commitmentName }` field on `TransactionResponse` — the same
batch-lookup shape already used for `settledOn`, one query for the page.

**6. Data-quality checks** *(phase 3)*. Server-side, one classifier, same discipline as
`AttentionTier`: computed in one place so the strip and any future count cannot drift.
Dismissals need a small table (`transaction_id`, `check_code`, `dismissed_at`).

**Not needed:** any new entity for the ledger itself. This screen is a view over data that
already exists — which is why phase 1 is small.

---

## 7. What gets reused, unchanged

Worth listing, because it is most of the screen:

`LedgerRow` + `MetaFacts` (Month, Accounts) · `GroupBand` (PlanZone, for day bands) ·
`SectionHeader` with `rule={false}` where a figure follows · `Amount` for every rupee ·
`AttentionCard`'s three-part contract (Zone 3) · `EmptyState` / `ErrorState` / `Skeleton` ·
`formatShortDate`, `formatPercent`.

New components: a filter-chip row, and a day band that carries a subtotal. That is all.

---

## 8. Linking the rest of the product in *(phase 2)*

| Surface | Becomes |
|---|---|
| `FlexibleSpendingSection` category row | `/ledger?cycle={id}&category={id}` |
| `CashBankRegister` row → account detail | account detail gains "See all in the ledger" → `/ledger?account={id}&balance=1` |
| `NeedsALookZone` "IDBI is overdrawn" | `/ledger?account={id}&cycle={id}` |
| Settled commitment's amount (Month) | `/ledger/{linkedTransactionId}` |
| Today's "spent today" | `/ledger?from=today` |

Each is a link, not a new component. **Phase 2 is where the user's actual request gets
satisfied** — phase 1 only builds the place to land.

---

## 9. Interaction details

- **Row click** opens the transaction (detail page or sheet — decide at build time; a
  sheet keeps the ledger's scroll position, which matters when correcting several rows).
- **Editing** (D3) uses the existing `PATCH /transactions/{id}`. Re-categorising is the
  common case and should take two clicks.
- **Deleting** is soft (ADR-0004) and must warn what it changes — a deleted transaction
  moves a balance.
- **Keyboard:** `/` focuses search, `Esc` clears the focused chip. Rows are already
  `role="button"` with Enter/Space via `LedgerRow`.
- **URL sync** is one-way from state to URL on change, and read on mount — including
  browser back, which must restore the previous view.

---

## 10. Explicitly out of scope

CSV export · charts and trend lines (Plan's job) · arbitrary date ranges outside cycle
boundaries · bulk edit · attachments or receipt photos · tags beyond the existing category
model · any budget or target comparison (`PRODUCT_STRATEGY.md` §5 — compared against your
own history or against nothing).

---

## 11. Definition of done, phase 1

- `/ledger` renders the current cycle, day-grouped, with correct day subtotals from the
  server.
- Zone 1's sentence and figures change with every filter and match the rows shown.
- Money in, money out and transferred are three separate figures — a transfer never
  appears in a spending total anywhere on the screen.
- Every filter round-trips through the URL, including browser back.
- `tsc -b --noEmit` and `vite build` clean; endpoints verified against live data, not
  assumed.
- Postman updated in the same change: extended search params and the summary endpoint,
  with saved examples.
