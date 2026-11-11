# Mobile audit — 2026-11-11

**Method.** Headless Chrome over CDP at an iPhone-sized viewport (390×844, DPR 2, touch
emulation), light and dark, against the live dev app and the user's real data, read-only (every
non-GET API call was blocked). I screenshotted every tab, every Money sub-tab, Summary, Ahead,
Settings, Import, Month close, and the account, goal and commitment detail pages. I also opened the
Add sheet, More menu, Settle sheet and the Standing sheet. A DOM pass measured overflow, tap
targets, text under 12px and truncated text. Screenshots are throwaway, in the session scratchpad.
**Status: findings + proposed fixes. Nothing changed. Decisions M1-M3 open (§6).**

The question asked: *what looks off, what needs to improve, what would make a user stop using
it, and does the user get what they want and act on it.*

---

## 1. Verdict

**Today works.** It opens on one figure, "₹128 to spend today", with the derivation
directly under it (Free ÷ Days = A day). That is the product's core idea, and it lands.

**Everywhere else, the user is asked to reconcile the app with itself.** The same idea (what's
left, what's owed, what needs me) appears on three screens under three names with three
different numbers. Each figure is defensible by its own definition, but the user doesn't see
the definitions, only the disagreement. In a product whose rule is *never be confidently wrong*,
this is the main reason someone would stop trusting it, and the step after that is to stop
opening it.

Technically the phone build is clean: **no horizontal overflow on any screen, and no console
errors or failed API calls.** Dark mode reads well. The problems are in meaning, repetition and
hierarchy, not in breakage.

---

## 2. What would make a user stop using it — ranked

### R1. Numbers that disagree across screens (trust)

| The user's question | Today | Month | Money | Elsewhere |
|---|---|---|---|---|
| What's left for me? | **Free ₹2,176** | Flexible ₹15,971 − spent ₹13,220 = **₹2,751** | **Yours to move ₹4,776** | Today: "₹3,101 short of usual" |
| What have I spent day-to-day? | — | **Spent ₹13,220** | — | Month › "Where day-to-day money went" **₹25,294**; Summary "Day to day ₹13,220" |
| What do I owe? | **Owed ₹3,07,071** | — | Overview **₹3,07,071 owed** | Debts: **Still to pay ₹3,68,782** |
| How many things need me? | Badge **3**; banner "**1 + 1 more**" | "Needs you **2 of 6**" | 1 in Needs a look | Settings: "3 need you" |

Each is a different quantity (before or after this cycle's bills, principal or principal + interest,
attention items or all open items). **The labels don't say so,** so the user concludes
the app is wrong. After that every number is suspect, including the right ones.

### R2. Headlines that alarm when nothing is wrong (emotion)

- **Money opens on Net worth −₹2,13,059, in large red.** The line under it says ₹2,23,384 of
  investments is *not included* because it's "held outside your accounts". Include it and
  net worth is about **+₹10,000**. The biggest number on the screen is a bookkeeping artefact,
  and it's red. The 2026-11-01 lesson (Net worth in ink, not red) was applied to Today's
  Standing tile but **not to the Money hero.**
- **Insurance: "Costs you a month ₹42,701".** The policy is stored as a ₹42,701 *monthly*
  premium, which is 74% of salary. It's almost certainly an annual premium, and the policy is
  also linked to a loan whose ₹3,998 EMI shows on Ahead. The app accepted and displays an
  implausible figure without asking. (This is a data and validation issue, not a layout one,
  but it shows up on the phone as a shock.)
- **Cards: "₹0 owed · 0% used"** sits next to "Credit available ₹87,098 of ₹1,31,000". ₹43,902
  of the limit is blocked by card EMIs, so "0% used" contradicts the line beside it.
- **Investments: "Grown by +₹771 0%".** A real 0.3% gain rounded to "0%" reads as broken.

People avoid apps that make them feel bad (the ostrich effect). Red alarms that turn out to be
artefacts teach the user to ignore red, and then the real alarms stop working.

### R3. The same alert, everywhere (nag fatigue)

"IDBI Saving account won't cover Petrol on 27 Nov" appears on **Today, Month (Needs you) and
Money (Needs a look)**. "Mobile recharges was due 10 Nov" appears **twice on the same Month
page**: as a Needs-you card with a Settle button, and again in Coming up with its own Settle
button. A user who sees the same card in three places learns to scroll past it, which is
exactly the dismissal this product is designed to avoid.

### R4. The forward view is buried and misnamed (value never found)

The differentiator, carrying commitments through time, lives at `/ahead`. The page is titled
**"Goals"**, it's reached from **More › Goals**, and its best content (Months ahead, where freed
money could go, lump sum) sits in **four collapsed rows at the bottom with truncated
subtitles**. Meanwhile the **Ledger**, the part every expense tracker has, holds a prime tab.
A new user will never find the reason to choose this app over a free one.

