# The Month Experience

**Written 2026-09-10.** Product concept for the **This Month** tab, written before any of
its redesign is implemented. Companion to `docs/design/MONTH_TAB_UX_SPEC.md` (the how).

This document deliberately does not start from `Finance.xlsx`. The workbook is evidence of
how one person tracks a cycle with a grid; it is not the specification. Where the brief
that prompted this document proposed a solution, §9 says where I disagree and why.

---

## 1. The question, and my answer

> *If you used a personal financial operating system every day, what would you genuinely
> want to see when you clicked "This Month"?*

Not a report of what I spent. I'd want, in this order:

1. **Is this month going to work out?** — one sentence, and the number behind it.
2. **What needs me, and what happens if I ignore it?**
3. **What did I plan, and is reality matching it?**
4. **Where will I land if nothing changes?**

Everything else is evidence for those four, and belongs lower on the page or one
interaction away.

The deeper point: I would not come here to *read*. I'd come here **because something is
nagging me** — a bill I half-remember, a purchase I'm considering, a vague sense the month
is going badly — and I want that resolved in under thirty seconds. The Month tab's job is
to resolve the nag, then get out of the way.

---

## 2. When Month is actually opened

Design follows frequency and intent. Month is not one moment, it's four:

| Moment | Intent | What matters |
|---|---|---|
| **Salary day** | Plan | What's committed, what's left to work with, what's due when |
| **Weekly check-in** | Reassurance + catch-up | Has anything gone wrong since I last looked? Am I on pace? |
| **After a shock** (big or surprise expense) | Impact | What did that change? Am I still fine? |
| **Something is due** | Execute | Pay it, record it, understand the consequence of not |

The **weekly check-in is the dominant case** and the one to optimise for: short, low-intent,
needs an answer not a dataset. Salary-day planning is the second. Month Close handles the
end-of-cycle retrospective — Month should not try to be a retrospective too.

---

## 3. What makes Month different from Today and Accounts

The three screens overlap badly today because their jobs were never separated properly.
Two axes belong to Month and to no other screen:

1. **Time within a bounded cycle** — it has a start, a now, and an end. Today is a point;
   Accounts is timeless.
2. **Plan versus reality** — Month is the only place where "what was supposed to happen"
   can be compared with "what did."

> **Filter rule:** if a piece of information doesn't relate to the cycle's arc, or to
> plan-vs-reality, it does not belong on Month.

Applying it: commitments ✓, spending pace ✓, cycle in/out ✓, goal *contribution this
cycle* ✓ · account balances ✗ (Accounts), net worth ✗ (Accounts), overall goal progress ✗
(Plan), today's allowance ✗ (Today).

### The relationship between Today and Month

They currently duplicate. They shouldn't — they're two framings of **one** number:

```
Real Balance = held − reserved − committed        (already computed)

Today  →  "₹1,157 to spend today"      one day's slice of the pot
Month  →  "₹20,657 to reach the 27th"  the pot itself, and what's still draining it
```

Today divides; Month shows the pot and its claims. Same truth, two time horizons. That
removes the overlap without removing anything useful.

---

## 4. The crux

**Level 1 must be forward-looking, not backward-looking.**

"You've spent ₹36,043" cannot answer "how is my month going" — it's meaningless without
knowing what's still to come. The number that actually answers the question is:

> **₹20,657 free for the next 17 days** — after everything still committed.
> *About ₹1,215 a day.*

This is the crux because it is the only figure that (a) accounts for the future, not just
the past, (b) changes when the user acts, and (c) directly answers "can I spend?"

Paired with it, a one-line **verdict** — the interpretation, in plain words. Number =
fact; sentence = meaning. (Layout in the UX spec §2.)

### Savings rate is not the crux — and shouldn't be a headline here

Mid-cycle savings rate is actively misleading: salary lands on day 1, spending accrues
across 31 days, so the rate reads gloriously on day 2 and grimly on day 25 regardless of
behaviour. It's a **retrospective** measure. It belongs on Month Close and in trajectory,
not on a mid-cycle "what do I do" screen. The Excel headlines it; we shouldn't.

