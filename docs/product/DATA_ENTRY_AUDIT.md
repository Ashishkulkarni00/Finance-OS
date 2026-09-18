# How Data Gets In — Audit & Design

**Written 2026-09-12.** Study only, nothing implemented. Answers one question, screen by
screen: *when this screen shows me a figure, who typed it in?*

The prompt: *"Application is empty now and I as a user fill the data in which will denote
the current state of finance. Those screens are not there right? We have Add but just the
expense, transfer and all."*

Correct, and the gap is wider than it looks.

---

## 1. The finding, in one line

**The product can read nine kinds of thing and let you type in four of them — and it only
lets you type those four once, during a wizard that never runs again.**

Two separate problems wearing one coat:

1. **Coverage.** Cards, loans, investments, goals and categories have complete,
   working backends and no way in from the UI at all. I created every loan and every
   investment in the live database with `curl` while building those screens — that was
   not a shortcut, it was the only option.
2. **Recurrence.** Onboarding runs when you have zero accounts and never again
   (`App.tsx` `RootRedirect`). After it, the only write path in the entire product is
   Add Transaction. There is no way to open a second bank account, start a SIP, take a
   loan, or set a goal — ever.

The second is the more serious. A finance app whose setup is a one-time wizard is
modelling a life that stops changing on day one.

---

## 2. Method

Not read from memory. Three inventories cross-referenced:

- every `@PostMapping/@PatchMapping/@DeleteMapping` in the backend controllers
- every `build.mutation` in `src/services/*.ts`
- every call site of those mutation hooks in `.tsx`

A row only counts as reachable if all three exist. Two mutations turned out to be defined
and never called from anywhere — noted in §4.

---

## 3. Screen by screen: what it shows, and who typed it

### Today
| Shows | Comes from | Entry point |
|---|---|---|
| Real Balance, Room | derived — accounts − reservations − commitments | none needed (derived) |
| Spent today | transactions | **Add** ✓ |
| Needs You | commitment instances, generated from commitment rules | Onboarding only |
| Shortfall warnings | per-account projection over commitment instances | Onboarding only |

*Everything on Today is derived from four inputs, three of which can only be entered
during onboarding.*

### Ledger
| Shows | Comes from | Entry point |
|---|---|---|
| Every row | transactions | **Add** ✓, edit/delete ✓ |
| Category on a row | categories | **seeded only** — no way to create one |
| Day subtotals, view totals | derived server-side | — |

*The only screen whose data is fully enterable.* Its one gap: the source workbook's
busiest category is `Drinks`, which has no equivalent in the seeded set and cannot be
created (flagged already in `LEDGER_EXPERIENCE.md` §10).

### This Month
| Shows | Comes from | Entry point |
|---|---|---|
| Cycle band, dates | `UserSettings.cycleStartDay` | Onboarding only |
| The plan (commitments) | commitment rules → generated instances | Onboarding only |
| Settling an item | `POST /commitment-instances/{id}/settle` | **defined, never called** (§4) |
| Flexible spending | transactions by category | **Add** ✓ |

### Accounts
| Shows | Comes from | Entry point |
|---|---|---|
| Balance | opening balance + transaction postings | Onboarding (opening) + **Add** ✓ |
| **Available**, "held back" | reservations, minimum balance | Reservations: onboarding only. **Minimum balance: no entry point at all** |
| "must stay in · bank minimum" | `Account.minimumBalance` + `minimumBalanceMandatory` | **none** |
| Institution, last four | `Account.institution` / `lastFour` | **none** |
| "Pays for: Bike loan EMI…" | commitment rules grouped by account | Onboarding only |
| Cards: outstanding, unbilled, credit left | `CreditCardTerms`, `CardStatement` | **none — backend exists, zero UI** |

*The single worst case in the product.* `NeedsALookZone` warns "X is under the minimum the
bank requires" — a figure the user has **no way to supply**. Onboarding's `AccountsStep`
captures exactly three fields: name, type, balance.