### R5. Entry effort (the documented #1 cause of abandonment)

Recording a spend takes amount, a "Spent on" text, a category dropdown, account and date.
The Ledger shows the user doing this **4-5 times a day** for repeat things ("Drinks", "Dining
Out", the same IDBI account). There's no "same as last time" path from Today. (Category and
account memory exists, `addMemory.ts`, but a repeat spend still means opening a sheet and
filling it in.)

### R6. Pages are long, and the content starts below the template

Every Money tab spends ~1,000px before its list: big "Money" title, tab strip, a row holding
only "?" and "+ Add", the hero, a 3-figure strip, an explanation paragraph, and a "Needs a look:
Nothing needs a look" card. On Cards, Debts, Investments and Insurance **the actual list starts
below the fold.** An empty-state card that says nothing is happening still costs ~180px.

---

## 3. What looks off — the visual layer

| # | Issue | Where | Why it matters |
|---|---|---|---|
| V1 | **The Add button covers the figures column.** Amounts are right-aligned, and the pill FAB sits exactly over them: "₹2,600 to leave", "clear by 5 Oct 2029", "₹2,15,07…", "₹7,500 put in" | every screen | In a money app the right edge is where the answer is |
| V2 | **Meaningful text truncated**: "from IDBI Saving a…", "₹25,000 must stay in · bank mini…", "debt-free Oct …", "next one 21 N…", accordion subtitles "the order m…", "see wh…" | Today, Money, Cards, Debts, Ahead, Month | Truncating a date or an amount hides the fact; wrapping is better |
| V3 | **3-column stat strips wrap raggedly at 390px**: "Opening balance · 28 Oct" (3 lines), "Card EMIs a month", "Set aside a month / Going in a month — Varies" | account, goal and card detail; Cards | Breaks the "aligned figures" bar the Excel set |
| V4 | **A serif display face appears in two places**: the commitment note "For travelling" as a giant heading, and the 404 title | commitment detail, 404 | Reads like another app |
| V5 | **₹128 printed three times in one card** (headline, sentence, "A day" tile) | Today hero | Repetition reads as filler, not craft |
| V6 | **Every Ledger row has the same red ↗ tile and a red minus sign** | Ledger, Coming up | Red for ordinary spending is a judgement (rule 8). The icon is the same on 95% of rows, so it tells the user nothing |
| V7 | **Small tap targets**: text links ~16px tall ("Back to Money", "+ Add a payment", "+ Set money aside", "+ One-off top-up"). Buttons measured 36px under touch emulation (the spec says 44px on coarse pointers; **verify on a real phone**, since headless pointer emulation may not apply). Tab labels are 11px | detail pages | Missed taps on a phone feel like the app not responding |
| V8 | **Number formatting drifts**: the Settle sheet shows "2000.00", everywhere else shows "₹2,000" | Settle sheet | Small, but it's the first number the user edits |
| V9 | **Copy reads like an accountant**: "₹12,654 more has gone out than by day 15 of 28 Sept – 27 Oct — this month is 48% through"; the goal's "Fits if" packs five figures into one sentence; "Mobile recharges *was* due" | Summary, Ahead, alerts | The plain-language bar from CLAUDE.md |
| V10 | **Month close is a dead end** before the cycle ends: a centred sentence on a blank page with no tab bar | /month/close | Looks broken |
| V11 | **Names drift**: tab "Months" opens "Month"; menu "Goals" opens `/ahead`; Money's 5th tab shows as "Insura" (it scrolls, but there's no other cue) | nav | Small, but the user notices |

