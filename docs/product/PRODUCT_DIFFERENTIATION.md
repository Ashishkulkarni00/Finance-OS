# Product Differentiation

**The question this document answers:** why would someone choose this over a
spreadsheet, over Monarch, or over the free app their bank already gives them?

---

## The one-line answer

> Every other product tells you what your money **did**.
> This one tells you what your money **can do** — and what it costs when you decide.

---

## Five differentiators that are actually defensible

### D1. Real Balance — the number nobody computes

Every product leads with a balance or a spending total. We lead with:

```
what you hold − what you've reserved − what you've committed = Real Balance
```

For the first real user this was **₹8,000 against a ₹39,000 bank balance.** A 5× gap
between what the bank said and what was true.

*Defensibility:* moderate. Simplifi is one decision away. But it requires modelling
commitments as first-class dated obligations with account references — a data-model
change, not a screen. Incumbents would have to rebuild their core.

### D2. The salary cycle

Financial life runs pay-date to pay-date. **Not one mainstream product supports this.**
All of them assume the calendar month.

For a salaried Indian paid on the 28th, a calendar-month view splits every single
month's money across two reporting periods. It is quietly wrong for hundreds of
millions of people.

*Defensibility:* low technically, high organisationally. It touches every aggregate in
the system. Retrofitting it into a mature product is a year of work nobody will fund.

### D3. Per-account forward projection

*"You have enough money. It is in the wrong account. ₹6,882 needs to move to IDBI
before the 13th."*

Total-balance thinking hides this completely. Observed as a real, live problem in week
one. **No competitor does it.** In India — where auto-debits fail, bounce charges bite,
and people run three or four accounts — this is a weekly save.

*Defensibility:* high. It requires commitments to carry account references *and* a
projection engine. Nobody has the data model for it.

### D4. Decision preview *(Phase 2 — the commercial engine)*

```
You are planning to spend ₹20,000.

  Room this cycle        ₹18,400 → ₹0 (₹1,600 short)
  Bangalore trip         Dec 15 → Jan 8   (3 weeks later)
  Savings rate           14% → 3%
  If it went to the bike loan instead: debt-free 2 months sooner

  You can afford this without borrowing.
  You are choosing it over faster progress on the trip.

  [ Proceed ]  [ Spread over 2 months ]  [ Reduce ]  [ Compare ]
```

No judgement. No recommendation. Just the trade-off, made visible.

*Defensibility:* **highest.** It requires the entire model to be correct first —
cycles, commitments, goals, debt schedules, baselines. It is not a feature that can be
bolted on. It is what the first eighteen months of correct modelling buys you.

### D5. It explains itself

The first real user is disciplined, intelligent, and explicitly not a finance person.
His questions, in order over three days: *what do these six numbers mean · what does
each sheet do · what do these three columns mean · "considering I am new to finance
management and don't know much of it."*

Every competitor assumes you know what "outstanding", "minimum due", "amortisation" and
"MAB" mean. **We treat financial literacy as a feature we deliver, not a prerequisite
we assume** — explanation at the point of confusion, tappable, in plain language.

*Defensibility:* low individually, high as a cultural commitment. It is a thousand
small writing decisions competitors will not make.

---

## The structural advantage: independence

| Product | Revenue from | So the product wants you to… |
|---|---|---|
| Jupiter, Fi | Banking + lending | Bank with them, borrow from them |
| axio, Money View | Lending | Take a loan |
| INDmoney, ET Money | Investment distribution | Invest through them |
| Cred | Card ecosystem, rewards | Spend on cards |
| Empower | Wealth management AUM | Hand over assets |
| **Kosh** | **The subscription** | **Need us less, and stay anyway** |

Every Indian competitor's revenue rises when the user's liabilities rise.

**We can tell a user to take on less debt. They structurally cannot.**

This is the single hardest thing for an incumbent to copy, because it is not a
feature — it is a P&L.

---

## Versus the spreadsheet it came from

The spreadsheet is a real competitor. It works, it is free, and its owner built it.

| | Excel | Kosh |
|---|---|---|
| The thinking | Excellent | Same thinking |
| Silent corruption | **6 incidents in 3 days** | Impossible by construction |
| Phone capture | No | Yes |
| Loan amortisation | `TBD` — impractical by hand | Automatic |
| Baselines and trends | Manual | Automatic |
| Backup / history | One file, one drive | Versioned |
| Decision preview | Impossible | The core |

**The honest pitch to a spreadsheet user:** *keep your model. Lose the fragility.*

---

## What we are NOT differentiating on

Stated plainly so we do not drift:

- **Not automation.** SMS-scrapers and AA-connected apps beat us today.
- **Not aggregation.** A neobank with a licence wins that.
- **Not beauty alone.** Copilot is gorgeous and still passive.
- **Not AI.** Everyone claims it. It is a delivery mechanism, not a differentiator.
- **Not price.** Competing on cheap against products subsidised by lending is a losing game.

---

## The bet, stated so it can be proven wrong

> A meaningful number of salaried Indians with EMIs will pay a monthly subscription for
> a tool that tells them the truth about their money and what their decisions cost —
> **even though it requires manual entry** — because no free, automated alternative
> answers the question they actually have.

**Falsified if:** the first ten non-founder users abandon it inside a month because
entry is too much work. That is the primary risk, and it is why capture friction is a
day-one obsession rather than a Phase 2 polish item.
