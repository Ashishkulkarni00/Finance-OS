# User Personas

Three personas. **We build for Arjun.** Meera is the growth market. Rohit is the
retention ceiling. Priya is who we deliberately do not serve yet.

---

## PRIMARY — Arjun, 27, salaried, servicing debt

*Modelled directly on the first real user. Every number here is real.*

**Situation.** Software services job, ₹57,700 net, credited the 28th. Sole earner;
supports his mother. Three loans (vehicle, an education-financing loan, a course loan)
totalling ~₹14,500/month in EMIs. One credit card carrying a phone EMI and an insurance
EMI. A ₹2,500 SIP started last month. A ₹50,000 emergency fund, partly in cash.

**The arithmetic he lives with.** ₹57,700 in. About ₹43,900 committed before he buys a
single meal. Roughly **76% of income spoken for** on the 1st of the cycle.

**What he actually does today.** Logs every spend in a mobile cash-book app — and has
done so consistently, which matters enormously. But the app has no concept of accounts,
so he cannot answer "how much is in IDBI right now?" He built a spreadsheet to fill the
gap.

**What he says:**
> "I want to avoid situations where I technically have money but don't know a large
> payment is coming."
> "I know I spend on drinks a lot."
> "It will take some time to analyse and understand all of this."

**What he needs:**
1. One honest number, daily
2. To never be surprised by a due date
3. To see where the money actually goes, without being lectured about it
4. To watch debt shrink — the only thing that makes 76% committed feel survivable

**What breaks him:** a product that takes more than two minutes a day; a product that
makes him feel bad; a product he cannot verify.

**Why he is the right first user:** he has the discipline to log but not the tools to
understand. He is at the exact point where a good product changes a financial
trajectory. And he is one of tens of millions.

---

## SECONDARY — Meera, 32, dual income, no debt discipline problem

**Situation.** ₹1.4L household income, two salaries landing on different dates, a home
loan, two credit cards, three SIPs, a child. No cash-flow crisis — but no clarity either.

**Her problem is not scarcity, it is fog.** She cannot answer "are we better off than
last year?" or "can we afford a ₹4L car?" without an afternoon of spreadsheet work.

**What she needs:** net worth over time; two salary cycles reconciled into one
household view; decision previews for large purchases; goal tracking that is honest
about trade-offs.

**Why she matters commercially:** she has the willingness to pay, the data density that
makes insights good, and the multi-year horizon that makes retention compound. **Arjun
proves the product works; Meera makes it a business.**

---

## TERTIARY — Rohit, 41, high income, complex portfolio

**Situation.** ₹4L+/month, rental income, equity, several mutual funds, ESOPs, a CA who
handles tax.

**Why we do not build for him yet:** his needs pull toward portfolio analytics, tax
optimisation and asset allocation — a different product with a different centre of
gravity. Chasing him early would bloat the MVP and lose Arjun.

**Why he is in this document:** he is the retention ceiling. If Arjun succeeds with us
for six years, he becomes Rohit. The domain model must not make that impossible —
which is why `Asset`, `Liability` and `Valuation` exist in the model from day one even
though the MVP barely uses them.

---

## ANTI-PERSONA — Priya, 23, first job, wants a spending app

**Situation.** ₹35,000, lives with parents, no EMIs, no dependants, no commitments.
Wants to know where her money went last weekend.

**Why we do not serve her:** she has no commitments, so Real Balance ≈ her bank
balance, and our central insight is worth nothing to her. Building for her would drag
us into competing with free SMS-scraping trackers on their turf.

**She is not a bad user — she is a user whose problem we do not uniquely solve.**
She becomes Arjun in three years, when the EMIs start.

---

## What this means for the product

| Decision | Driven by |
|---|---|
| Salary-cycle months, not calendar | Arjun paid on the 28th |
| Commitments are first-class, not a budget category | Arjun's 76% |
| EMI and loan-payoff tracking in MVP | Arjun's three loans |
| Credit-card statement/due-date modelling in MVP | Arjun's card is where his EMIs live |
| Cash as a real account | Arjun holds ₹17,000 of emergency fund in cash |
| Multi-account, multi-cycle household | Meera, Phase 3 |
| Investment performance | Rohit, deliberately deferred |
| Pretty spending pie charts as the hero | Priya — not our product |
