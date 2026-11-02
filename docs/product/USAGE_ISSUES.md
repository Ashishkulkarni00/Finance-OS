# Usage issues — problems hit while actually using Kosh

Started 2026-10-02, on the fifth day of real use.

**What belongs here:** a problem the user ran into *doing their own money*, where the product
behaved correctly but the experience was wrong — a step that is easy to miss, a warning that
fires for a legitimate situation, a record that cannot answer a reasonable question. These are
design problems, not defects.

**What does not:** code defects and missing capabilities. Those are
[`FIX_BACKLOG.md`](FIX_BACKLOG.md), which is organised by technical area. If an entry here
turns out to need a schema change or a bug fix, cross-reference it rather than copying it.

**How this gets used:** nothing here is fixed in passing. The user's instruction on
2026-10-02 was to collect them and *"find solutions for the end user at the last"* — so these
are worked through as one pass, once the daily use has stopped turning up new ones. Several
of them are likely to share one solution.

**Each entry records:** what happened · what the product did and why it was right ·
what it cost the user · what a solution would have to do. **The solution column stays empty
until that pass.** Guessing at fixes one at a time is how you get five half-measures that
disagree with each other.

---

## U1 — Recording a payment does not pay the bill, and nothing says so

**Hit:** 2026-10-02. The user owed ₹15,000 to the emergency fund, deposited ₹9,500 in cash
(the CDM refused the rest), then transferred ₹500 on 1 Oct and ₹500 on 2 Oct from HDFC Salary
to top it up. All three are in the Ledger. **Months still showed ₹9,500 contributed.**

**What the product did, and why it is right.** A Ledger entry says *money moved*. Settling a
bill says *money moved **and it pays this***. The two ₹500 transfers were never settled
against the bill, so the bill does not know about them. Auto-matching deliberately did not
fire: `CommitmentAutoMatcher.amountFits` requires the amount **to the paisa** for anything but
income, and ₹500 is not ₹15,000. It never guesses, which is correct.

**What it cost.** The user believed they had recorded the payments and that the figures were
wrong. They had to be told the second step exists. Left alone, the bill would have read
₹5,500 outstanding indefinitely while the money was in fact already in the fund — and the
plan, Real Balance and the goal would all have been quietly wrong in the same direction.

**Partly fixed 2026-10-02.** The *Towards a bill?* row on the Add sheet matched candidates on
the **source** account only - so for this very case it offered nothing: the top-up is set to
be paid *from Cash wallet* and the make-up transfers came from HDFC Salary. For a transfer,
**where the money went** identifies the bill, so the picker now matches on destination as
well. Recording the next ₹500 into HDFC Premium will offer the bill in one tap.

Also added: when the chosen bill's *Paid from* differs from the account being used, the row
now says so **before** you save, rather than letting you find out from a Needs-review flag on
Months afterwards (that is U3, still open).

**Still unsolved:** an entry recorded *without* using that row - or recorded before the bill
existed - is still silently unlinked, and nothing points it out.

**What a full solution has to do.** Close the gap between "I recorded a transfer into an
account a bill pays into" and "that bill knows". Candidates, none chosen: offer the link at the moment
of recording (the *Towards a bill?* row already exists on the Add sheet and could be
suggested rather than waited for); or surface unlinked entries that look like they pay an open
bill as an attention item; or relax auto-matching for part payments where the account and
destination match exactly. **Related:** `FIX_BACKLOG` 2.13 — the same gap bites hardest on
bills that are really budgets.

---

## U2 — A bill can take many part-payments but only remembers the last one — ✅ **fixed 2026-10-02 (V23)**

**Hit:** 2026-10-02, found while answering U1.

**What the product does.** `confirmedAmount` accumulates correctly across any number of
settles — ₹9,500 + ₹500 + ₹500 adds to ₹10,500 and the outstanding figure is right.
But `CommitmentInstance.linkedTransactionId` is a **single column**, overwritten on every
settle (`CommitmentInstanceServiceImpl.settle`). Only the most recent payment stays attached.

