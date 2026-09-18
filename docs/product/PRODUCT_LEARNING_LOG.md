# Product Learning Log

Observations from real use. **An observation is not a feature request.**

**The rule:** record it, name the underlying problem, and leave it. A pattern must
appear **three times**, or hurt badly **once**, before it earns a build. This log exists
specifically to stop the founder-as-user from building for their own edge cases.

**Format:** `date · what happened · underlying problem · verdict`
**Verdicts:** `WATCHING` · `BUILD` · `WON'T BUILD` · `RESOLVED`

---

## Pre-product: observed during Excel use, 06–08 Sep 2026

These are the founding observations. Every one is already reflected in the MVP.

| # | What happened | Underlying problem | Verdict |
|---|---|---|---|
| L1 | An inserted row lost its formulas; a ₹5,000 EMI vanished from every total | Users must not be able to create structurally invalid records | **BUILD** — derived at query time |
| L2 | Formulas typed over with literal values; Room Today showed ₹762 against a true ₹387 | Derived values must not be writable | **BUILD** — enforced |
| L3 | Seven confirmation ticks would hide ₹22,800 at the cycle roll | Manual overrides need an expiry tied to their period | **BUILD** — instance-scoped |
| L4 | A prepaid bill was charged twice | Cycle attribution must be explicit, and "settled earlier" is a real state | **BUILD** |
| L5 | An account went to −₹2,104 from an unlogged transfer | Impossible states should be surfaced immediately, not silently | **BUILD** — validation + alert |
| L6 | ₹6,882 short in one account while overall position was fine | Total-balance thinking hides per-account failure | **BUILD** — projection. *Nobody else has this* |
| L7 | "What do these six numbers mean?" | Financial literacy is a feature, not a prerequisite | **BUILD** — ambient explanation |
| L8 | "What do `_MandDue`, `_Unknown`, `_Sort` mean?" | Implementation detail leaked into the interface | **RESOLVED** — no helper columns exist in the product |
| L9 | Asked for borders "to focus on one thing at a time" | Visual grouping aids comprehension under cognitive load | **BUILD** — card-based layout |
| L10 | Asked for AutoSave; not available on a local file | Data loss anxiety is real and constant | **BUILD** — server persistence removes it entirely |
| L11 | "It will take some time to understand all of this" | The system was too complex to absorb at once | **BUILD** — progressive disclosure |
| L12 | Bank under maintenance; payment status genuinely unknown | Payment status is not binary. Reality has a third state | **BUILD** — `UNVERIFIED` |
| L13 | Logged spends in a phone app with no account field | Capture must be phone-first *and* account-aware | **BUILD** — mobile quick-add |
| L14 | ₹17,000 of emergency fund held as physical cash | Cash is a real account in India, not a rounding error | **BUILD** |
| L15 | Three loan principals still `TBD` because hand-calculation is impractical | Amortisation must be generated | **BUILD** |

---

## Post-launch observations

*(Empty. To be filled from real use of the application.)*

| # | Date | What happened | Underlying problem | Verdict |
|---|---|---|---|---|
| | | | | |

---

## Questions I keep asking about my own finances

Every repeated question is a candidate feature. Recorded verbatim, not paraphrased.

| Question | Times | Answered by |
|---|---|---|
| "How much can I actually spend?" | many | Real Balance ✅ |
| "What's coming up?" | many | Timeline ✅ |
| "Should I have this much in this account?" | 2 | Projection ✅ |
| "Am I doing better than last month?" | — | Phase 2 |
| "When will I be debt-free?" | — | Payoff timeline |

---

## Things I thought I wanted but didn't

The most valuable section, once populated. Guards against building on stated preference
rather than observed behaviour.

| Wanted | What actually happened |
|---|---|
| Per-category budgets | *TBD — the Excel has them; are they ever looked at?* |
| Charts on the home screen | *TBD* |
| Daily reminders | *TBD* |

---

## Review cadence

**Monthly, at cycle close.** Read the log end to end and ask:

1. What appeared three or more times? → candidate
2. What hurt badly once? → candidate
3. What did I record but never miss? → **WON'T BUILD**
4. What did I build that I don't use? → consider removing
5. What am I still doing outside the product? → the real gap

**Removing a feature is a valid outcome of this review**, and should happen at least
once before Phase 3.
