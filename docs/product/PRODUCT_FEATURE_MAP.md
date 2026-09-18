# Product Feature Map

Every feature, its phase, the problem it solves, and its justification.

**Legend:** ● MVP · ◐ Phase 2 · ○ Phase 3+ · ✕ rejected

---

## Cash-flow truth

| Feature | Ph | Solves | Note |
|---|---|---|---|
| Real Balance | ● | P1 | The product |
| Room Today / Room Left | ● | P1 | Daily actionable number |
| Reservations | ● | P1 | Emergency fund is not spendable |
| Honest gaps ("needs a number") | ● | P1, trust | Principle 1 |
| Full traceability of every number | ● | trust | Principle 2 |
| Per-account projection | ● | P10 | **Nobody else has this** |
| Cross-account transfer suggestion | ◐ | P10 | "Move ₹7,000 to IDBI" |
| Month-end position forecast | ◐ | P5 | |

## Cycles

| Feature | Ph | Solves | Note |
|---|---|---|---|
| Salary-cycle months | ● | P1 | **Differentiator** |
| Cycle summary | ● | P5 | |
| Guided month close | ● | P5 | Retention ritual |
| Immutable cycle snapshots | ● | P5 | Seeds all trends |
| Cycle comparison | ◐ | P5 | |
| Custom / multiple income dates | ○ | Meera | |

## Transactions

| Feature | Ph | Solves | Note |
|---|---|---|---|
| 5 types with double-entry postings | ● | P3, P9 | Integrity by construction |
| Quick add, < 5 seconds | ● | P4 | **Retention-critical** |
| Predicted category from merchant | ● | P4 | |
| Search, filter, edit, audit trail | ● | — | Table stakes |
| Cash as a real account | ● | P9 | |
| CSV/XLSX import + duplicate detection | ● | P4, A4 | Migration path |
| Learned categorisation rules | ◐ | P4 | |
| Split transactions | ◐ | — | Wait for demand |
| Receipt capture / OCR | ○ | P4 | |
| SMS parsing (Android) | ○ | P4 | High value in India, high maintenance |
| AA bank sync | ○ | P4 | Phase 4 |

## Commitments

| Feature | Ph | Solves | Note |
|---|---|---|---|
| Commitment rules generate the cycle | ● | P2 | Best idea in the Excel |
| Rule / instance split | ● | A3 | **Fixes the stale-tick defect** |
| Status incl. Unverified, Settled earlier | ● | P2 | From observed reality |
| Auto-match payments | ● | P4 | Removes the worst chore |
| Variable amounts | ● | B11 | Electricity is never the same |
| Timeline, next 30 days | ● | P2 | |
| Due-date notifications | ◐ | P2 | Needs a reliable cycle engine |
| Baseline-suggested amounts | ◐ | P5 | "Electricity averages ₹2,850" |
| Subscription audit | ◐ | — | "Unused for 60 days" |

## Debt

| Feature | Ph | Solves | Note |
|---|---|---|---|
| Loans with terms | ● | — | |
| Generated amortisation | ● | B1 | Turns 3 `TBD`s into real numbers |
| Payoff timeline | ● | P5 | Emotionally the most important screen for Arjun |
| Card-billed EMIs flagged | ● | P3 | Prevents double-count |
| Total debt over time | ● | P5 | |
| Prepayment simulation | ◐ | B2 | High value |
| Payoff strategy comparison | ○ | — | Avalanche vs snowball |

## Credit cards

| Feature | Ph | Solves |
|---|---|---|
| Terms, statement log, derived outstanding | ● | P3 |
| Unbilled spend | ● | P3 |
| Per-purchase real due date | ● | B13 |
| Payment as settlement, never expense | ● | P3 |
| Utilisation warnings | ◐ | — |
| Interest-cost warning on partial payment | ◐ | P8 |

## Goals, savings, wealth

| Feature | Ph | Solves | Note |
|---|---|---|---|
| Goals with target, date, required/month | ● | — | |
| Emergency fund as first-class goal | ● | — | |
| Feasibility check against real surplus | ◐ | — | Excel's version is naive arithmetic |
| Net worth | ● | — | Computed; charted in Phase 2 |
| Net worth over time | ◐ | B3 | |
| Investments with manual valuation | ● | — | |
| Investment performance / XIRR | ○ | Rohit | |

## Understanding

| Feature | Ph | Solves | Note |
|---|---|---|---|
| Ambient explanation of every term | ● | P8 | **Differentiator** |
| Plain-language errors | ● | P7 | |
| Teaching empty states | ● | P8 | |
| Personal baselines | ◐ | P5 | Unlocks the insight layer |
| Non-judgemental variance | ◐ | P5 | |
| Cause explanation | ◐ | P5 | "six transactions in week three" |
| Financial health indicators | ◐ | P5 | Only with explanations, never a bare score |
| **Decision preview** | ◐ | P6 | **The commercial engine** |
| Scenario comparison | ○ | P6 | |
| AI assistant over own data | ○ | P6 | Only on a trustworthy model |

## Rejected

| Feature | Why |
|---|---|
| Per-category envelope budgets | Committed-vs-flexible may make them unnecessary. Test before building |
| Financial health *score* | A number without an explanation is noise. Indicators, yes; a score, no |
| Streaks / badges | Infantilising; punishes the honest gap |
| Peer comparison | Money is private; comparison breeds shame |
| Bill payment | Utility, not insight |
| Net-worth leaderboards | Actively harmful |

---

## MVP feature count

**~30 features.** Anything beyond that is Phase 2 pretending to be MVP.
