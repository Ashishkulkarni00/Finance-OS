# UI/UX Principles

**The authority for every screen.** Absorbs and replaces the earlier
`product/UX_PRINCIPLES.md`, which now points here.

Sixteen principles in four groups, then the quality gate. When two conflict, the lower
number wins.

---

## A. Truth — the foundation

### 1. Never be confidently wrong
If the data is incomplete, the interface says so. `—`, "needs a number", "unverified" —
never a plausible figure derived from a guess.

A budgeting app that *under-states* what you owe is worse than no app. **Confident
wrongness destroys trust permanently; visible uncertainty builds it.**

### 2. Every number is one tap from its proof
Tap any figure → what it is made of, down to the transactions. A number the user cannot
verify is a number they will not act on, and a product that is not acted on is a diary.

### 3. Unknown, zero, and empty are three different facts
They must look different. `—` is not `₹0` is not a blank row. Most products collapse all
three, which is precisely how they end up guessing.

### 4. The balance is a lie; Real Balance is the product
Never lead with an account balance. If a screen shows one without immediately showing
what is committed against it, that screen is wrong.

---

## B. Clarity — how information behaves

### 5. Rank, do not hide
Density is not the enemy — **flatness** is. Everything at the same visual weight means
nothing is important.

The 2026 research is blunt about this: hiding numbers behind taps was a design fear, not
craft. *The craft is in typographic hierarchy and grouping.* Arjun found his dense
spreadsheet clarifying because it was ranked.

**Show as much as the spreadsheet did. Make it feel like a third as much.**

### 6. One hero per screen
A single most important number, unmistakable within one second. Everything else is
supporting evidence. `Today` → Room Left. `Month` → net position. `Money` → net worth.

### 7. Four layers, always available, never in the way
```
1  Glance      the number, the state
2  Understand  what it is made of, in plain words
3  Explore     transactions, history, detail
4  Advanced    schedules, projections, analysis
```
A user must be able to live at layer 1 indefinitely. Nothing at layer 4 may obstruct
layer 1. Same visual language at every layer — **no "advanced section" that looks like a
different product.**

### 8. Insight → Explanation → Action, never Data → Chart → Data
Every insight must survive *"so what should I do?"*

| Never | Always |
|---|---|
| "Savings rate: 18.43%" | "You're keeping about 18% of your income this month — higher than your recent average." |
| "Dining +27%" | "Dining is ₹3,200 above your usual. Cutting ₹1,500 keeps the trip on track for December." |

If we cannot write the action sentence, we do not show the insight.

### 9. Explanation is ambient, not a help centre
Every term and number tappable for plain language, at the point of confusion.

The first real user asked, in order: what do these six numbers mean · what does each sheet
do · what do these three columns mean · *"considering I am new to finance management."*
His spreadsheet eventually needed a glossary and 61 tooltips. **Build that in from screen
one.** Financial literacy is a feature we deliver, not a prerequisite we assume.

---

## C. Feeling — the psychology

### 10. Design for a steady heart rate
The brief, in four words. Neutral defaults, **proportional** alerts, colour that informs
rather than alarms. Financial data is anxiety-inducing by nature; our job is to lower the
pulse.

Amber for "needs you". Red only for overdue and negative. Two semantic colours on screen
at once, maximum.

### 11. Never judge
| Never | Always |
|---|---|
| "You overspent" | "₹3,200 above your usual" |
| "Budget exceeded" | "This month ran differently from plan" |
| "Bad spending month" | "Here's what changed" |

Going over Room Today is normal, and the copy should say so. **A user who feels judged
closes the app — and then their finances get worse.** Non-judgement is retention strategy
as much as ethics.

### 12. Make progress tangible
Financial improvement is invisible by nature. The product's job is to make it felt.

| Instead of | Show |
|---|---|
| `Emergency fund ₹80,000` | `₹80,000 of ₹1,50,000 — foundation 53% built` |
| `Debt: ₹4,12,000` | `₹58,000 repaid since May. Debt-free Oct 2029` |
| `Net worth ₹3,36,000` | `+₹9,200 this cycle` |

Every month-close **must end on something that moved the right way** — even in a bad
month, debt fell or a goal advanced.

### 13. Encourage, never manipulate
**Yes:** visible progress · milestones · month completion · debt falling · stability improving.
**No:** streaks · badges · confetti · artificial urgency · fear-based nudges · guilt for
spending · aggressive notifications.

Streaks punish the honest gap — exactly the behaviour we need users to be comfortable
with. A product handling real money cannot afford to feel like a game.

### 14. Reward the visit, don't punish it
Copilot's most-cited quality: *"rewards regular check-ins instead of punishing you with
clutter."* Opening the app should feel like relief.

When nothing needs attention, say so as an achievement: **"Nothing needs you today."**
That is a designed state, not a wasted screen.

---

## D. Craft — how it behaves

### 15. Capture costs seconds, feedback is immediate
Under 5 seconds to log a spend; 3 taps for a repeat merchant. Amount is the only truly
required field.

**And the user must see the consequence** — Room Left counts down as the transaction
saves. That single 250ms animation is the mechanism that turns recording into awareness.
It is the most important motion in the product.

### 16. Restraint is the aesthetic
No gradients on data. No shadows by default. Two font weights. One accent. Motion only
where it carries meaning.

Premium in this category is not richness — it is **the confidence to leave things out**
while still showing everything that matters.

---

## The quality gate

No screen is done until every line is yes.

| # | Gate | Test |
|---|---|---|
| 1 | **Hero** | Can a stranger name the most important number in one second? |
| 2 | **Truth** | Does every number handle unknown, zero and empty distinctly? |
| 3 | **Proof** | Is every figure one tap from its breakdown? |
| 4 | **Action** | Does the user know what they can do next? |
| 5 | **Language** | Would a 25-year-old with no finance background understand every word? |
| 6 | **Tone** | Could any line make someone feel judged? |
| 7 | **Hierarchy** | Squint — do only 2–3 things stand out? |
| 8 | **States** | Are loading, empty, error, unknown and success all designed? |
| 9 | **Mobile** | Designed for the phone, or merely narrowed? |
| 10 | **System** | Tokens only — no one-off colours, sizes or spacings? |
| 11 | **Accessibility** | AA contrast, keyboard, 200% text, reduced motion? |
| 12 | **Forbidden** | Zero items from the DESIGN_SYSTEM §14 list? |
| 13 | **Identity** | Screenshot it with the logo removed — is it recognisably ours? |
| 14 | **Commercial** | Would this screen make someone more willing to pay? |

**Gate 13 is the hardest and the most important.** If the screen could belong to any
fintech product, the design has not started yet.

---

## The one-sentence test

> **Does this screen help someone understand their money, or does it merely display it?**

If the answer is "display", it is not finished.