---

## 4. Does the user get what they want, and act on it?

| What the user came for | Gets it? | Acts on it? |
|---|---|---|
| "Can I spend today?" | **Yes.** Today's hero, immediately | Yes. The derivation is one tap away |
| "What do I have to pay or do?" | Partly. Split across Today, Month and Money, with duplicates | The buttons exist (Settle, Move money), but the triple copies dilute them |
| "Record this spend" | Yes, in ~5 taps | Repeat spends aren't one tap |
| "Am I OK this month?" | Mixed. "Running tighter than usual: spend ₹183 a day under usual" next to "₹128 a day" means two daily numbers to follow | Unclear which one to obey |
| "Where am I heading?" | Hard to find (More › Goals, collapsed rows) | Rarely reached |
| "Where do I stand overall?" | Red −₹2.13L net worth that isn't real | Likely to feel bad and close the app |

---

## 5. Proposed fixes, in order (nothing built)

**P0: trust (do first; mostly wording and wiring, little layout)**
1. **One vocabulary for "left".** Pick one name for the spendable remainder ("Free" on Today)
   and show it identically on Month and Money. Every other remainder is then labelled *as a
   step towards it* ("before this month's bills ₹4,776 → after them ₹2,176"). The same goes for
   **Owed** (principal) vs **Still to pay** (all EMIs incl. interest): name both and show the
   gap. And one count for "needs you", one source, with the same number on badge, banner and Month.
2. **Net worth hero:** ink not red, and either include outside investments or don't headline
   the figure until it's complete (rule 3: an incomplete total must not read as a fact). → **M1**
3. **Plausibility checks at entry:** a premium over ~25% of income, or a monthly/annual mismatch,
   gets "Is this the yearly premium?". Fix the cards "0% used" to count EMI-blocked limit.
   Show "0.3%" instead of "0%".

**P1: one alert, one place**
4. An attention item lives **once**: Today shows the top one ("2 things need you →"); Month owns
   the full list; Money shows only items about *accounts*, without the repeated text. Inside
   Month, an item in Needs you isn't repeated in Coming up (or Coming up marks it "↑ above").

**P2: put the value where the thumb is** → **M2**
5. Bottom nav **Today · Month · Ahead · Money · More**, with the Ledger reached from Month
   ("Every entry →" already exists) and from the Add flow. Rename the Ahead page "Ahead". Open
   its best section by default instead of four collapsed rows.

**P3: craft pass (one sweep, small each)**
6. FAB: hide on scroll down, show on scroll up, or shrink to a round "+" button. Never over the figures column.
7. Wrap, don't truncate, any line that holds a date or amount. Accordion subtitles go.
8. 3-figure strips become 2 columns + 1 below at under 400px, or get shorter labels.
9. One typeface: drop the serif from commitment detail and 404.
10. Today hero: say ₹128 once. The sentence becomes "Nothing spent yet."
11. Ledger rows: ink for expenses, green for income, red only for overdue; replace the arrow
    tile with the category's initial/icon or remove it.
12. Text links get a 44px hit area; confirm the coarse-pointer 44px rule on a real phone.
13. Money tabs: merge the lone "? + Add" row into the hero line; hide "Nothing needs a look"
    cards (silence is the empty state).
14. Settle sheet formats the amount like everywhere else; Month close before cycle end shows
    a real page (what will close, when) with the tab bar.

**P4: entry effort** → **M3**
15. "Again?" chips on Today: the last 3-5 repeat spends (e.g. "Drinks ₹240 · IDBI"), with one
    tap to record and a quick undo. No schema needed.

---

## 6. Open decisions

- **M1.** Net worth: include investments held outside accounts in the headline, or stop
  headlining net worth until it's complete?
- **M2.** Bottom nav: swap Ledger out for Ahead (Ledger reached via Month and Add)?
- **M3.** "Again?" quick-repeat chips on Today: yes or no?

P0 items 1 and 3 and all of P3 need no product decision and no schema.
