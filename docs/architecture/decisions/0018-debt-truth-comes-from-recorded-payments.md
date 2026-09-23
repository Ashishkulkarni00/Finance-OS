# ADR-0018 — A loan's truth is its recorded payments, not the calendar

**Status:** Accepted
**Date:** 2026-09-23 *(records a decision implemented 2026-09-21)*
**Context:** `ROADMAP.md` 0.2 · `FINANCIAL_OS.md` D3 · `FINANCIAL_STATE.md` §4 · ADR-0011

---

## Context

A loan's outstanding balance used to be derived from **elapsed periods**: count the EMI dates
between the checkpoint and today, amortise that many instalments, report the result.
`AmortisationCalculator` said so plainly in its own comment — *"There is no way to record a
loan payment in the product."* The `loan_payments` table had existed, unused, since V5.

That rule makes a loan shrink on a date rather than on a payment. Miss an EMI and the app
still reports the smaller balance; the only way to correct it was to retype what was owed,
which is the stored-value failure this product exists to avoid.

It also contradicted the rest of the system. Everywhere else, a figure is true because an
entry says so — balances from postings, spending from transactions, Real Balance from both.
Debt was the one place where a figure was true because a **date had passed**.

This matters more here than it looks. The differentiator in `FINANCIAL_OS.md` is carrying a
commitment through time, and the sharpest version of that is the **freed-EMI unlock**: "₹2,648
a month comes back in March 2027." That claim is only as good as the payoff date behind it,
and a payoff date computed from the calendar is a guess wearing a date's clothing.

## Decision

### 1. Outstanding, EMIs left and repaid all derive from recorded payments

`LoanServiceImpl.toView` reads `loan_payments`. `AmortisationCalculator.balanceAfterPayments`
amortises **what was actually paid**, not what was due.

### 2. A settled EMI files its own payment

`LoanPaymentRecorder` writes a `LoanPayment` when a `LOAN`-sourced commitment instance
reaches `PAID`. `Propagation.MANDATORY` — the settlement and its record are one fact, or
neither happened.

Not on a part-payment: that has not cleared the period.

### 3. What is missing is **flagged**, never assumed

`unrecordedEmis` and `oldestUnrecordedDue` are on the loan view, and `DebtsNeedsALook`
surfaces them. While an EMI is unrecorded, the balance, the EMIs left and the payoff date are
all still describing last month, and the product says so rather than quietly showing a
number that looks current.

This is the decision the user was asked for directly and gave on 2026-09-21: **recorded
payments *and* flag what is missing** — not silence, and not a calendar guess in the gap.

### 4. Overpayment goes against principal; underpayment does not capitalise

Paying more than the EMI takes the surplus off the principal and pulls the debt-free date in.
Paying less than the interest leaves the balance flat rather than growing it: capitalising
unpaid interest is a lender's rule, and we do not have that lender's rule.

### 5. A soft-deleted transaction un-records its payment

`LoanPaymentRepository` joins `transactions` for the paid amount and excludes soft-deleted
rows. If the money no longer exists, the period reads unrecorded again — which is the honest
answer, and restores the warning in §3.

## Consequences

- **No migration.** The table, entity and repository already existed.
- **The switch was deliberately made while it was free.** Verified on the user's real data:
  every figure identical before and after — Bike ₹1,77,276/37 left, Education ₹42,170/14,
  Coding Ninjas ₹65,344/15, Mobile Mom ₹12,601/5, Health Insurance ₹42,701/12. All five loans
  have a first EMI in October against a 14 September checkpoint, so zero periods had elapsed
  and the rule change moved nothing. **After 5 October it would not have been free**, and the
  two rules would have disagreed in the user's first real month.
- **It has never run.** No EMI has fallen due. The first real exercise is **5 October**.
- A card's available credit depends on this too: `limit − outstanding − emiPrincipalBlocked`,
  where the blocked figure comes from the same recorded payments, so the card page and the
  loan page cannot drift apart.

## Alternatives rejected

**Keep the calendar and let the user correct it.** That is the spreadsheet, and correcting by
retyping is how the workbook corrupted itself.

**Infer payment from any matching transaction.** Tempting, and wrong: a transfer of the same
amount on the same day is not evidence that *this* period was paid. The link is explicit.
