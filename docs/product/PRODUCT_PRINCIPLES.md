# Product Principles

Ten rules. Each one is a tie-breaker for a real decision, not a slogan.
When two principles conflict, the lower number wins.

---

## 1. Never be confidently wrong

If the data is incomplete, say so. Show `Needs a number`, `Unverified`, `Not set` —
never a plausible figure derived from a guess.

**Test:** can the user point at any number and ask "where did this come from?" and get
a complete answer in one screen?

**Inherited from the Excel**, where this rule already exists and already earned its
keep: when a mandatory commitment had no amount, Room Today refused to compute. A
budgeting app that under-states what you owe is worse than no app.

---

## 2. Every number must be traceable

No black boxes. Tap any figure and see what it is made of, down to the transactions.

A user who cannot verify a number will not trust it. A user who does not trust the
product will not act on it. A product that is not acted on is a diary.

---

## 3. The balance is a lie; the Real Balance is the product

Never lead with an account balance. Lead with what is genuinely available after
reserved money and outstanding commitments.

If a screen shows a bank balance without immediately showing what is committed against
it, that screen is wrong.

---

## 4. Anchor to the salary cycle, not the calendar

The financial month runs from the user's pay date to the day before the next one.
Configurable per user; defaults to the calendar month only when we genuinely do not know.

Everything follows: cycles, budgets, comparisons, history, month-close.

---

## 5. Insight without an action is decoration

Every insight must survive the question **"so what should I do?"**

| Do not ship | Ship |
|---|---|
| "Dining is up 27%" | "Dining is ₹3,200 above your usual. Cutting ₹1,500 keeps your savings goal on track." |
| "You have 4 subscriptions" | "₹1,240/month on subscriptions you have not used in 60 days." |

If we cannot phrase the action, we do not show the insight.

---

## 6. Awareness, never shame

The product observes; it does not scold. No red frowning faces, no "you overspent
again", no streak-breaking guilt.

| Banned | Use instead |
|---|---|
| "You overspent" | "You're ₹4,200 above your usual level" |
| "You failed your budget" | "This month ran differently from the plan" |
| "Bad month" | "Here's what changed" |

Going over Room Today is normal, and the product should say so plainly. A person who
feels judged closes the app and does not come back — and their finances get worse, not
better. Non-judgement is a retention strategy as much as an ethic.

---

## 7. Progressive disclosure — simple surface, deep underneath

A first-time user sees one number and three actions. A user two years in can reach
loan amortisation and net-worth history.

Nothing advanced is deleted; it is layered. Depth is opt-in, never in the way.

---

## 8. Entry must cost seconds, not minutes

Manual categorisation fatigue is the single largest cause of abandonment in this
category. Every second of data entry is a withdrawal from the user's patience.

Targets: **under 5 seconds** to log a spend. **Zero typing** for anything recurring.
The best transaction is the one the user never has to enter.

---

## 9. Money must never be counted twice

A card purchase is spending, once, when swiped. Paying the card bill settles a debt and
is not spending. A cash withdrawal is not spending. A transfer between your own accounts
is not spending. An investment is not spending.

The domain model enforces this. It is not a validation rule bolted on afterwards —
it is the shape of the data. See `DOMAIN_MODEL.md`.

---

## 10. Historical data must make the product better, not just bigger

Month 12 must be more valuable than month 1 — better baselines, better forecasts,
better plans. If accumulated history only makes the database larger, we have built a
filing cabinet.

This is also our retention moat: the switching cost is the accumulated understanding,
not the stored rows.

---

## Applying these

Before any feature ships:

1. Which principle does it serve?
2. Which principle does it strain?
3. What does the user *do* differently because of it?
4. What happens when the underlying data is missing or wrong?
5. Could this make a user feel judged?

If 3 has no answer, it does not ship.