**What it costs.** The arithmetic is trustworthy; the evidence is not. The bill cannot answer
*"which entries made up this ₹10,500?"* — it can only name one of them. For a product whose
whole claim is that every figure can be traced to its source, that is the wrong kind of gap.
It also means `settledOn` reports the date of the last payment as though it were the payment
date.

**Fixed 2026-10-02 — `V23__commitment_instance_payments.sql`.**

| | |
|---|---|
| New table | `commitment_instance_payments` (instance, transaction, amount, recorded_at) with a **UNIQUE key on (instance, transaction)** |
| The real guarantee | *"A transaction cannot pay the same bill twice"* is now enforced by the database. Three layers of code were asked to remember it, and the one value they all compared against was the one this bug destroyed |
| `amount` is captured at settle time | Not read back from the transaction - editing an entry later must not silently restate a bill already settled against it |
| Both "already pays a bill" predicates | `TransactionRepository.search(unlinkedOnly)` and `findUnlinkedForMatch` now read the payments table, not the overwritten column |
| Both settle guards | Same-bill and other-bill checks now ask the payments table |
| `linked_transaction_id` kept | It now means *the most recent payment*, which is what `settledOn` and `settledFromAccount` want. Keeping it made the change additive - every existing read path works untouched |

**The backfill is honest about what was lost, and one bill is affected.** Each instance's
current link was recorded with that transaction's own amount. Payments made *before* V23 and
then overwritten are genuinely unrecoverable - the column that held them is gone - so no row
was invented. **The emergency-fund top-up holds ₹10,500 of which only ₹500 is named**; the
₹9,500 of 30 Sept and the ₹500 of 2 Oct are still offered as unlinked, and re-settling either
would double-count.

**It closes itself.** Settling the remaining ₹4,500 makes the bill `PAID`, and `settle`
refuses a paid instance outright - after that the orphans cannot be used. A one-off SQL
repair could also name them (9,500 + 500 + 500 = 10,500 reconciles exactly), but that is the
user's call and was not done unasked.

**Still to do:** nothing reads the payments table on screen yet. *"Which entries made up this
₹10,500?"* is now answerable in the data but not in the UI - a list on the bill's detail page
is the natural home.

**It happened, on real data, the same day it was written up.** The EF top-up was settled with
the ₹9,500 (link = 85), then with a ₹500 (link = 88). `confirmedAmount` is correctly ₹10,500 -
but **the ₹9,500 is now orphaned**: no instance points at it, so it reads as an unlinked entry
and is offered again in the Settle picker. Taking it would make ₹20,000 on a ₹15,000 bill.

**This is a live, reachable double-count**, and the 2026-10-02 guard in `FIX_BACKLOG` 1.7 does
**not** stop it: that guard compares against the instance's *current* link, and the ₹9,500 is
no longer it. The `unlinkedOnly` filter added the same day is working exactly as written - the
data is what is wrong.

**Promoted from "audit-trail gap" to "correctness".** The join table is not a nicety; it is
the only thing that makes "which entries paid this bill?" answerable, and therefore the only
thing that can stop one being counted twice.

**It also blocks a correctness fix.** `FIX_BACKLOG` **1.7** (an already-linked entry
offered for re-settling, which double-counts) was fixed on 2026-10-02 for the common case
only: the guard can compare against the *latest* link and no earlier one. Settle with A,
then B, and A is forgotten and re-usable. **The two are one piece of work.**

---

## U3 — Paying a bill from a different account flags "Needs review" — ✅ **fixed 2026-10-02**

> **The fix had a cost elsewhere, found 2026-10-03.** Freeing settlement from the planned
> account left `committed` still reading it, so a bill planned from a non-spendable account
> and paid from a spendable one drained Real Balance without ever being counted as promised.
> Fixed under `FIX_BACKLOG` **1.8** / **ADR-0020**; **1.9** tracks the same disagreement
> still present in the shortfall insight and the forecast. *Lesson: "Paid from" was
> load-bearing in two unrelated places, and only one of them was looked at.*

