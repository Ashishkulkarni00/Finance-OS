# Competitive UX Research

Researched September 2026. Sources at the end.

**Purpose:** extract principles, not screenshots. Every entry ends with what we adapt and
what we deliberately reject.

---

## The three findings that shape our design direction

### 1. Data density has been rehabilitated — hiding is not craft

The most useful correction in the 2026 literature, and it cuts directly against naive
minimalism:

> *Early mobile fintech design hid numbers behind taps out of design fear. The pendulum
> has swung back toward respect for the user's intelligence — the craft is in typographic
> hierarchy and grouping, not in hiding.*

> *A well-designed 2026 fintech screen can show a lot of financial information at once and
> still feel calm, because the important number is unmistakably the largest, the secondary
> details are grouped and quieted, and colour is used with restraint to mean something
> specific rather than to decorate.*

**What this changes for us.** Our instinct was to strip the Today screen down to one
number. That is the *wrong* correction. Arjun's Excel `Today` sheet showed six figures,
a card block, five over-budget categories, seven upcoming actions and eight attention
counters — and he found it *clarifying*, not overwhelming, because it was ranked.

**We rank aggressively. We do not hide.** Ambition: show as much as the Excel did, and
make it feel like a third of the information.

### 2. Design for a steady heart rate

> *Financial data is anxiety-inducing by nature. The 2026 move is to design for a steady
> heart rate: neutral defaults, alerts that are proportional, and colour used to inform
> rather than to alarm.*

This is the best three-word brief we could have: **steady heart rate.** It justifies the
neutral foundation, the single accent, proportional (not binary) alerting, and our
existing rule that "over Room Today" is amber and never red.

### 3. Craft compounds; ported design does not

Copilot won an **Apple Design Award**. The reason given repeatedly: it was built natively
for its platform from day one rather than ported from a web app, by engineers who chose
to compete on design quality alone. It is described as *"a clean interface that rewards
regular check-ins instead of punishing you with clutter."*

**That last phrase is a product requirement.** Opening the app daily must feel like a
reward, not a chore. It is also a warning: we are building responsive web first, and web-
first products are exactly what Copilot beat. Our mobile experience must be designed, not
narrowed.

---

## Product by product

### Copilot Money — the design benchmark
**Does well.** Apple Design Award craft. Per-user ML categorisation that makes daily
review genuinely fast. Investments and net worth presented in the same visual language as
everything else — no "advanced section" that looks like a different app.
**Does poorly.** Apple-only, US-only. **Passive** — beautiful reporting of the past.
**Adapt.** Consistency of visual language across simple and advanced areas. The
"rewards check-ins" feeling. Speed of the daily review loop.
**Reject.** Beauty without direction. It shows; it does not decide.

### Monarch Money — the completeness benchmark
**Does well.** Best-in-class breadth, joint accounts, net worth, genuinely good IA for a
product with this much in it.
**Does poorly.** Calendar months. Shows what happened, not what to do next. Now has a
$199/yr tier, which signals feature-stacking.
**Adapt.** How it handles breadth without collapsing — grouping and progressive depth.
**Reject.** The dashboard-of-everything instinct. Feature tiers that fragment the product.

### YNAB — the behaviour benchmark
**Does well.** The only mainstream product that reliably changes behaviour. A *method*,
not a tool. Strong community and teaching culture.
**Does poorly.** Steep learning curve. Envelope budgeting demands high discipline. The
interface is functional, not premium.
**Adapt.** That a product can have a point of view and teach it. Its refusal to be merely
a tracker.
**Reject.** Rigid envelopes. The guilt loop when a budget is broken. Complexity as a
gate to value.

### Simplifi — closest to our thesis
**Does well.** "Safe to Spend" — the nearest anyone comes to Real Balance. Cheapest of
the majors.
**Does poorly.** Calendar-month bound. Thin commitment model. Visually unremarkable.
**Adapt.** The validation that a forward-looking spendable number resonates.
**Reject.** Stopping at the number without the commitment engine underneath it.

