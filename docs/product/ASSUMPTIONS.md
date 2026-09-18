# Assumptions

Decisions made without asking, per the brief. Each one is falsifiable and cheap to
revisit. If one turns out wrong, the entry says what breaks.

---

## About the user

| # | Assumption | Basis | If wrong |
|---|---|---|---|
| A1 | Primary user is salaried with a fixed pay date | Observed | Cycle model needs variable-income support — significant |
| A2 | Single income source in MVP | Observed | Multiple cycles per user — moderate |
| A3 | Will keep entering transactions manually | He already does, in another app | **Fatal to the thesis.** The core risk |
| A4 | Not a finance expert; wants to become competent | Observed directly, repeatedly | Explanation layer is wasted effort — cheap loss |
| A5 | Uses a phone for capture, a laptop for thinking | Observed | Rebalance the two surfaces — moderate |
| A6 | Values honesty over comfort in the numbers | Observed — he asked for the deficit arithmetic plainly | Soften the copy — cheap |

---

## About the market

| # | Assumption | Basis | If wrong |
|---|---|---|---|
| A7 | Enough salaried Indians share this problem to be a business | India's salaried, EMI-carrying middle class | Personal tool only — acceptable outcome |
| A8 | ₹199/month is inside the impulse range | Streaming-service comparison | Reprice; test early |
| A9 | People will pay for a tool needing manual entry, if it answers a question nothing else does | Untested | **The central commercial bet.** Falsified at 20 users if week-6 retention is under 25% |
| A10 | Neobank incumbents won't build this | Their revenue is lending; independence is structural | Compete on independence, or stop |
| A11 | AA will remain open to non-bank FIUs | 650 live FIUs today | Phase 4 is blocked; Phases 1–3 unaffected |

---

## About the product

| # | Assumption | Basis | If wrong |
|---|---|---|---|
| A12 | Real Balance is the killer feature | The ₹39,000 → ₹8,000 moment | Product has no centre — return to discovery |
| A13 | Committed-vs-flexible beats per-category budgets | Simplicity; abandonment research | Add budgets — moderate. See OPEN_QUESTIONS Q2 |
| A14 | Salary cycles matter enough to be a differentiator | Nobody offers it; Excel user built it by hand | Still correct, just not differentiating |
| A15 | Decision preview is what people pay for | Untested; strongest hypothesis in the doc | Phase 2 loses its centre |
| A16 | Month-close is the retention ritual | Behaviour-change literature; the reflect step | Find another recurring reason to return |
| A17 | Three cycles is enough for a useful baseline | Statistical judgement | Push insights to month 6 — timing only |

---

## Technical

| # | Assumption | Basis | If wrong |
|---|---|---|---|
| A18 | Single-user, single-tenant is enough for Phase 1 | Scope discipline | `user_id` is already everywhere — cheap |
| A19 | Derived-at-query-time is fast enough | ~1,200 transactions/user/year | Add a cache layer with explicit invalidation — planned for |
| A20 | Responsive web is enough before native | Cost; capture works fine in a browser | Native shell — moderate |
| A21 | MySQL is sufficient | Specified; relational fits double-entry | None foreseen |
| A22 | Manual valuation of investments is acceptable in MVP | Excel does this and it works | Add a price feed — contained |
| A23 | INR only, IST only | Single user | Multi-currency is a real change; multi-timezone is small |

---

## Deliberate omissions

| Not doing | Why | Revisit |
|---|---|---|
| Auth | Prototype; architected for | Phase 3 |
| Encryption at rest | Local prototype | Before any real deployment |
| Notifications | Needs a reliable cycle engine | Phase 2 |
| Bank sync | Manual first, to prove value | Phase 4 |
| AI | Needs a trustworthy model beneath | Phase 5 |
| Category budgets | May be unnecessary | After 2 cycles |
| Investment performance | Different product centre | Phase 3+ |

---

## The three that could kill it

Everything else is recoverable. These are not:

1. **A3 — the user stops entering data.** Every other assumption is downstream of this.
   *Mitigation:* capture friction is a day-one obsession, not a polish item.

2. **A9 — nobody pays for a manual-entry product.** The whole commercial thesis.
   *Mitigation:* validate at 20 users before building anything for scale.

3. **A12 — Real Balance is not actually the killer feature.** If it turns out to be a
   nice-to-have rather than the thing people organise their month around, the product
   has no centre.
   *Mitigation:* Phase 1 exit criteria test exactly this — does the spreadsheet go unopened?