**Hit:** 2026-10-02, anticipated before the user ran into it.

**What the product does, and why it is right.** The EF top-up bill says *Paid from: Cash
wallet*. Settling it with a transfer from HDFC Salary sets the instance to `NEEDS_REVIEW`
rather than `PART_PAID` (`CommitmentSettlementCalculator`, `accountMatches == false`). The
plan said one thing and reality did another, and saying so is the honest response.

**What it costs.** It fires for a perfectly legitimate change of plan — the cash machine
refused the notes, so the money came from the bank instead. The user did nothing wrong, and
the only way to avoid the flag is to know in advance to edit the bill's *Paid from* first.
A warning that the informed user routinely has to pre-empt is a warning that will be ignored.

**The user's framing, 2026-10-02, and it is the right one:** *"it should be a single option
right, Paid from — from anywhere I should be able to pay."* **"Paid from" is being treated as
a rule when it is a plan.** It has a real planning job - the projection uses it to work out
which account will run short, which is what produces the genuinely valuable IDBI warning -
but it should never constrain *how* a bill may actually be paid.

**The tell that this is wrong:** the only way to link a payment made from another account is
to **edit the bill's Paid from first**. The workaround is to rewrite the plan to get past a
warning - the product making the user lie to it. (On 2026-10-02 that happened to be truthful
for this user, because the cash route was genuinely dead, but the shape of the advice is
wrong.)

**Three places treat it as a gate:**
1. `CommitmentSettlementCalculator` → `NEEDS_REVIEW` when `accountMatches` is false.
2. `SettleCommitmentSheet` queries candidates with `accountId: instance.account.id`, so an
   entry from another account cannot even be chosen.
3. The *Towards a bill?* row on the Add sheet - partly relaxed for transfers on 2026-10-02
   (destination now also matches); still source-only for expenses.

**And one quiet lie to fix with it.** A settled row's meta reads
`{ label: 'Paid from', value: instance.account.name }` (`PlanZone.tsx:215`) - the
**commitment's** account, not the transaction's. A bill paid from somewhere else still claims
it was paid from the planned account. The response does not carry the settling transaction's
account, so this needs a backend field as well.

**Fixed 2026-10-02, all four parts:**

| | |
|---|---|
| `CommitmentInstanceServiceImpl.settle` | `accountMatches` is now **destination-only**. Where money *went* still gates - it did not pay this bill if it arrived elsewhere - but where it came *from* does not |
| `SettleCommitmentSheet` | No longer queries `accountId: instance.account.id`. Entries from any account are offered; the destination still narrows them |
| `CommitmentInstanceResponse` | New **`settledFromAccount`** - the account the money actually left, null when it is the planned one. `TransactionDateProjection` gained `getAccountId()`, and `datesByIds` became `settlementFactsByIds` |
| `PlanZone` settled row | *Paid from* reads `settledFromAccount ?? account`. It used to print the **commitment's** account whatever the payment said - a quiet lie that would have got much louder once paying from anywhere was allowed |

**What is deliberately unchanged:** the planned account still drives the projection, which is
what produces the account-shortfall warnings. It is a plan again, which is all it ever was.

**Not verified by a write.** Everything compiles and the field is correctly absent when the
accounts agree (JSON omits nulls), but no settle from a mismatched account has run from here
- that needs a POST against real data. **Ask the user to confirm after their next one.**

---

## U4 — "Spending money? No — savings" is being used to earmark, and ₹4,740 of real cash vanished from Real Balance

**Hit:** 2026-10-03, by the user, immediately after ADR-0020 took Real Balance to −₹873:
*"that money which is there to me … there should be a way that Kosh considers it and based on
that numbers should reflect."* They are right. They hold **₹4,740 of physical cash** and Real
Balance does not know it exists.

**What the product did, and why it is right.** `Cash wallet` is set to
`includeInSpendable: false`, and `Account.countsAsSpendable()` honours that exactly as
documented. The field's own javadoc says what it is for: *"Overrides the type default, for the
**rare** account that behaves differently."* It is an escape hatch for an account that is not
spending money **by nature** — an FD, a joint account you cannot draw on.