### Debts
| Shows | Comes from | Entry point |
|---|---|---|
| Every loan | `Loan` | **none** — `POST /loans` exists, no UI |
| Confidence, EMI day, paying account | `Loan` columns added in V9 | `updateLoan` mutation exists, no UI calls it |
| "₹X repaid" | `LoanPayment` | **no write path anywhere, backend included** |

### Investments
| Shows | Comes from | Entry point |
|---|---|---|
| Every holding | `Investment` | **none** — `POST /investments` exists, no UI |
| Current value / gain | `POST /investments/{id}/value` | ✓ **the Value button on each row** |
| Total invested | account balance (postings) | **Add** ✓ |

*The one screen built with its primary write action on the row itself — and the model the
rest should follow.*

### Plan
| Shows | Comes from | Entry point |
|---|---|---|
| Standing | derived from cycle + commitments | — |
| Goals | `Goal` | **`createGoal` defined, never called** (§4) |
| Commitment rules | `Commitment` | Onboarding only; no edit |
| History | closed cycle snapshots | Month Close ✓ |

---

## 4. Dead ends found while auditing

Three things are built and unreachable. Worth fixing regardless of what else happens:

1. **`settleCommitmentInstance`** — the service mutation exists; nothing calls it. Month's
   **Settle** button dispatches `openAddSheet()` instead, so settling a commitment means
   recording a transaction and hoping `CommitmentAutoMatcher` links it. It matches at
   transaction-creation time only, which is why seeded commitments had to be settled
   by hand via curl earlier in this project.
2. **`createGoal`** — defined, never called. Goals can be read and never created.
3. **Import** (`POST /imports`, `/imports/{id}/commit`) — a whole CSV import backend with
   no frontend at all.

---

## 5. The write-path matrix

✓ reachable · ⚠ partial · ✗ no way in

| Thing | API | Service | UI | Verdict |
|---|---|---|---|---|
| Transaction | ✓ | ✓ | Add + edit + delete | ✓ |
| Investment valuation | ✓ | ✓ | row button | ✓ |
| Cycle close | ✓ | ✓ | Month Close | ✓ |
| Salary day | ✓ | ✓ | onboarding only | ⚠ set once, never changeable |
| Account | ✓ | ✓ | onboarding, 3 of 12 fields | ⚠ |
| Reservation | ✓ | create only | onboarding only | ⚠ no edit, no release |
| Commitment rule | ✓ | create only | onboarding only | ⚠ no edit, no archive |
| Commitment settle | ✓ | ✓ | **nothing calls it** | ✗ |
| Goal | ✓ | create only | **nothing calls it** | ✗ |
| Loan | ✓ | update only | none | ✗ |
| Investment (create) | ✓ | none | none | ✗ |
| Category | ✓ | none | none | ✗ |
| Card terms / statement | ✓ | none | none | ✗ |
| Import | ✓ | none | none | ✗ |
| **Loan payment** | **none** | — | — | ✗ backend too |

Note the pattern: **the backend is almost complete.** Eleven of fourteen gaps are missing
UI over working endpoints. This is a smaller job than it looks.

---

## 6. The design decision: setup is not a wizard

The obvious move — bolt five more steps onto onboarding — is wrong, for a reason worth
stating.

A nine-step wizard still runs once. It would let you enter your loans on day one and never
add another. And it would front-load the most tedious possible first experience: a new
user facing nine screens of data entry before seeing a single number.

**The load-bearing insight:** the form to add a loan on day one and the form to add a loan
in month seven are the same form. Build it once, put it where the loans live, and setup
stops being a separate concept — it is just *using the product before there is anything in
it*.

So:

> **Every register owns its own "Add" affordance. Onboarding becomes a short, skippable
> path that walks you through those same affordances in dependency order.**

This solves coverage and recurrence with one piece of work, and it means nothing built for
setup is throwaway.

