# User Journeys

Six journeys. J1 and J2 are the product; the rest support them.

---

## J1 — The daily glance *(≈20 seconds, 1–3× per day)*

**Trigger:** about to spend money, or habit.

```
Open → Today
   Room Left  ₹290
   Next up: SIP ₹2,500 on Sunday
   ⚠ IDBI ₹6,882 short before the 13th
Close
```

**Success:** they know whether to buy the thing. **Failure:** they have to think, tap,
or reconcile anything.

**Design consequences:** Room Left above the fold, no loading spinner on the hero,
alerts only when actionable.

---

## J2 — Capture *(≈5 seconds, 2–6× per day)*

**Trigger:** money just left.

```
Add → amount pad → 200
     category predicted: Drinks     [tap to accept]
     account: IDBI (last used)      [pre-filled]
     Save
→ Room Left drops to ₹90, visibly
```

**The critical detail:** the user must *see the consequence*. That feedback loop — spend
₹200, watch Room Left fall — is what turns recording into awareness. It is the entire
behaviour-change mechanism in one animation.

**Failure modes to design against:** required fields they do not know; slow save; a
category list that does not match how they think; no feedback.

---

## J3 — Settling a commitment *(≈15 seconds, 8–14× per cycle)*

**Trigger:** an EMI debits, a bill is paid.

```
Today → Needs you → "Credit-card bill ₹6,375"  [Mark paid]
   → account and amount pre-filled from the commitment
   → Save
→ status Paid; committed drops ₹6,375; Real Balance unchanged
```

**The teaching moment:** Real Balance does *not* move. The money was already set aside.
The product should say so, once: *"Your Real Balance didn't change — this was already
counted."* That single sentence teaches the core concept better than any onboarding.

**Special path — unverified.** When the bank cannot be checked:
`[I think it went out]` → status `Unverified`, still counted as owed, surfaced until
resolved. **No product does this. Real life needs it.**

---

## J4 — Month close *(≈5 minutes, monthly)*

**Trigger:** last three days of the cycle. The most important journey for retention.

```
1. Confirm balances        four accounts, tap to confirm or correct
2. Anything unresolved     unverified items, unmatched imports
3. What happened           in / out / saved / net · biggest movements
                           "Drinks ₹8,900 — your usual is ₹6,100"
4. What changed            debt −₹14,545 · net worth +₹9,200 · savings 8%
5. Next cycle              commitments roll forward
                           "Electricity has averaged ₹2,850. Yours is set to ₹2,500."
6. Close                   snapshot written, permanently
```

**Must end on progress.** Debt down, net worth up, a goal nearer — even in a bad month
something moved the right way. This is where the user decides whether the product is
worth another month.

---

## J5 — Onboarding *(≈15 minutes, once)*

The riskiest journey. Every step is a chance to lose them.

```
1. When are you paid?              → cycle. One question, huge payoff
2. Where is your money?            → accounts + balances. "Approximate is fine"
3. What leaves every month?        → commitments. The heavy step
4. Anything set aside?             → reservations
5. → Real Balance, explained line by line
```

**The rule:** show Real Balance the moment step 2 completes, even if it is wrong. Then
let each commitment they add make it *more true*. Value must arrive before the work does.

**Escape hatches everywhere.** "I'll add this later" on every step. A half-configured
product that is used beats a perfect one that is abandoned at step 3.

**Loans and cards are deliberately not in onboarding.** Prompted afterwards, once the
core number already works.

---

## J6 — The decision *(Phase 2 — the reason someone pays)*

**Trigger:** a purchase big enough to hesitate over.

```
Plan → What if I spend ₹20,000?

  Room this cycle       ₹18,400 → ₹0   (₹1,600 short)
  Bangalore trip        15 Dec → 8 Jan  (3 weeks later)
  Savings rate          14% → 3%
  Toward the bike loan instead: debt-free 2 months sooner

  You can afford this without borrowing.
  You're choosing it over faster progress on the trip.

  [ Proceed ]  [ Spread over 2 months ]  [ Reduce ]  [ Not now ]
```

**Never recommends.** Shows the trade-off, offers options, respects the choice. If the
user proceeds, no guilt — the plan simply updates.

---

## The emotional arc

| Stage | Feeling | Delivered by |
|---|---|---|
| Day 1 | *"Oh. That's what I actually have."* | Real Balance |
| Week 1 | *"I'm not going to be surprised."* | Timeline |
| Month 1 | *"I know where it went."* | First close |
| Month 3 | *"I know what normal looks like."* | Baselines |
| Month 6 | *"I'm getting better at this."* | Trends |
| Year 1 | *"I can't manage money without this."* | Everything compounding |

**Month 3 is the retention cliff.** Novelty is gone, habit is not formed, and baselines
are only just becoming useful. Everything in Phase 2 exists to get the user across it.