**What it was used for instead: earmarking.** That cash *was* destined for the emergency-fund
top-up, so switching it off stopped a ₹15,000 commitment looking affordable. It worked, and it
was the wrong lever, because it does not say "this money is promised" — it says "this money is
not money". Two consequences followed:

- The cash is **absent from `held`**, so Real Balance understates by ₹4,740 whatever happens.
- The top-up planned *from* that account was absent from `committed` too, because
  `leavesHeldMoney` saw a non-spendable source. That half is what **ADR-0020 / FIX_BACKLOG 1.8**
  fixed on 2026-10-03 — but only for the case where the payment came from somewhere else.

**The form invites the mistake.** `AccountFormFields.tsx` offers *"Yes - day to day"* /
*"No - savings"*, and the hint for `No` reads *"Still counts in net worth, but never toward
what's free until salary."* To someone setting aside cash for a goal that is precisely the
sentence they are looking for. Nothing on the row mentions that **Reservations** are the
primitive for promised money — the one already doing this job correctly for the ₹3,226 Bangalore
trip, three screens away.

**Also wrong, though it changes no number:** the account is typed `BANK`. `AccountType.CASH`
exists (*"Physical cash. Spendable, asset. In India this is not a rounding error."*) and both
types behave identically for spendable/asset, so this is semantics — but it is the kind of
semantics that makes the next reader mis-model the same thing.

**What a full solution has to do.** Make the right lever the obvious one at the point of
decision. Candidates, none chosen: say on the row that money promised to a goal belongs in a
reservation, not here, and link to it; reserve `No` for accounts that genuinely are not
spending money and rename it accordingly (*"No — I can't spend from this"* rather than
*"savings"*, since a savings account you *can* draw on is spending money); or detect the
pattern — a spendable-by-type account switched off while a commitment is planned from it — and
offer the reservation instead. **Related:** `FIX_BACKLOG` 1.8, ADR-0020, and the long-open
*"Cash wallet — deliberate or accidental?"* question in `CONTINUE_HERE`, which this answers:
**accidental, in the sense that the intent was real and the mechanism was wrong.**

**Immediate workaround given to the user (no code):** set `Cash wallet` to *"Yes - day to day"*
and, if any of that cash is genuinely promised, add a reservation for that amount. Verified by
arithmetic, not by a write: only instance 86 is planned from Cash wallet and ADR-0020 already
counts it via its HDFC Salary payment, so `committed` does not move and Real Balance becomes
**₹3,867** (held ₹43,116 − reserved ₹3,226 − committed ₹36,023).

---

## Solutions pass — **proposed 2026-10-03, nothing approved, nothing built**

Written because the user asked *"guide me what to do now, the modifications for such
scenarios"*. This is the one considered pass the file was created for, scoped to the class of
problem U1-U4 and `FIX_BACKLOG` 1.7-1.9 all belong to. **Ask before building any of it.**

### The one diagnosis underneath all of them

**Kosh keeps a plan and a fact in the same field, then reads them interchangeably.**

Every failure in this file is that sentence. "Paid from" is a plan, and `committed` read it as a
fact (1.8). `linked_transaction_id` was a fact, and three layers read it as *the* fact when it
was only the latest (U2/V23). `include_in_spendable` describes the nature of an account, and it
got used to record an intention about some money inside it (U4). A Ledger entry is a fact, and
nothing connected it to the plan it satisfied (U1).

None of these were careless. In each case the honest thing had **nowhere to live**, so it went
into the nearest field that produced the right-looking number today.

### The modifications, smallest and highest-value first

**M1 — Label every read of a plan field.** Audit every use of `commitment.getAccountId()` and
decide, explicitly and in a comment, whether that caller wants the plan or the evidence.
ADR-0020 did this for `committed`; `FIX_BACKLOG` **1.9** is the same decision still owed by the
shortfall insight and `GET /forecast`. *Kills: the whole 1.8 class, permanently.* Small.

