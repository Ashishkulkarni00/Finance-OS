# Open Questions

Only decisions that **materially change what we build**. Everything else has been
assumed and recorded in `ASSUMPTIONS.md`.

Ordered by how soon an answer is needed.

---

## 🔴 Blocking Phase 1

### Q1 — Product name
`Kosh` (कोश, treasury) is a working name. Short, Indian, meaningful, and the `.in`
space is plausible. Not checked for trademark or domain availability.

**Needed:** before any public artefact. **Not** needed to start building.
**Default if you don't answer:** stays `Kosh` internally.

---

### Q2 — Do per-category budgets exist at all?

The Excel has a 20-category planned-vs-actual table. The product model splits money into
**committed** and **flexible** instead.

**The question:** once commitments are handled properly, does a user still need a
per-category budget — or is *"₹12,000 of flexible money this cycle"* plus a personal
baseline per category actually enough, and simpler?

**Why it matters:** this is the difference between a budgeting app and a cash-flow app.
It changes the Month screen, the domain model and the onboarding flow.

**My recommendation:** **ship without per-category budgets.** Show flexible spending
against *your own historical normal*, not against a number you invented in an optimistic
moment. Aspirational budgets are precisely what people fail and then abandon. Add them
only if their absence is genuinely missed after two cycles.

**Needed:** before Stage 2 of the build.

---

### Q3 — What happens to the existing spreadsheet during the transition?

Three options:

1. **Hard cutover.** Import history, stop using Excel. Fastest, riskiest.
2. **Parallel run for one cycle.** Both maintained; compare. Safest, doubles the work
   for a month — and doubling the work is exactly what kills the habit.
3. **Read-only Excel.** Keep it as an archive; all new entry in the app.

**My recommendation:** **option 3**, with a one-time import of everything from 28 Aug 2026.
Keep the workbook as a reference for two cycles, but do not maintain it. Option 2 sounds
prudent and in practice means neither system gets kept up to date.

**Needed:** before Stage 5 (import).

---

## 🟡 Needed for Phase 2

### Q4 — How honest should the decision preview be about goals?

If someone plans a ₹20,000 spend that delays their emergency fund by seven weeks, do we
say so plainly, soften it, or only show it if they ask?

**The tension:** Principle 1 (never be wrong) versus Principle 6 (never judge).
Stating the delay is honest. Repeating it every time is nagging.

**My leaning:** state it once, factually, without adjectives. Never repeat it after the
user has decided. **This is the hardest copy in the product** and is worth prototyping
with real wording before building.

---

### Q5 — Should the product ever suggest a course of action?

*"Your ZestMoney loan is at an unknown rate. Finding out could save you money"* is
useful and clearly safe.

*"Prepaying the bike loan saves ₹47,000 in interest"* is arithmetic — but starts to feel
like advice.

**Where is the line?** My position: **show arithmetic, never recommend.** Any sentence
containing "you should" does not ship. Presenting a comparison and letting the user
choose is not advice; ranking options for them is.

Also a regulatory consideration in India if the product is ever commercial.

---

## 🟢 Needed for Phase 3+

### Q6 — Local-first / self-hosted tier?
Would meaningfully differentiate on privacy and appeal to exactly the person who
currently keeps a spreadsheet. Also a large architectural commitment (sync, conflict
resolution). **Decide at 20 users, not before.**

### Q7 — Free tier: exist or not?
A free tier that permits full setup gives away the entire product, since the value only
appears once commitments are loaded. A 30-day trial may be strictly better.
**Decide when pricing is real.**

### Q8 — Household model: shared or linked?
One shared ledger, or two personal ones with a shared view? Affects the domain model.
**Meera-driven; not urgent.**

---

## Answered by assumption

Recorded in `ASSUMPTIONS.md`, revisit if wrong:

- Currency INR only · Timezone IST · Web-first, responsive
- Single income source in MVP · Manual entry only in MVP
- Salary cycle configurable, defaults to the 28th
- No AA integration before Phase 4

---

## What I did NOT ask you

Per the brief, these were decided rather than escalated:

| Decision | Chosen | Rationale |
|---|---|---|
| Repo location | `G:\FinanceOS\` — **not** inside `G:\Finance\` | Your real financial data must never end up in a code repository that could be pushed publicly |
| Nav structure | 5 items, Add as a centre action | See INFORMATION_ARCHITECTURE §4 |
| Accent colour | Deep teal | Every Indian bank is blue |
| Double-entry underneath | Yes | Makes double-counting impossible; invisible to the user |
| `user_id` from day one | Yes | Costs nothing now, saves a migration later |
| Amounts as strings over the wire | Yes | Float rounding in money is unacceptable |
| Testcontainers over H2 | Yes | H2 does not behave like MySQL where it matters |