---

## 5. Jobs to be done

Month succeeds if a person answers these without opening another screen:

**Primary (must be answered in seconds, unprompted)**
- How is this month going?
- What needs my attention, and how urgently?
- How much is genuinely free to spend from here?
- What's still committed and when does it leave?

**Secondary (answered with one interaction)**
- Why is this obligation here, and what happens if I skip it?
- Did anything cost more than planned?
- Where is my discretionary money going?
- Where will I land at month end?

**Explicitly not Month's job**
- How did the cycle finish? → Month Close
- What do I own and owe? → Accounts
- Can I afford ₹8,000 right now? → Decide (planned; `PRODUCT_STRATEGY.md` §3.2)
- Am I improving over time? → Plan (trajectory)

---

## 6. The attention model

The brief's strongest challenge: **status is not attention.** "Pending" tells you nothing
about whether to act. Attention is a function of five things:

| Factor | Why it matters |
|---|---|
| **Consequence severity** | "Credit-score damage" ≠ "service cut off" ≠ "nothing, it's optional" |
| **Time pressure** | Overdue > due tomorrow > due in 3 days > due in 20 |
| **Certainty** | An unknown mandatory amount makes *every other number on the page* uncertain |
| **Blocking** | Unverified / needs-review items stop the system telling the truth |
| **Obligation** | Optional items never outrank mandatory ones |

### Three tiers — and only three

More than three and the ranking stops being legible at a glance.

**Tier 1 · Needs you** — act today.
Overdue + mandatory · mandatory with an unknown amount · needs review · due within ~2 days
and unpaid · the paying account is projected to fall short before the due date.

**Tier 2 · Worth knowing** — no action today, but don't be surprised later.
Due within ~7 days · partially paid · settled-but-unverified · a category running notably
ahead of its own pace · optional contributions still open.

**Tier 3 · Settled and quiet** — visible, low contrast, no action.
Paid and confirmed · optional and far out · anything already resolved.

**The same status lands in different tiers depending on time and consequence.** Pending is
Tier 3 at 20 days and Tier 1 at 1 day. That is the entire point.

### Consequence of adopting this

Grouping the list by *status* (Needs decision / Pending / Completed — what exists today) is
wrong; it should be grouped by **attention tier**. The status counts still matter for "where
does the cycle stand", but that's a summary, not an organising principle. Both survive:
counts in a compact progress line, the list ordered by attention.

### Attention should be computed server-side

Same reasoning as `CommitmentWorklistGroup`: if the client derives tiers, the rule drifts
between the list, the counts, and Today's "Needs You". One definition, one place.

---

## 7. Actual, Planned, Projected — three states of a number

These must never be visually confused. It's the difference between a fact, an intention,
and a guess, and conflating them is precisely how a finance product loses trust.

| State | Meaning | Certainty |
|---|---|---|
| **Actual** | It happened. Recorded. | Certain |
| **Planned** | It's supposed to happen. From a commitment rule. | Committed, not certain |
| **Projected** | On current behaviour, it probably will. | Estimated — always labelled |

Rules:
- Every projected figure carries its qualifier in words ("on this pace", "projected"), never
  just a lighter colour. Colour alone fails accessibility *and* fails skim-reading.
- **No projection before day 3 of a cycle.** A rate derived from one day of spending is
  noise dressed as insight. Say so instead: *"Too early to project — check back in a few days."*
- A projection is never the crux. The crux is a fact (free money); the projection is context.

---

## 8. Concept exploration

Four directions considered, evaluated against clarity, financial intelligence, hierarchy,
daily usefulness, mobile, differentiation, and fit with `UI_UX_PRINCIPLES.md`.

### Concept A — "The Ledger of the Cycle"
Summary → plan vs actual → obligation table → category spending. A well-made version of
what exists, and of the workbook.
*Strength:* complete, familiar, scannable, easy to build.
*Weakness:* it's a **report**. The user assembles the judgement themselves — the exact thing
the brief says Month should stop being. Adds no intelligence.
*Verdict:* rejected as the spine. It's the fallback we already have.