### What onboarding should still do

Keep it to what genuinely has to come first, in dependency order:

1. **Salary day** — every cycle boundary depends on it. Nothing else works without it.
2. **Accounts** — with the full field set (§7), because minimum balance and institution
   drive warnings the user will otherwise never be able to answer.
3. **Then stop.** Offer a checklist, not more steps: *"Add your commitments · loans ·
   cards · investments · goals — or skip and add them as you go."* Each item links to
   that register's own add form.

Two mandatory steps instead of four, and everything else becomes optional and repeatable.

### Why not make Add a menu

`NavRail` already says it: *"Add is a deliberate action, not a 5th destination."* Adding a
transaction happens daily; adding an account happens twice a year. Putting them in one
menu optimises the rare case at the cost of the constant one. **Add stays transaction-only;
each register grows its own add button.**

---

## 7. What each register needs to capture

Fields marked **†** are ones the UI already *displays* but nobody can currently supply.

**Accounts** — `AccountsStep` today captures name, type, opening balance. Needs:
institution †, last four †, opening as-of date †, opening confidence †, minimum balance †,
whether that minimum is mandatory †, purpose †, include-in-spendable, include-in-net-worth.
*Every one of those † fields already drives something visible on the Accounts page.*

**Cards** — entirely new. Credit limit, statement day, due day, and a way to record a
statement. `CardsSection` currently renders three figures that can never be entered.

**Loans** — lender, the loan account, principal, rate (optional → TBD), tenure, start date,
EMI, EMI day, paid via bank/card, **paying account**, confidence, note. All modelled in V9;
none enterable.

**Investments** — name, type, ledger account *(optional — an EPF has none)*, paying
account, monthly contribution, contribution day, stated invested *(when no account)*,
liquid or not, confidence, note.

**Commitment rules** — onboarding captures name, amount, due day, account. Missing: amount
type (fixed/variable), frequency, category, mandatory, requires-verification, `why`,
`ifSkipped`. The last two exist specifically to be shown on the Month row and are never
populated.

**Goals** — name, target, target date, linked reservation.

**Categories** — name, group. Smallest job on the list, and it unblocks the Ledger.

**Reservations** — exist in onboarding; need edit and release afterwards.

---

## 8. Two things worth deciding, not assuming

**D1 — Does "add an account" also create its dependants?** A credit card account and its
card terms are two entities the user thinks of as one thing. Likewise a loan account and
its loan. *Recommendation: yes, one form each.* Choosing type `CREDIT_CARD` reveals the
terms fields; `LOAN` reveals the loan fields. The user should never have to know two rows
were written.

**D2 — Settle: fix the button, or fix the matcher?** Month's Settle opens the Add sheet
rather than calling settle. Either wire the button to `settleCommitmentInstance`, or make
`CommitmentAutoMatcher` run retroactively so recording a transaction later still links it.
*Recommendation: both, but the button first* — it's a one-line fix for a control that
currently does something other than what it says.

---

## 9. Build order

**Phase 1 — stop the bleeding (small, high value).**
Categories create · wire Settle to the settle mutation · wire `createGoal`. Three gaps
closed against endpoints and mutations that already exist.

**Phase 2 — the account form, properly.**
Full field set, reachable from the Accounts page *and* reused by onboarding. Unblocks
every minimum-balance and institution figure the Accounts page already renders.

**Phase 3 — the missing registers.**
Add forms for loans, investments, cards (with D1's nested terms). Each lives on its own
tab, each reused by onboarding's checklist.

**Phase 4 — editing and undoing.**
Edit commitment rules, edit/release reservations, edit loans and investments, change salary
day. Everything currently write-once.

**Phase 5 — the deferred backend.**
`LoanPayment` write path (the only true backend gap), and an import UI.

Phases 1 and 2 alone would move the product from "four of nine, once" to genuinely usable
from empty.
