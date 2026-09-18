# ADR-0008 — Account type is an enum; category will be a table

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

Two classification concepts look similar and are fundamentally different.

**Account type** — bank, cash, credit card, loan, investment.
**Category** — groceries, drinks, transport, and whatever else a user invents.

The instinct is to treat both the same way. That would be a mistake in both
directions.

## Decision

**`AccountType` is a Java enum.** Each constant carries compiled *behaviour*:

```java
BANK        (spendable: true,  asset: true,  liability: false)
CREDIT_CARD (spendable: false, asset: false, liability: true)
```

Whether a container holds spendable money, and whether it is an asset or a liability,
is not data — it is a rule that Real Balance and net worth depend on. A user cannot
invent a sixth kind of money without new business rules, so a user-editable table
would let them create an account the calculations cannot classify.

**Category will be a database table** (milestone 2), user-editable, with a
system-seeded starting set. Categories carry no behaviour: they group spending for
reporting and comparison. Hard-coding them in an enum would make "add a category" a
code deployment, which is absurd for something as personal as how someone thinks
about their own spending.

## Consequences

**Good.** Behaviour the calculations depend on is compile-time safe and exhaustively
switchable. Classification that belongs to the user is genuinely theirs.

**Cost.** Adding an account type is a code change and a migration — correct, because
it requires deciding how it behaves in every calculation.

**Boundary rule.** If a value carries behaviour the system depends on, it is an enum.
If it is a label the user owns, it is a table.
