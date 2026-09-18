# ADR-0009 — Opening balance anchored per account

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

Any ledger needs a starting point. The spreadsheet this product replaces used **one
global "balance as at" date** for every account: balances were stated as at 6
September, and only movements after that date counted.

That model broke in real use within two days. One bank was under maintenance and its
balance genuinely could not be read, while the others could. There was nowhere to
express "this figure is true as at Saturday, that one as at Monday, and this third one
I am not sure about" — which left a possible ₹5,000 double-count unresolved.

## Decision

Every account carries **its own** anchor:

```
opening_balance      DECIMAL(15,2)  NOT NULL
opening_as_of        DATE           NOT NULL
opening_confidence   VARCHAR(20)    NOT NULL   -- CONFIRMED | ESTIMATED | UNKNOWN
```

The balance formula is per account:

```
currentBalance = openingBalance + sum(postings dated after openingAsOf)
```

`BalanceConfidence` exists because uncertainty is a real state the product must be
able to represent. A total including an `ESTIMATED` or `UNKNOWN` component can be
labelled approximate rather than presented as fact.

## Consequences

**Good.** Accounts can be onboarded one at a time, as the user actually gets to them.
An unreadable bank does not block the rest. The product can say "your net worth is
approximate, because two figures are estimates" — honest, and something no competitor
does.

**Cost.** Balance calculation considers a different cut-off per account. Cross-account
totals must consider mixed confidence.

**Enables.** Onboarding journey J5, where Real Balance appears after step 2 and
*sharpens* as more is entered, rather than requiring completeness up front.