### Indian apps — Jupiter · Fi · axio · INDmoney
**Do well.** Genuinely good automatic capture (SMS, Account Aggregator). Fast onboarding.
Native Indian number formatting and payment idioms.
**Do poorly.** Budgeting is a thin layer on a lending or banking product. Insight is
shallow because depth would not serve the funnel.
**Adapt.** Indian formatting conventions (**₹1,31,000**). The bar for capture friction.
**Reject.** Cross-sell surfaces. Any UI element whose purpose is to sell a product.

---

## Non-financial products worth studying

| Product | What to steal | For which screen |
|---|---|---|
| **Linear** | Speed as a design value; keyboard-first; restraint; a genuinely distinctive dark aesthetic | Overall craft bar |
| **Things 3** | Calm density. Lots of information, no anxiety. Best-in-class empty states | Today, Timeline |
| **Oura / Whoop** | Turning raw metrics into a narrative sentence; daily-return habit; progress that feels earned | Month Close, insights |
| **Duolingo** *(carefully)* | Progress made tangible | Goals — **without** streaks or guilt |
| **Stripe Dashboard** | Financial data at density with total calm; excellent tabular typography | Money, transaction lists |
| **Apple Health** | Layered depth — a glance that opens into detail without a different visual language | Layer 1 → 4 model |
| **Arc / Notion** | Distinctive identity without noise | Brand direction |

**The one to study hardest is Things 3.** It solves our exact problem — a lot of dated
obligations, presented so calmly that the list feels like relief rather than pressure.

---

## Patterns we deliberately reject

| Pattern | Everywhere in this category | Why we refuse it |
|---|---|---|
| Donut chart of spending by category | Universal | Answers "what proportion" — a question nobody actually asks |
| KPI tile grid (4–8 boxes) | Universal | No hierarchy. Everything equally important = nothing important |
| Red for every expense | Common | Spending is not failure. Violates steady heart rate |
| Streaks and badges | Rocket Money, Duolingo-influenced | Punishes the honest gap. Infantilising with real money |
| "You overspent!" alerts | Common | Shame closes apps |
| Confetti on a savings goal | Common | Cheapens a serious moment |
| Configurable widget dashboards | Monarch, Empower | An admission that the product could not decide what matters |
| Sparklines on everything | Common | Decoration mistaken for insight |
| A separate "Advanced" area | Common | Breaks the single visual language; signals the product has two personalities |
| Gradient hero cards | Indian fintech, universal | Reads as a marketing banner, not an instrument |

---

## What nobody in this category does — our openings

1. **A screen organised around a decision** rather than a period or an account
2. **Salary-cycle time** — every competitor is calendar-bound
3. **Honest uncertainty rendered beautifully** — "we don't know yet" as a designed state, not an error
4. **Per-account forward projection** — nobody visualises where money will be short
5. **Editorial voice in the interface** — insight as a sentence, not a chart caption
6. **A month-close ritual** designed as a moment rather than a report

**#3 and #6 are the two most likely to become the thing people remember.**

---

## Sources

- [Copilot Money Review 2026 — WalletGrower](https://walletgrower.com/blog/copilot-money-review-2026)
- [Copilot Money Review 2026 — Finny](https://getfinny.app/blog/copilot-money-review-2026)
- [Copilot vs Monarch 2026 — BudgetLabs](https://www.budgetlabs.io/blog/copilot-vs-monarch)
- [Fintech Design Trends 2026: What Actually Matters — WANDR](https://www.wandr.studio/blog/fintech-design-trends-2026)
- [Top 10 Fintech UX Design Practices 2026 — Onething Design](https://www.onething.design/post/top-10-fintech-ux-design-practices-2026)
- [7 Fintech UX Design Trends 2026 — Design Studio](https://www.designstudiouiux.com/blog/fintech-ux-design-trends/)
- [Fintech UI/UX Best Practices — The Skins Factory](https://www.theskinsfactory.com/uiux-design-blog/fintech-ui-ux-design)
