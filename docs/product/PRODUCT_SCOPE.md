# Product Scope

What this product is, what it is not, and where the edges are.

---

## In scope — the product's territory

**Cash-flow truth.** What you have, what is committed, what is free. The core.

**The monthly cycle.** Plan, live, review, close — anchored to the salary date.

**Commitments.** Recurring obligations as first-class objects that generate each month.

**Debt.** Loans, EMIs, amortisation, payoff timelines, prepayment analysis.

**Credit cards.** Statement cycles, unbilled spend, due dates, EMI conversions.

**Savings and goals.** Targets, honest feasibility, progress, emergency-fund coverage.

**Net worth.** Assets minus liabilities, tracked over time.

**Understanding.** Baselines, trends, plain-language explanation, financial literacy
delivered in the interface.

**Decisions.** What a financial choice costs, in the user's own numbers.

---

## Out of scope — permanently

| Not building | Why |
|---|---|
| Banking, payments, money movement | Regulatory weight; not our value |
| Lending or credit brokering | **Structurally conflicted with our purpose** |
| Investment advisory or stock picking | Licensed activity; different product |
| Tax filing | Adjacent, seasonal, a different business |
| Business or freelance accounting | Different user, different model |
| Crypto portfolio tracking | Different audience, different volatility model |
| Bill payment execution | Utility, not insight; crowded and commoditised |
| Social / comparison features | Money is private. Comparison breeds shame |
| Gamification, streaks, confetti | Infantilising for a serious financial tool |

---

## Out of scope for now — revisit with evidence

| Deferred | Revisit when |
|---|---|
| Bank / AA integration | Phase 4, after retention is proven manually |
| Multi-user households | Phase 3, after single-user works |
| Native mobile apps | Responsive web proves insufficient |
| Multi-currency | A user needs it |
| Receipt scanning / OCR | Capture friction remains the top complaint after other fixes |
| AI assistant | The underlying model is trustworthy and history is deep enough |
| Employer / B2B2C | Consumer retention is proven |

---

## The scope test

Before adding anything, all five must hold:

1. Does it help answer one of the questions in `PRODUCT_VISION.md` §2?
2. Does it serve **Arjun**, not just Meera or Rohit?
3. Does it survive *"so what should I do?"*
4. Would it still matter if bank sync existed?
5. Does it make the next month easier than the last?

Fail two and it does not ship.

---

## Boundaries with adjacent products

**We are not a bank.** We read and model; we never move money.
**We are not an advisor.** We show arithmetic and trade-offs, never "you should invest in X".
**We are not an accountant.** Double-entry is internal plumbing, never a user concept.
**We are not a tracker.** Recording is the substrate, not the point.

---

## The scope risk we are most exposed to

**Feature sprawl from the founder being the user.** A single user with strong opinions
who is also the developer will keep adding things that solve *his* edge case.

The mitigation is `PRODUCT_LEARNING_LOG.md`: observations are recorded and left to sit,
not converted straight into features. A pattern must appear three times, or hurt badly
once, before it earns a build.
