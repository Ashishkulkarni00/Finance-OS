# Future Roadmap

Each phase has an **exit criterion**. Do not start the next phase until the current one
has met it. The criteria are deliberately about *user behaviour*, not shipped features.

---

## Phase 0 — Discovery ✅ *(complete, Sep 2026)*

Excel analysed, competitors researched, model defined, MVP scoped.

**Exit:** this documentation package is internally consistent and the founder agrees
with the thesis.

---

## Phase 1 — Personal MVP *(6–8 weeks)*

Build for one user. See `MVP_DEFINITION.md`.

**Exit criteria — all must hold:**
1. Real Balance matches a manual four-account check, three cycles running
2. Daily maintenance under 2 minutes
3. One complete cycle planned, lived, reviewed and closed in the app
4. **The spreadsheet has not been opened in two weeks**

**If exit fails:** the problem is the model, not the code. Return to Phase 0.

---

## Phase 2 — The intelligence layer *(2–3 months)*

The MVP records truth. Phase 2 makes it *useful*.

| Ship | Why |
|---|---|
| Personal baselines from 3+ cycles | Everything downstream needs them |
| Non-judgemental variance | "₹3,200 above your usual" |
| Cause explanation | "six transactions in week three" |
| **Decision preview** | The reason someone pays |
| Prepayment simulation | Highest emotional value for a debt-carrying user |
| Net worth over time | The long-arc progress signal |
| Due-date notifications | P2, properly |
| Baseline-suggested commitment amounts | Realistic plans, not aspirational ones |
| Financial health indicators | With explanations. Never a bare score |

**Exit:** the founder has made at least three real financial decisions using the
decision preview, and can point to what each one changed.

---

## Phase 3 — Multi-user SaaS *(3–4 months)*

| Ship | Notes |
|---|---|
| Authentication, sessions, recovery | Argon2id, no roll-your-own crypto |
| Per-user data isolation | `user_id` already everywhere — enforcement, not migration |
| Self-serve onboarding | J5, unassisted. **The riskiest work in this phase** |
| Subscriptions & billing | Razorpay/Stripe India |
| Household accounts | Two salary cycles, shared goals — Meera |
| Data export | Non-negotiable. Full CSV/JSON, always |
| Privacy policy, consent, deletion | DPDP Act compliance |
| Backups, monitoring, incident process | |

**Exit:** 20 non-founder users; **≥40% still entering data in week 6.**

**If retention is under 40%, stop and fix the product.** Scaling a leaky product is the
most expensive mistake available.

---

## Phase 4 — Integrations *(3–4 months)*

| Ship | Notes |
|---|---|
| **Account Aggregator (India)** | 2.88B accounts enabled, 223M users linked, 650 live FIUs. The real prize |
| Bank statement import (PDF/CSV) | Cheaper interim win |
| SMS transaction parsing (Android) | High value in India; high maintenance burden |
| Card statement import | |
| Auto-reconciliation | Ledger vs actual balances |

**Strategic caution:** integration is a *convenience*, not the product. If we ever
become an aggregator whose differentiator is sync, an incumbent with a banking licence
wins. Keep the decision layer as the centre of gravity.

**Exit:** a user can go a full cycle without manual entry — and still gets more value
than from any aggregator.

---

## Phase 5 — The financial assistant *(open-ended)*

Natural-language questions over the user's own data:

> "How much did I spend on food over the last six months?"
> "Can I afford a ₹4L car?"
> "Why is my savings lower this month?"
> "What changed in my finances this year?"

**Non-negotiable rules:**
1. **Calculations and opinions are visually distinct.** Always.
2. Every figure links to its source.
3. It never invents a number. If the data is not there, it says so.
4. No regulated advice — no "you should invest in X".
5. It works on *this user's* data, not general financial content.

**Prerequisite:** the model beneath must be trustworthy and history deep. An assistant
on top of a shaky model is a machine for producing confident falsehoods.

---

## The shape of the bet

```
Phase 1   Is the model right?          ← technical risk
Phase 2   Is it valuable?              ← product risk
Phase 3   Will strangers pay?          ← market risk    ← THE REAL ONE
Phase 4   Can we remove the friction?  ← execution risk
Phase 5   Can we go deeper?            ← upside
```

Most products in this category die at Phase 3 — retention. Everything in Phases 1 and 2
exists to arrive there with something people will not give up.

---

## What would make us stop

Written down in advance, so the decision is honest when it comes:

- Phase 1 exit fails twice → the mental model is wrong
- Phase 3 week-6 retention below 25% → manual entry is a fatal constraint
- A well-funded incumbent ships the same thesis executed better → compete on independence or stop
- The founder stops using it → the most reliable failure signal available