### Concept B — "The Cycle Timeline"
Time is the organising metaphor: a spine from salary day to salary day with *now* marked,
obligations positioned along it, money summary riding above.
*Strength:* makes "where am I in the cycle" visceral; the salary-cycle is this product's core
differentiator, so leaning on it is on-brand and memorable.
*Weakness:* timelines are dense-hostile — several items on one date collide, amounts are hard
to compare along an axis, and it degrades badly on mobile. Beautiful, low information rate.
*Verdict:* rejected as the spine, **adopted as a component** — a slim cycle band that
establishes "now" in one line (§13 of the brief, and it earns its place).

### Concept C — "The Briefing"
Answer first, evidence after. Opens with the crux number and a plain-language verdict, then
attention-tiered items, then the plan and pace as supporting evidence, then the outlook.
*Strength:* answers "how is my month going" in seconds — the actual job. Matches the
product's honest editorial voice (the serif line already exists in the design language).
Strongly differentiated: competitors open with charts, this opens with a sentence that
means something. Scales down to mobile cleanly (it's a stack, ordered by importance).
*Weakness:* leans on copy quality — a bland or wrong sentence undermines trust; needs enough
data to say something real.
*Verdict:* **chosen.** The weakness is mitigable (§8.1); the strength is the brief's stated goal.

### Concept D — "Command Center" (multi-panel cockpit)
A grid of equal panels: position, obligations, spending, goals, projection — everything at once.
*Strength:* density; one glance for everything.
*Weakness:* it is **flatness**, the failure mode `DESIGN_SYSTEM.md` §1 names explicitly, and
"a grid of equal-weight KPI tiles" is on the §14 forbidden list. Looks like every other
fintech dashboard — fails quality gate 13 (identity).
*Verdict:* rejected on the project's own principles.

### 8.1 Chosen direction — The Briefing, with a cycle band

> **Verdict + crux → what needs you → the plan and how it's holding → where you'll land.**

Mitigating the copy risk:
- Only assert what's computed; every sentence carries the number that justifies it, so it's
  checkable rather than oracular.
- When something is unknown, name the missing thing rather than hedging vaguely.
- Suppress the verdict entirely in the first two days and state the plan instead.
- Never a verdict that judges. "Tight" not "bad"; "ahead of your usual" not "overspending".

---

## 9. Where I disagree with the brief

Asked to challenge, so:

**The eight-step story (§16) is a good analysis and a poor page.** *Where I am → what
happened → what I planned → what changed → what needs attention → what remains → where I'm
headed → what to do* puts **attention fifth and action eighth** — below the fold, after the
user has read four sections of history. Invert it: attention belongs immediately under the
crux. And the middle four steps are four views of one dataset — they collapse into a single
Plan section with variance shown inline, not four sequential sections.

**Don't add a Priority field (High/Medium/Low).** The workbook needs one because a grid
can't reason about due dates and consequences. We can. Asking a person to hand-triage their
own bills is work the system should be doing — and a hand-set priority goes stale the moment
a date passes, while derived attention never does. **Derive attention; don't collect priority.**

**"Income expected vs received" shouldn't be two headline rows.** Only one case is
interesting: the salary hasn't landed. Show nothing when they match; speak up when they don't.

**No filter toolbar** (§11 asked me to judge). A typical cycle has 8–15 obligations.
Filtering a 12-item list is ceremony, and attention-ordering already puts the answer on top.
Every filter a user might reach for — overdue, upcoming, completed — is a visual group or a
two-second scan. Revisit only if the list routinely exceeds ~25 items.

**The month-close checklist doesn't belong on Month at all.** It's Month Close's business,
and most of its seven items are spreadsheet chores the app either automates or replaces
(§11 of `PRODUCT_STRATEGY.md`).

---

## 10. What to drop from the workbook model

- **Month-close checklist** → Month Close, mostly automated away.
- **The full 20-row category table including zeros** → signal over completeness; show only
  meaningful deviation, fold the rest into one line.
- **Internal helper columns** (`_MandDue`, `_Unknown`, `_Sort`) → obviously.
- **Transfers as a headline figure** → bookkeeping, not progress. Available in detail.
- **Savings rate as a headline** → misleading mid-cycle (§4).
- **Manual "Confirmed?" ticks** → explicit confirm actions with an audit trail.

---

## 11. What the workbook is missing that matters

Identified by asking what software can know that a grid cannot:

1. **Variance on settled items.** The bill came in at ₹2,850 against a planned ₹2,500. Both
   numbers already exist in our data and nothing surfaces the gap. This is the cheapest real
   insight available to us.
2. **The cost of an unknown.** The workbook counts unknown amounts; it doesn't convey that a
   single unknown mandatory amount makes *every* figure on the page uncertain. That should be
   loud, not a counter.
3. **Attention that ramps.** A static "Pending" for twenty days that flips to "OVERDUE" is a
   cliff. Attention should rise as the date approaches.
4. **The flexible pot.** No invented budgets needed: *income − committed − reserved −
   invested* is the discretionary money this cycle actually leaves. Derivable, honest, works
   from cycle one — and it's the denominator that makes "pace" meaningful.
5. **"What changed since you last looked."** The app knows when you last opened it; a
   spreadsheet can't. This is the single best answer to the weekly check-in moment.
6. **One recommended action.** The workbook lists everything at equal weight. Ranking is
   exactly what a system should do for you.
7. **Cycle-over-cycle context** — "commitments are ₹1,200 heavier than your usual." Deferred:
   needs history.

---

## 12. Safe-to-spend — the product definition

The brief asked for the definition before the formula. Ours already exists:

```
Real Balance = held − reserved − committed
```

That *is* safe-to-spend for the remainder of the cycle — with one honest gap: **optional
outflows aren't in `committed`.** A goal contribution the user intends but hasn't committed
to would make Real Balance overstate what's truly free.

The answer is not to silently subtract it. It's to show both:

> **₹20,657 free** for the next 17 days.
> *₹8,316 of that keeps your emergency fund on plan.*

Never subtract an optional item behind the user's back; never let them forget it either.

---

## 13. The cycle lifecycle

The same page must behave differently at different points in the cycle:

| Phase | Emphasis | Suppressed |
|---|---|---|
| **Days 1–2** | The plan: what's committed, what's free, what's due when | Pace, projection, verdict (no data yet — say why) |
| **Days 3–~75%** | Verdict, attention, pace | — |
| **Last ~25%** | Attention, outlook, "what to change before it ends" | Long-range planning |
| **After end date** | Close the cycle (invitation, not nag) | Pace, projection (the cycle is over) |

---

## 14. Decision intelligence — the roadmap this opens

Month is where the product first stops describing and starts advising:

- **Now:** variance on settled items · pace against the real flexible pot · attention ranking.
- **Next:** month-end outlook · the tightest point in the remaining cycle · one recommended action.
- **Later:** "since you last looked" · category behaviour vs personal history · goal impact
  of a decision · cycle-over-cycle commentary.

---

## 15. Success criteria

A person opens Month and, without navigating away, can answer:

1. Is this month going to work out? *(verdict + crux)*
2. How much is genuinely free from here? *(crux)*
3. What needs me today, and what breaks if I ignore it? *(Tier 1 + consequence)*
4. What's still committed and when? *(plan list)*
5. Did anything cost more than planned? *(variance)*
6. Where's my discretionary money going? *(pace + deviating categories)*
7. Where will I land? *(outlook)*

And the negative test, equally important: **nothing on the page is there only because we
have the data.**

### Honest gap between this design and today's backend

Computable now: crux, attention inputs, plan progress, variance (both figures exist),
category spend, cycle dates.
Needs new backend (small, listed in the UX spec §12): server-computed attention tier,
variance flag, flexible pot, spending pace, month-end outlook.
