# Business Model

**Status:** thinking, not committed. No MVP decision should be distorted by this.

---

## 1. The constraint that comes first

**Revenue must come from the user, never from their financial behaviour.**

No lead generation to lenders. No mutual-fund distribution commission. No credit-card
affiliate revenue. No data sale, ever.

This is not primarily ethics — it is product integrity. The moment a referral fee
exists, every recommendation is suspect, and the user is right to suspect it. Our one
defensible advantage over every Indian competitor is that we can tell someone to borrow
less. That advantage is worth more than any commission.

---

## 2. Who pays, and for what

**Target customer:** salaried Indians, 25–40, ₹40k–₹2L/month, with at least one EMI and
one credit card. Financially serious, not financially expert.

**What they are actually buying:** not software. *The end of financial ambiguity.* The
job to be done is **"tell me the truth about my money, and tell me what this decision
costs."**

**Why they keep paying** — the honest version. Not because the app is pretty, but because:

1. Their history lives here and gets more useful every month
2. The month-close ritual becomes a habit with a payoff
3. The commitment engine means they stop missing due dates
4. Decision preview is genuinely unavailable elsewhere

**Retention is earned by accumulated understanding, not by lock-in.** Month 12 must be
more valuable than month 1 or the churn will be brutal.

---

## 3. Pricing

Reference points: Monarch $99.99/yr, YNAB $109/yr, Copilot $95/yr — i.e. **₹8,000–₹9,000/yr**
at 2026 rates. Indian willingness-to-pay for consumer SaaS is materially lower.

**Working hypothesis:**

| Tier | Price | Contains |
|---|---|---|
| **Free** | ₹0 | 1 account, 50 transactions/month, Real Balance, timeline. Enough to feel the value, not enough to run a life |
| **Personal** | **₹199/month or ₹1,799/year** | Everything. Unlimited accounts, commitments, loans, goals, insights, decision preview, import, history |
| **Household** *(Phase 3)* | ₹299/month | Two people, two salary cycles, shared goals |

**Why ₹199:** roughly a streaming subscription. Below the threshold where a salaried
person deliberates. Against a ₹5,000 late fee or one avoided bounce charge, it pays for
itself in a single month.

**Why not freemium-heavy:** the value only appears once commitments and accounts are
loaded. A free tier that permits a full setup gives away the entire product. The free
tier must demonstrate the *idea* and withhold the *capacity*.

**Free trial:** 30 days, full features, no card. This product cannot be judged in less
than one complete cycle — that is not a growth tactic, it is a property of the product.

---

## 4. Unit economics — rough

| | |
|---|---|
| ARPU | ~₹1,600/yr net of taxes and payment fees |
| Infra cost/user/yr | ₹120–₹250 (managed MySQL + small app tier) |
| Gross margin | ~85% |
| Break-even (solo, ₹40k/mo costs) | **~300 paying users** |
| Comfortable full-time | ~1,500 paying users |
| Meaningful business | 10,000+ |

**300 users is the number that matters.** It is reachable without paid acquisition,
which means this can be validated before it needs funding.

---

## 5. Why a user would keep paying after entering their data

The hardest question in PFM, asked honestly. Weak and strong answers:

| Reason | Strength |
|---|---|
| "My data is locked in" | **Weak** — and we will offer full export anyway |
| "It looks nice" | **Weak** |
| "It reminds me of due dates" | **Medium** — a calendar does this free |
| "It tells me what I can spend today" | **Strong** — needed daily, unavailable elsewhere |
| "It shows what a decision costs" | **Strong** — needed at the moments that matter most |
| "It knows my normal after 12 months" | **Strongest** — cannot be replicated by switching |

**The strategic consequence:** every roadmap decision should favour features whose
value *compounds with history*. That is what makes year two stickier than year one.

---

## 6. Go to market

**Phase 1 — one user (now).** The founder. No monetisation. The only question is
whether it survives daily contact with reality.

**Phase 2 — 10–20 users.** Friends and colleagues with EMIs. Hand-onboarded. Free.
The only metric that matters: **how many are still entering data in week 6?**

**Phase 3 — 100–300 paying.** Content-led. Not "10 budgeting tips" — the actual
arithmetic: *"Your salary is ₹57,700. Here is why ₹32,000 in your account means ₹8,000."*
That post writes itself and speaks precisely to the target user.

Channels worth testing: personal-finance communities (r/IndiaInvestments, r/personalfinanceindia),
Twitter/X finance India, YouTube creators in the space. **Not** paid ads — CAC will
exceed LTV at this price point.

**Phase 4 — scale.** Only after retention is proven. If week-6 retention is under 40%,
scaling is setting money on fire.

---

## 7. What could kill the business

| Risk | Severity | Mitigation |
|---|---|---|
| Manual entry kills retention | **Critical** | Obsess over capture friction; AA in Phase 4 |
| Indian consumers won't pay for PFM | **Critical** | Validate at 20 users before building for scale |
| A neobank ships Real Balance | High | Move faster; independence is the durable edge |
| Solo-founder capacity | High | Ruthless MVP; do not build for Rohit |
| Trust — "why give you my finances?" | High | Local-first option, full export, no data sale, plain privacy policy |
| Regulatory (if AA is added) | Medium | AA has a clear licensing path; stay a consent-based FIU |

---

## 8. Deliberately not decided yet

- Mobile app vs responsive web *(leaning: responsive web first, native later)*
- Self-hosted / local-first tier for privacy-maximalist users
- B2B2C via employers as a financial-wellness benefit — plausible, distracting
- Whether the free tier should exist at all

**None of these change what we build first.** Revisit at 20 users.
