# The Ledger Experience

**Written 2026-09-11.** Product concept for a **Ledger** tab — the one screen Kosh
doesn't have. Same process as `MONTH_EXPERIENCE.md` and `ACCOUNTS_EXPERIENCE.md`:
written before implementation, to be agreed first. Companion: `docs/design/LEDGER_UX_SPEC.md`.

The request that prompted it: *"a page where all the expenses are listed for the user and
he should be able to see and track, so that he will get the justification for the numbers
being affected."*

---

## 1. The second half of that sentence is the whole brief

"A page where expenses are listed" describes every expense tracker ever shipped. It is
not, on its own, worth building — `PRODUCT_STRATEGY.md` §2 is explicit that a list of what
happened is the rung of the ladder we are trying to climb *off*.

**"So that he will get the justification for the numbers"** is the actual requirement, and
it is a different product. Kosh currently asserts a lot of figures:

> ₹20,657 free for the rest of this cycle · ₹11,583 flexible spending · ₹5,344 Dining Out ·
> ₹62,657 in bank and cash · IDBI is overdrawn

Every one of those is derived, server-side, correctly — and **none of them can be opened.**
The user is asked to trust a number with no way to see what it's made of. That is the gap.
Not "we have no transaction list"; *"our numbers have no evidence layer."*

So the design test for this screen is not "can you browse your spending". It is:

> **Can every figure in the product be clicked, landing here, already filtered, with a
> sentence at the top that says what you're looking at and what it adds up to?**

Build it for browsing and you get a tracker. Build it for provenance and you get the thing
that makes the other four screens trustworthy.

---

## 2. Two things it must not be called, and why that matters

**Not "Expenses."** The source workbook's own ledger contains `Salary` (Income), `Credit
card bill – Aug Statement` (Transfer), and `EF Transfer` (Transfer). Filing those under
"expenses" is precisely the double-count the product forbids — rule 4, *money is never
counted twice*: a card bill payment is a transfer, not a second expense, because the
purchases were already counted when they were swiped. A screen named "Expenses" that lists
transfers teaches the user the wrong model on sight.

**Not "Transactions."** Accurate, and the word a developer reaches for. But it names the
storage, not the job. The workbook's own header is better than either:

> *"One ledger, forever. Never split it by month — the Cycle column does that."*

**Recommendation: "Ledger."** One more nav item, making five. It is a real word for a real
thing, it is honest about containing income and transfers, and it signals permanence — this
is the record, not a feed. (Open decision D1 if you'd rather it were "Activity".)

---

## 3. What the workbook already gets right, and what it can't do

Its columns, mapped against what we hold today:

| Excel column | Kosh today | Gap |
|---|---|---|
| Date | `transaction.date` | — |
| Description | `description` | — |
| Type | `type` (5 types) | — |
| Category | `category` | — |
| Amount | `amount` | — |
| Account | `account` | — |
| To Account | `toAccount` | — |
| **Recurring ID** | link exists **one-way only** | `CommitmentInstance.linkedTransactionId` points at the transaction; the transaction cannot name the commitment it settled |
| **Notes** | `note`, `merchant` | **both columns exist and have never been rendered anywhere in the UI** |
| Cycle Start / Cycle | derived at query time | no cycle filter, no cycle label on a row |
| **Check** | — | does not exist; §5 turns it into something real |

Two findings worth stating plainly. First, `note` and `merchant` are already stored and
already dead — every row in the workbook that carries a correction has a Kosh column
waiting for it. Second, the commitment link runs the wrong way for this screen: an instance
knows its transaction, a transaction does not know its instance.

**What a grid structurally cannot do**, and this screen should:

1. **Be entered from a number.** A cell can't be a link. A URL can: `/ledger?category=2&cycle=1`
   arriving pre-filtered *is* the justification the request asks for.
2. **Keep a running balance that survives sorting.** The workbook's balance logic is a
   formula that breaks the moment rows are re-sorted — one of the six near-corruptions in
   the origin story. Computed server-side against an ordered query, it can't break.
3. **Check itself.** The workbook's Notes column is doing data-quality work *by hand*
   (§5). Those are rules, and rules can run.
4. **Answer "what did this row settle?"** — "R04" means nothing in six months; "Education
   loan EMI, Sep" does.

---

## 4. The justification loop

The feature that earns the screen. Every derived figure elsewhere becomes a link into a
pre-filtered ledger, and the ledger header states, in words, what you are looking at:

```
Month · flexible spending · Dining Out ₹5,344   ─────▶   /ledger?category=2&cycle=1

   ₹5,344 across 9 entries · Dining Out · this cycle
