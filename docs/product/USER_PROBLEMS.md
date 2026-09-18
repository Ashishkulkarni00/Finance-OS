# User Problems

Ranked by **pain × frequency × how badly existing products serve it.**
P1–P5 are the MVP's reason to exist.

Evidence marked **[obs]** was observed directly during three days of real Excel use in
September 2026, not inferred.

---

## P1 — "My balance lies to me"

**The problem.** The bank shows ₹32,000. ₹24,000 is already spoken for. The user makes
spending decisions against a number that is wrong by 3×.

**Today they solve it by:** remembering. Which fails, roughly on the 25th.

**Frequency:** every single spending decision.

**Why nobody solves it:** trackers show balances and past spending. Budget apps assign
future money to categories but do not net out *already-committed, not-yet-paid*
obligations against *today's* balance. Simplifi's "Safe to Spend" is the closest
mainstream attempt and still works on calendar months.

**[obs]** The first time the real Real Balance was computed, it showed **₹8,000 free
against a ₹39,000 bank balance** — a gap of ₹31,000 the user did not know existed.

---

## P2 — "I don't know what's coming"

**The problem.** A due date arrives before the money is set aside. Or worse — an
auto-debit fails.

**[obs]** A ₹5,000 EMI was left in limbo for three days because the bank's app was
under maintenance and there was nowhere to record *"I think this went out but I cannot
confirm it."* Every product assumes payment status is binary. **Reality has a third
state: unverified.**

**Frequency:** 8–14 dated commitments per cycle for the primary persona.

---

## P3 — "The credit card double-counts my money"

**The problem.** Spend ₹5,000 on a card. Pay the ₹5,000 bill. Naive tracking records
₹10,000 of spending. The user's numbers become nonsense and they stop trusting the tool.

**Compounding it:** statement date and due date differ (21st and 10th here), so a
purchase on the 22nd is not due for 49 days. Users cannot hold this in their head.

**Frequency:** monthly, permanently.

**Why it matters more in India:** no-cost EMI conversion is ubiquitous. A single card
carries subscriptions, one-off spends, and multi-month EMIs simultaneously.

---

## P4 — "Entering data is a chore, so I stop"

**The problem.** Manual categorisation fatigue is the **top documented cause of
abandonment** in this category. Most personal finance apps lose the majority of their
users within the first month.

**[obs]** The real user logs faithfully on his phone — but the phone app has no account
field, so every row needed manual repair before it was usable. Two of three
reconciliation errors in the first week traced to this.

**The design consequence:** capture must be phone-first and near-zero-effort, and the
system must tolerate incomplete rows rather than reject them.

---

## P5 — "I can't tell if I'm getting better"

**The problem.** Month-to-month noise hides the trend. Without a baseline, the user
cannot distinguish a bad week from a bad habit.

**Frequency:** felt monthly; acted on rarely, because nothing surfaces it.

**Why it matters:** this is the difference between a tool used for two months and a
tool used for five years. It is also our retention moat — it cannot be delivered on
day one, only earned.

---

## P6 — "Nobody tells me what a decision costs"

**The problem.** "Can I afford ₹20,000 for the trip?" is answerable only as a
trade-off: against the goal date, the savings rate, the debt payoff. Every product
leaves the user to do this arithmetic themselves, so they do not do it.

**This is the highest-ceiling opportunity in the product** and the clearest reason
someone pays. Deliberately Phase 2 — it requires trustworthy baselines first.

---

## P7 — "My spreadsheet breaks silently"

**[obs]** In three days of real use, the workbook broke in six distinct ways:

| What happened | Consequence |
|---|---|
| A row inserted mid-table came without its formulas | ₹5,000 EMI invisible to every total |
| Formulas typed over with literal values | Committed under-stated by ₹7,500; safe-to-spend inflated 2× |
| Confirmation ticks with no expiry | Would hide ₹22,800 of obligations at the next cycle roll |
| A prepaid bill logged in the wrong cycle | Charged twice |
| An unlogged transfer | An account balance went negative |
| Ambiguity over an opening balance date | Possible double-count of an EMI |

**Every one of these is impossible by construction in a real application.** Not because
the app is cleverer — because the data model does not permit it.

---

## P8 — "I don't understand the words"

**[obs]** The user is intelligent, disciplined, and explicitly not a finance person.
He asked, in order: what do these six numbers mean; what does each sheet do; what do
these three columns mean; *"considering I am new to finance management and don't know
much of it."*

**The insight:** financial literacy is not a prerequisite we can assume. It is a
feature we deliver. Explanation must be **in the interface at the point of confusion**,
not in a help centre.

**This is a competitive opening.** Every product in this category assumes you already
know what "outstanding", "minimum due", "MAB" and "amortisation" mean.

---

## P9 — "Cash disappears from my records"

**[obs]** ₹17,000 of this user's emergency fund is physical cash. Cash withdrawals were
being logged as *expenses*, then the actual spending logged again — double-counting,
and the cash balance untracked entirely.

Most products treat cash as a rounding error. In India it is not.

---

## P10 — "My money is in the wrong account"

**[obs]** The user had enough money overall but ₹6,882 too little in the account that
three auto-debits would hit. Total-balance thinking hides this completely.

**Nobody solves this.** Per-account forward projection is genuinely novel and cheap to
build once commitments carry an account reference.

---

## Ranking

| # | Problem | Pain | Frequency | Unserved | MVP |
|---|---|---|---|---|---|
| P1 | Balance lies | High | Constant | High | **Yes** |
| P2 | Don't know what's coming | High | Monthly | Medium | **Yes** |
| P3 | Card double-counting | High | Monthly | Medium | **Yes** |
| P4 | Entry is a chore | Medium | Daily | Low | **Yes** |
| P7 | Silent breakage | High | Weekly | — | **Yes** (by construction) |
| P8 | Don't understand the words | Medium | Early | High | **Yes** |
| P9 | Cash vanishes | Medium | Weekly | High | **Yes** |
| P10 | Money in the wrong account | High | Monthly | **Very high** | **Yes** |
| P5 | Can't see improvement | High | Monthly | Medium | Phase 2 |
| P6 | Decision cost unknown | Very high | Occasional | **Very high** | Phase 2 |
