# Excel Gaps & Product Opportunities

Two kinds of gap:
**A. Structural** — Excel *cannot* do it, and the failure is silent.
**B. Opportunity** — Excel *could*, but the effort means the user never will.

The Class A list is not theoretical. Every entry was observed in the first three days
of real use.

---

## CLASS A — Silent failures observed in production

### A1. A row inserted mid-table loses its formulas
A ₹5,000 EMI was entered and became **invisible to every total** — the cycle column was
blank, so no aggregation matched it. The row looked perfect on screen.

*In the product:* rows have no formulas. Derivation happens at query time. **Impossible.**

### A2. Formulas overwritten by typed values
Two cells were typed over with literal amounts, believing that was how you mark
something paid. Result: committed under-stated by ₹7,500, **Room Today inflated 2×**
(₹762 shown against a true ₹387).

*In the product:* derived values are not editable. **Impossible.**

### A3. Manual confirmations never expire
Seven `Confirmed?` ticks were live on 08 Sep. On the 28th they would have hidden
**₹22,800** of genuine obligations on day one of the new cycle.

*In the product:* a confirmation belongs to a `CommitmentInstance`, which belongs to a
cycle. It cannot leak. **Impossible.**

### A4. No duplicate detection on import
Overlapping export date ranges double-count with no warning. The user must remember
where the last import stopped.

*In the product:* content-hash + fuzzy match at staging. **Detected before commit.**

### A5. One global "balance as at" date
All accounts share one anchor date. When one bank was under maintenance, its balance
was uncertain while others were known — unrepresentable. Left a possible ₹5,000
double-count unresolved for two days.

*In the product:* per-account anchoring with its own confidence. **Representable.**

### A6. Cross-account shortfall is invisible
Total balance looked fine; one account was **₹6,882 short** of the auto-debits about to
hit it. Nothing surfaced this.

*In the product:* per-account forward projection to the next pay date. **The single
highest-value thing on this page.**

### A7. Cycle attribution errors are undetectable
A bill prepaid in an earlier cycle, logged in the current one, was charged twice. Only
caught because the user happened to mention it in conversation.

### A8. Row order matters
Adding at the bottom works; inserting in the middle silently breaks. A user should
never have to know this.

---

## CLASS B — Possible in Excel, but nobody will do it

| # | Opportunity | Why Excel fails | Value |
|---|---|---|---|
| B1 | **Loan amortisation** | Requires a schedule per loan; impractical by hand | Three loans sit at `TBD`. Net worth is therefore unknown |
| B2 | **Payoff & prepayment simulation** | "If I pay ₹10,000 extra, when am I debt-free?" | Highest emotional value for a user at 76% committed |
| B3 | **Net worth over time** | Needs a snapshot every cycle, forever | The single best long-term progress signal |
| B4 | **Personal baselines** | "Your usual is ₹X" needs rolling stats across cycles | Turns judgement into observation. Unlocks the entire insight layer |
| B5 | **Decision preview** | Cross-domain simulation | The reason someone pays for this |
| B6 | **Mobile capture** | Excel on a phone is unusable | The user already logs on his phone — in a *different app* |
| B7 | **Notifications** | Excel cannot reach out | P2 solved properly |
| B8 | **Search & filter across history** | Painful past a few hundred rows | Table stakes |
| B9 | **Auto-matching payments to commitments** | Excel needs a manual ID typed on every row | Removes the most tedious step |
| B10 | **Ambient explanation** | 61 tooltips took a dedicated build and cannot adapt | P8 solved properly |
| B11 | **Variable recurring amounts** | One static number per rule | Electricity is never the same twice |
| B12 | **Multi-device, backup, history** | One file, one drive, no version history | Currently the user's largest un-mitigated risk |
| B13 | **Card statement attribution** | Cannot show a purchase's real due date | Removes genuine confusion about the 21st/10th cycle |
| B14 | **Guided month-close** | A 7-item manual checklist | The reflect step is where behaviour changes |

---

## Ranked by (value ÷ effort)

**Build first**
1. A1–A3, A8 — free. They vanish with a real data model
2. A6 per-account projection — novel, cheap, high value
3. B9 auto-matching — removes the worst chore
4. B6 mobile capture — protects the habit that already exists
5. B10 ambient explanation — cheap, differentiating, directly requested

**Build second**
6. B1/B2 amortisation and payoff — high value, contained work
7. B4 baselines — unlocks everything downstream
8. B3 net worth history — start snapshotting on day one; display later
9. B14 guided close

**Build later**
10. B5 decision preview — needs B4 first
11. B7 notifications — needs a reliable server-side cycle engine

---

## The uncomfortable truth

The Excel is **conceptually excellent and structurally fragile.** Its model of money is
better than most shipping products. Its implementation nearly produced a materially
wrong number on three separate occasions in seventy-two hours — and in two of those
cases the wrong number was *optimistic*, which is the dangerous direction.

**We are not rebuilding it because the thinking was wrong. We are rebuilding it because
the thinking deserves a substrate that cannot silently corrupt it.**