```

The sentence is the deliverable. It restates the number you clicked, proves it's the same
number, and lists what makes it up. Applied across the product:

| From | Lands on |
|---|---|
| Month → a flexible-spending category | that category, this cycle |
| Month → a settled commitment's amount | the transaction that settled it |
| Accounts → an account row | that account, running balance on |
| Accounts → "IDBI is overdrawn" | that account, this cycle, so you can see what drew it down |
| Today → spent today | today, all accounts |
| Plan → a goal's contributions | that goal's linked transfers |

Nothing here needs a new concept. It needs the existing figures to become anchors, and one
screen worth landing on. **This is why the ledger is built last and not first** — it is the
floor under four screens that already exist, not a fifth silo.

---

## 5. The Check column, made real

The workbook's Notes are not annotations. They are a person doing data-quality review with
no tooling:

> *"Logged in the app as a Travel expense. From now on a withdrawal is a Transfer to Cash Wallet."*
> *"App had this under Mobile recharge — corrected to Drinks."*
> *"Uncategorised in the source file."*
> *"Given to mother from the 25,000 cash… Recurring R13 tracks putting it back."*

Each is a rule we can run continuously:

1. **A withdrawal recorded as an expense.** `28-Aug — Cash withdrawn for Pune trip — Expense —
   ₹2,000`. The money did not leave your net worth; it moved to your wallet, and it will be
   counted *again* when it's spent. This is rule 4's exact failure mode, sitting in the data,
   with the user's own note admitting it. **The highest-value check on the list.**
2. **Uncategorised spending** — an expense with no category, which quietly vanishes from
   every category breakdown while still hitting the totals.
3. **Rows on a placeholder account** — the workbook's `Unassigned (pre 06-Sep)`: real for
   spending analysis, never touching a balance. Worth surfacing as "these don't affect any
   account" rather than silently mixing them in.
4. **Possible duplicate** — same day, same account, same amount, same description.
5. **A card bill recorded as an expense** rather than a transfer — double-counts the whole
   statement.

**Rules of engagement**, non-negotiable:
- Advisory only. Never auto-correct, never re-type a row on the user's behalf.
- Never judgemental (rule 8). *"This looks like a withdrawal — want it recorded as a
  transfer instead?"* Not *"you categorised this wrong."*
- Dismissible, and dismissal sticks. A user who says "no, that really was an expense" must
  not be asked twice.
- Each check states **the consequence**, not just the observation — the same discipline
  just applied to Accounts' attention cards: what's wrong, the figures that make it true,
  and what happens if it's left.

This is `PRODUCT_STRATEGY.md`'s reconciliation ambition arriving through the back door, and
considerably cheaper than the full "does your bank agree?" flow.

---

## 6. Concept exploration

### Concept A — "The Filtered Table"
A dense data grid: sortable headers, a filter control per column, CSV export.
*Strength:* powerful, familiar to a spreadsheet user, cheap.
*Rejected as the spine.* It is a reporting tool — it answers questions you already know how
to ask, and puts all the work on the user. It also re-creates the workbook's real failure:
the person, not the software, does the thinking. Column-sorting is exactly what broke the
running balance in the first place.

### Concept B — "The Feed"
Reverse-chronological cards grouped by day, infinite scroll, search on top. The shape every
banking app uses.
*Strength:* instantly legible, good on a phone, no learning curve.
*Rejected as the spine.* A feed is designed to be scrolled, not interrogated. No totals, no
provenance, no way to land on it from a figure — it fails the §1 test completely. Its day
grouping is worth stealing, though.

### Concept C — "The Ledger" *(chosen)*
A stated view, then the evidence. Structure:
1. **A sentence and a total** — what you are looking at, and what it comes to. Always
   present, changes with the filters, and is the thing a deep link populates.
2. **Filters as plain-language chips** — "this cycle", "Dining Out", "IDBI" — removable,
   reflected in the URL so a view is shareable and bookmarkable.
3. **Day-grouped rows with a day subtotal** (from Concept B), because that is how the
   workbook already reads and how people remember spending.
4. **A running balance column** that appears only when scoped to a single account — the one
   condition under which it means anything.
5. **A quiet data-quality strip** when a check fires (§5).

*Why it wins:* it is the only one of the three that can be **arrived at** rather than
browsed. It reuses patterns the user has already learned — a stated figure with its
workings beneath it (`Statement`), day grouping, attention cards that explain themselves —
so it costs nothing new to understand. And it keeps the workbook's best instinct, *one
ledger forever*, while making "which slice am I looking at" an explicit, visible answer
instead of a mental note.

---

## 7. What belongs here, and what doesn't

**Filter rule**, same shape as Month's and Accounts':
> If the question is *"which specific movements produced this number?"*, it belongs here.
> If it's *"what should I do?"*, it belongs on Today, Month or Plan.

**Here:** every transaction of every type · what each row settled · notes and merchant ·
running balance for one account · totals for the current view · data-quality checks ·
editing a row that was recorded wrong.

**Not here:** budgets or targets (no such concept, deliberately) · advice on spending less
(rule 8) · commitment scheduling (Plan) · a second copy of the cycle verdict (Month).

**One deliberate overlap.** `AccountDetailPage` already lists an account's recent
transactions via `useGetTransactionsQuery({ accountId })`. That stays — a detail page
showing its own last few rows is right. It gains a "See all in the ledger" link rather than
growing filters of its own.

---

## 8. Jobs to be done

**Primary**
- Where did this number come from? *(the justification loop, §4)*
- What did I actually spend on, in this cycle?
- What happened on this account, and does the balance walk make sense?
- I recorded something wrong — let me fix it.

**Secondary**
- Find that one charge I half-remember.
- Which of these rows was a real bill versus me moving my own money?
- Is anything in my records untrustworthy? *(§5)*

**Explicitly not the Ledger's job**
- Should I spend this? → Today
- Am I on track this cycle? → Month
- What do I hold? → Accounts
- Am I improving? → Plan

---

## 9. Sign convention — a decision, not a detail

The workbook stores every amount positive and lets the Type column carry direction. On
screen that scans badly: a column of positive numbers where some are money in and some are
money out forces the eye to read two columns to understand one.

**Proposal:** render direction in the figure — `−₹745` for an expense, `+₹57,700` for
income, and transfers in a neutral treatment with neither sign, because a transfer is not a
gain or a loss, it is the same money in a different pocket.

This is **notation, not arithmetic** — no addition happens, the stored amount is untouched,
and it is the same licence `StatementRow`'s `deduct` already takes. Worth stating explicitly
so nobody later "fixes" it into a client-side negation of stored money.

---

## 10. Honest gaps this screen will expose

Good — a screen that reveals real problems is doing its job. But they should be expected
rather than discovered in a screenshot:

- **`Drinks` has no equivalent category.** The workbook's busiest line by row count has no
  home in our seeded categories; those rows would land in Dining Out or uncategorised.
  A category-management surface is missing product-wide.
- **The workbook's categories include transfer-shaped ones** (`Card Payment`, `Account
  Transfer`) that our model expresses as a *type*, not a category. Correct as designed, but
  an import would need mapping.
- **Nothing links a Loan to the commitment that pays it** (found while building Accounts) —
  so a ledger row settling an EMI can name the commitment but not the loan.
- **No `LoanPayment` write path**, so EMI rows in the ledger won't move any loan's repaid
  figure. Long-standing, tracked, unchanged by this work.

---

## 11. Open decisions

**D1 — Nav name.** "Ledger" *(recommended)* · "Activity" · "Transactions".

**D2 — Default scope on open.** Current cycle *(recommended)* · everything. "One ledger
forever" is the storage model; opening on 400 rows is not a starting point. An explicit
"all time" chip stays one click away.

**D3 — Editing.** Read-only with a detail page · **inline edit via the existing
`PATCH /transactions/{id}` (recommended)**. Half the workbook's Notes are corrections; a
ledger you can't correct just moves the problem. Soft-delete and audit already exist.

**D4 — Description search.** Add a `q` parameter (a `LIKE` over description/merchant) or
rely on filters alone. *Recommended: add it* — it's how anyone actually finds "that drinks
charge", and it's a few lines.

**D5 — Data-quality checks in phase 1, or later?** *Recommended: later (phase 3).* The
justification loop is the point; checks are the payoff once rows are on screen. Sequencing
them second keeps phase 1 genuinely shippable.

---

## 12. Build order

**Phase 1 — the ledger exists and can be linked to.**
Cycle filter + view totals server-side · day grouping with subtotals · the stated-view
sentence · filter chips reflected in the URL · nav entry. Ships alone and is useful alone.

**Phase 2 — the justification loop.**
Turn existing figures into links: Month's flexible categories, Accounts' rows and attention
cards, Today's spent-today, settled commitments. Cheap once phase 1 exists; this is where
the request is actually satisfied.

**Phase 3 — provenance and trust.**
Reverse commitment link (what did this row settle) · `note`/`merchant` finally rendered ·
running balance for a single account · the §5 checks.

**Phase 4 — correction.**
Inline edit, re-categorise, dismissals that stick.

Deliberately excluded from all four: CSV export, custom date ranges beyond cycle
boundaries, charts. None serve §1, and the cycle is the product's unit of time.