**M2 — Refuse an over-settle.** `CommitmentSettlementCalculator.apply` has **no cap**:
`totalConfirmed` is just `confirmed + payment`, so a settle can push a bill arbitrarily past its
expected amount. Settling txn 85 against instance 86 right now would write **₹20,000 confirmed
on a ₹15,000 bill** and mark it `PAID`. It should refuse, or demand an explicit *"the bill was
bigger than planned"* — which is a real case (a variable bill) and so must stay possible, just
never silent. *Kills: the live double-count risk, and rule 4's remaining soft spot.* Small.

> **And the sheet currently points at the hazard.** On a bill whose due date has passed,
> `SettleCommitmentSheet` shows *"If you already paid it and the payment is in your Ledger,
> **link that entry instead** so the money isn't counted twice."* For a **part-paid** bill that
> advice is backwards: the earlier payments are already inside `confirmedAmount`, so linking one
> counts it twice — the exact outcome the sentence promises to prevent. The copy assumes an
> untouched bill. It needs to know the difference, and M2's cap is what makes it safe either way.

**M3 — Show the payment record on the bill.** *"Which entries made up this ₹10,500?"* is
answerable in the data since V23 and nowhere on screen. The bill's detail page should list each
payment — date, amount, **source account**, and a way to unlink one. **This is the highest-value
item in the list**, because it is the only one that would have let the user find U2, 1.7 and 1.8
themselves instead of needing someone to read the database. Everything else here is us fixing
things; this one hands the user the evidence. Small-medium.

**M4 — One primitive for promised money, and stop the other one being usable for it.**
Reservations already mean *"this money is spoken for"*. `includeInSpendable` means *"this is not
spending money at all"*. Reword the form's `No` so it cannot be read as earmarking (*"No — I
can't spend from this"*, not *"No — savings"*, since a savings account you can draw on **is**
spending money), say on the row that money promised to a goal belongs in a reservation, and when
someone switches a spendable-by-type account off while a commitment is planned from it, offer the
reservation instead. *Kills: U4, and the ₹4,740 invisible-cash failure.* Small-medium.

**M5 — Surface an entry that looks like it pays an open bill but isn't linked.** U1's larger
half. An attention item, not a silent gap — destination account plus a plausible amount against
an open bill is enough to *ask*, which is different from auto-matching's duty never to guess.
*Kills: orphans forming at all.* Medium.

**M6 — The large one: say where money must be, not only how much is free.** Real Balance is a
single pooled figure, but money has to be **in the right account on the right day** — and that is
the user's actual recurring problem, not arithmetic. Today only the shortfall insight thinks this
way, one account at a time, as a warning after the fact. The live example: Real Balance says
₹3,627 free while IDBI holds ₹460 against ₹8,400 due in two days, and both statements are true.
A per-account view of the cycle — what arrives, what leaves, what must stay — would make
"transfer ₹14,376 to IDBI" a thing the product plans rather than something it warns about.
**Not a small change, and it may belong in `ROADMAP.md` rather than here.** Large.

### Deliberately not proposed

- **Auto-moving money between accounts**, or auto-linking entries on a guess. Both break D8 (AI
  is an interface, never the engine) and rule 3. The product may *ask*; it must not decide.
- **Making the forecast evidence-led by default.** It is a pure rule projection *by design* and
  that is what makes it meaningful. M1 decides this deliberately; it is not a bug to sweep up.
- **A new "cash" concept.** `AccountType.CASH` already exists and is correct. The problem was
  never the model.

---

## Already captured elsewhere — do not duplicate

| | |
|---|---|
| Goal arithmetic may read rules rather than occurrences | `FIX_BACKLOG` **2.12** |
| Petrol / Mobile recharges / Hair cut are budgets, not bills | `FIX_BACKLOG` **2.13** |
| A one-month amount change on a fixed bill | `FIX_BACKLOG` **2.9** — fixed 2026-09-28 (V22) |
