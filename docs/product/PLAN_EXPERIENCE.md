# The Plan Experience

**Written 2026-09-10.** Product concept for the **Plan** tab, written before its redesign
is implemented — same process as `MONTH_EXPERIENCE.md` and `ACCOUNTS_EXPERIENCE.md`.
Companion: `docs/design/PLAN_UX_SPEC.md`.

This isn't a new idea from scratch — `PRODUCT_STRATEGY.md` §3.4 already designed the
core of this screen (**STANDING**) and named Plan as its home, months before this document.
This is that concept, operationalised, plus the two sections already living here (Goals,
Commitment rules) and one more (History) reconsidered around it rather than left as three
unrelated stacked lists.

---

## 1. The question

Today = right now. Month = this cycle. Accounts = what I hold. Plan is the only screen
about **the future and the rules that generate the present** — genuinely two things, not
one:

1. **Where am I heading, and is it realistic?** — goals, trajectory.
2. **What are the rules of my system?** — the commitments that generate every cycle's
   worklist automatically, an engine you should be able to see and edit, not just watch run.

> *If I used this every day, what would I want when I click "Plan"?*

Not a goals list and a rules list shown side by side with no relationship. I'd want to be
told, honestly, **how I'm actually doing** — before I look at any individual goal — and I'd
want the rules that run my financial life to feel like something I control, not a read-only
printout of what the app decided.

---

## 2. STANDING — the hero this screen has never had

Today has Room Left. Month has the crux. Accounts has Net worth. Plan has **nothing** — three
flat sections with equal weight and no headline. `PRODUCT_STRATEGY.md` §3.4 already solved
this and it was never built:

> *Mirror the position → what's working → what you're exposed to → what would help most.*
> An **advisory posture**, not a score. No "Financial Health: 62/100" - that's the fintech
> cliché quality gate 13 exists to catch. Observations and consequences, never verdicts.

This is Plan's hero. Everything else on the screen becomes supporting evidence for it,
the same relationship Month's zones have to its crux.

### What's honestly computable today, and what isn't

The four parts of STANDING need genuinely different amounts of data:

| Part | Needs | Status |
|---|---|---|
| **Mirror the position** | This cycle's income + committed total | Both already exist - a small combine |
| **What's working** | Cross-cycle history (e.g. "nothing overdue in 2 cycles") | **Blocked** - zero closed cycles exist yet |
| **What you're exposed to** | Mostly this-cycle facts (committed share, a tight account) | Partly computable now |
| **What would help most** | Loan payoff dates, upcoming rule changes | Computable now (loan schedules already exist) |

**Honest consequence:** "What's working" cannot say anything true yet - there's no history
to point to. Rather than invent a claim, it states the same honest fact Month's early-cycle
state does: *too little history yet, said plainly, not hidden.* This mirrors exactly how
Month suppressed its own pace/outlook states before real data existed, and how Accounts
deferred its confidence label - the pattern by now is the product's own discipline, not a
one-off excuse.

---

## 3. Reusing what's already proven, not inventing a fourth design language

By this point the product has one visual grammar for "the hero fact" (label, hero figure,
one sentence - Room Left, the Month crux, Net worth) and one for "a flagged card" (amber
tint, chevron, opens the relevant detail). STANDING is the third hero in that same shape.
Its "what you're exposed to" items use the identical attention-card pattern as Month's
Needs You and Accounts' Needs a Look - not because every screen needs a copy of the same
component, but because a user who has learned "amber card with a chevron means something
needs me" should be able to trust that everywhere.

---

## 4. Goals — honest feasibility, still the second citizen

Already reasonably built (progress bar, required/month). What's missing, now that STANDING
exists above it: goals should read as **specific instances of the same honesty STANDING
practises generally**. `PRODUCT_STRATEGY.md`'s own example is the target to eventually
reach:

> ~~"Save ₹8,316/month to reach ₹2,00,000 by April 2028."~~
> **"₹8,316 a month gets you there by April 2028. Your recent surplus averages ₹4,100 - at
> that rate it's July 2029. Want to move the date, or the target?"**

That comparison needs cross-cycle surplus history - **blocked for the same reason "what's
working" is.** For this pass, Goals keeps its current honest, un-embellished framing
(required/month, no feasibility verdict) rather than a half-built comparison.

**Goals aren't clickable today and have no destination if they were** - no goal detail
route exists. Worth naming as a real gap, not silently left: a goal made of one reservation
and one target number doesn't yet have enough behind it to justify its own page. Deferred,
not forgotten.

---

## 5. Commitment rules — the engine deserves to look like one

Already correctly framed in copy (*"add a rule here and it generates itself onto This
Month every cycle"*) but still **read-only** - a known, previously-documented gap. This
pass doesn't build the edit flow (a full type-conditional form is its own scope, comparable
to Add), but it does fix something smaller and real: **rows currently give no indication of
whether they're interactive**, and per the session's established discipline (Month's
chevron fix, Accounts' warning-card fix), an element that isn't clickable should not read
ambiguously either way. This section is explicitly left non-interactive in this pass, and
should look that way rather than inviting a click that goes nowhere.

---

## 6. History — cycle over cycle, currently invisible

Correctly built, currently showing **nothing**, because zero cycles have been closed in
the dev database. This isn't a bug to fix - it's an honest empty state that's never been
exercised. Worth adding a real empty-state message rather than silently rendering nothing,
matching the discipline applied everywhere else on this page.

---

## 7. Concept exploration

### Concept A — "Three Lists" (what exists today)
Goals, then rules, then history, stacked with equal weight. *Rejected as the spine* - no
hero, no relationship between sections, exactly the "I'm not sure what this is showing me"
failure mode the whole redesign effort exists to fix.

### Concept B — "The Dashboard" (stat tiles for goals/rules/history counts)
A row of count tiles above the three lists. *Rejected* - `DESIGN_SYSTEM.md` §14 forbids
"a grid of equal-weight KPI tiles" outright, the same reason Month's Command Center concept
was rejected.

### Concept C — "Standing, then the record" *(chosen)*
STANDING as the hero (mirror → working → exposed → helps most), then Goals, then the Rules
engine, then History - each existing section now sits *beneath* an honest verdict about the
whole picture, rather than floating unexplained.

---

## 8. Jobs to be done

**Primary**
- How am I actually doing, honestly?
- What's working, and what am I exposed to?
- What would help most, if I did one thing?
- Are my goals realistic?

**Secondary**
- What rules generate my worklist every cycle?
- How has each past cycle actually gone?

**Explicitly not Plan's job**
- What do I need to do today? → Today / Month
- What do I hold and owe right now? → Accounts

---

## 9. Success criteria

Opens Plan and, without navigating away, can answer:
1. How am I doing, honestly - not just "fine" or "bad," but *why*?
2. What's one thing that would genuinely help?
3. Are my goals on a realistic path?
4. What rules is the system running on my behalf?

Negative test: nothing claims history it doesn't have. "What's working" and any
feasibility comparison stay honestly absent until real cross-cycle data exists - the same
discipline already proven on Month and Accounts.

---

## 10. What this needs from the backend

Computable today: committed-vs-income share (small combine of two existing totals), loan
payoff proximity (existing schedule data), goal progress (exists).

Needs adding: a server-computed "committed share of income" figure (never divided
client-side) · nothing else strictly required for step 1 - "what's working" and feasibility
comparisons are blocked on **data** (closed cycles), not backend capability, and should
wait for that data to genuinely exist rather than be built against nothing.
