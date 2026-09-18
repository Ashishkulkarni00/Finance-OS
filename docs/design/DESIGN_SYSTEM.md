# Design System

**Version 2** — supersedes the v1 sketch. Binding for every screen.

---

## 1. Visual philosophy — "Quiet Instrument"

The product is an **instrument**: precise, calm, honest, and free of ornament. A good
kitchen scale, a Braun clock, a well-made watch face. You trust it because nothing on it
is trying to impress you.

Three words, in priority order:

> **Honest · Calm · Precise**

**Honest** — the interface never implies more certainty than the data supports.
**Calm** — the design brief from the 2026 research: *design for a steady heart rate.*
Financial data is anxiety-inducing by nature; our job is to lower the pulse, not raise it.
**Precise** — tabular figures, aligned decimals, deliberate spacing. Craft signals that
the numbers behind it were treated with the same care.

### The rule that separates us from minimalism

**We rank. We do not hide.**

The 2026 research is explicit that hiding numbers behind taps was a design fear, not a
craft, and that density has been rehabilitated: *the important number is unmistakably the
largest, the secondary details are grouped and quieted.*

Arjun's Excel `Today` sheet showed six figures, a card block, five categories, seven
actions and eight counters — and he found it **clarifying**. The failure mode we guard
against is not density. It is **flatness**: many things at the same visual weight.

> **Ambition:** show as much as the spreadsheet did, and have it feel like a third as much.

---

## 2. Brand direction

| | |
|---|---|
| **Feels like** | A precision instrument. Warm paper, not cold glass |
| **Never feels like** | A bank portal · a trading terminal · an admin dashboard · a savings game |
| **Ground** | Warm off-white, not clinical white. The product should feel like a well-printed page |
| **Accent** | A single deep teal. Every Indian bank is blue; we are deliberately not |
| **Ornament** | None. No gradients on data, no glass, no glow, no drop shadows by default |
| **Memorable through** | Typography and restraint, not decoration |

---

## 3. Typography

Two families, with a strict division of labour.

```css
--font-ui:     'Inter', -apple-system, 'Segoe UI', sans-serif;
--font-serif:  'Instrument Serif', Georgia, serif;
```

### Inter — everything functional, and **all numbers**

```css
--num: { font-variant-numeric: tabular-nums slashed-zero; letter-spacing: -0.01em; }
```

`tabular-nums` **everywhere a number appears**, without exception. Proportional digits
make columns jitter and are the single fastest way to look amateur in a finance product.
`slashed-zero` because 0 and O appear side by side in account names and amounts.

### Instrument Serif — editorial moments only

Used for the **narrative voice**: the month-close headline, an insight sentence, an empty
state's opening line. It is where the product speaks like a person rather than a system.

**Never for numbers. Never for labels. Never for UI chrome.** Roughly one serif element
per screen, at most. Its scarcity is what gives it weight — and it is the thing that will
make a screenshot recognisably ours.

### Scale

| Role | Size / line | Weight | Family |
|---|---|---|---|
| Hero number | 44 / 48 | 600 | Inter, tabular |
| Editorial line | 28 / 34 | 400 | **Instrument Serif** |
| Section number | 24 / 30 | 600 | Inter, tabular |
| Row number | 16 / 22 | 500 | Inter, tabular |
| Title | 18 / 26 | 600 | Inter |
| Body | 15 / 24 | 400 | Inter |
| Label | 13 / 18 | 500 | Inter |
| Caption | 12 / 16 | 400 | Inter |
| Micro | 11 / 14 | 500, +0.04em, uppercase | Inter |

Two weights only in normal use — **400 and 600**. A third weight is a decision nobody can
defend later.

### Number craft — the details that signal care

```
₹10,021          currency symbol at 0.62em, muted, baseline-aligned
−₹1,200          true minus (U+2212), never a hyphen, never (parentheses)
₹10,021          whole rupees by default; paise only in ledger detail
—                em-dash for unknown. NEVER ₹0
₹1,31,000        lakh grouping via Intl 'en-IN'
₹1.2L / ₹4.5Cr   only in charts where space genuinely forbids the full figure
```

**Never** `10.0K` — that is a US convention and reads as a foreign product instantly.

---

## 4. Colour

A neutral foundation, one brand accent, three semantics, four muted domain hues.

### Neutrals — warm, not blue-grey

```css
--ground:   #FAFAF9;   /* page - warm off-white */
--surface:  #FFFFFF;   /* cards */
--sunken:   #F5F5F4;   /* wells, inactive */
--line:     #E7E5E4;   /* dividers */
--border:   #D6D3D1;   /* inputs, emphasis borders */
--ink-muted:#78716C;   /* captions */
--ink-soft: #44403C;   /* secondary text */
--ink:      #1C1917;   /* primary text, hero numbers */
```

### Brand

```css
--accent:      #0F766E;   /* actions, focus, the hero number */
--accent-hover:#0D9488;
--accent-wash: #F0FDFA;   /* selected rows, subtle emphasis */
```

### Semantic — meaning, never decoration

```css
--positive:  #047857;   /* improvement, paid, on track */
--attention: #B45309;   /* needs you. NOT danger */
--critical:  #B91C1C;   /* overdue, negative balance, genuinely wrong */
```

**Attention ≠ Critical.** Being over Room Today is **amber**. Red is reserved for overdue
obligations and negative balances. Proportional alerting is the steady-heart-rate rule.

### Domain hues — identity, not fill

Four money "worlds", each with a quiet identity colour:

```css
--commit: #52525B;   /* commitments - dutiful, neutral, heavy */
--goal:   #7C3AED;   /* goals & savings - aspiration, forward */
--debt:   #9A3412;   /* debt - clay. Warm and earthbound, NOT alarming */
--invest: #1D4ED8;   /* investments - long horizon */
```

**Usage rule:** a 3px leading rule on a card, an icon tint, a chart series, a status dot.
**Never a background fill, never a button, never large areas.** Domain colour identifies
a section; it does not decorate it.

**Debt is clay, not red, on purpose.** Debt is not an emergency — it is something being
worked down. Colouring it as danger every month is exactly the shame loop we refuse.

### The colour rules

1. Colour **never carries meaning alone** — always colour + label + shape/icon
2. No gradients on data. Ever
3. Income is **not** green and expenses are **not** red. Direction and label do that work
4. Maximum **two** semantic colours visible on a screen at once
5. Dark mode required — same tokens inverted; `--ground:#0C0A09`, `--surface:#1C1917`

---

## 5. Spacing & layout

8px base. Scale: `2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`.

| Token | px | Use |
|---|---|---|
| `space-1` | 4 | Icon → its label, hairline nudges |
| `space-2` | 8 | Inside a chip |
| `space-3` | 12 | Label → value |
| `space-4` | 16 | Row padding |
| `space-5` | 24 | Card padding |
| `space-6` | 32 | **Between sections — the calm comes from here** |
| `space-8` | 48 | Major blocks |

Content max-width **1120px**. Reading measure for editorial text **max 68ch**.

**Density, not sparseness.** Rows are 44–52px, not 72px. We are showing a lot; the calm
comes from the space *between groups*, not from padding inside them.

---

## 6. Components

**Card** — `--surface`, radius 12, `1px --line`. **No shadow by default.** Elevation only
for genuinely floating layers (sheets, popovers). A page of shadowed cards is the
generic-dashboard look we are avoiding.

**NumberDisplay** — the most-used component in the product.
```
LABEL                      micro, uppercase, --ink-muted
₹10,021                    tabular, size by role
of ₹12,000 · 84%           caption, --ink-muted
```
Tappable when it has a breakdown; affordance is a subtle underline on hover, never a chevron.

**Breakdown sheet** — how any number explains itself. Components listed with signs, a
rule, the total, then one plain sentence. Bottom sheet on mobile, popover on desktop.

**Row** — the workhorse for commitments and transactions. 48px, three zones:
`[domain rule 3px] [primary + secondary, left] [amount + status, right]`

**StatusPill** — `--sunken` background, coloured text, always a word. Never a bare dot.

**AmountPad** — the capture surface. 64px digits, thumb-reachable, ₹ pre-filled.

**ProgressBar** — 6px, `--sunken` track, domain-hue fill, always labelled with both
numbers (`₹80,000 / ₹1,50,000`) and never a bare percentage.

**Buttons** — Primary (accent fill), Secondary (border), Ghost (text). One primary per
screen. Height 44 desktop / 48 mobile.

**Inputs** — 1px `--border`, radius 8, accent focus ring 2px. Label above, never a
placeholder-as-label. Error text below in `--critical`, never a tooltip.

---

## 7. States

| State | Treatment |
|---|---|
| **Loading** | Skeletons matching final layout. **Never a spinner over the hero number** |
| **Empty** | Icon, one editorial line (serif), one sentence of why it matters, one action |
| **Error** | Plain sentence + the fix. Never a code, never a stack trace |
| **Unknown** | `—` plus "needs a number" and a link. Visually distinct from error — nothing failed |
| **Success** | Quiet. The number updates. **No confetti, no toast for routine saves** |
| **Offline** | Capture still works, queued. A banner, never a blocker |

The **Unknown** state is a designed, first-class state. Most products have no visual
language for "we don't know yet", which is why they guess instead.

---

## 8. Charts

**Default to a number.** A chart earns its place only when the *shape over time* is the
insight — which in this product is roughly four places: net worth, debt payoff, cycle
comparison, and category vs baseline.

**Rules**
- No gridlines. No legends where direct labels fit. No axis borders
- One series in accent; additional series in domain hues
- Never a pie or donut chart. "What proportion" is not a question anyone asks
- Bars over lines for discrete periods; lines only for genuine continuity
- Every chart has a **sentence above it** stating the takeaway. If you cannot write the
  sentence, delete the chart
- Sparklines only where they replace a number, never alongside one

---

## 9. Iconography

Lucide, 20px, 1.5px stroke, `--ink-soft`. Icons **label**, they do not decorate.

**Never:** stacks of coins, piggy banks, moneybags, dollar signs, rocket ships, up-arrows
on every positive number. Financial clip-art is the fastest route to looking cheap.

Each domain gets **one** consistent icon, used everywhere for that concept, so the icon
becomes a word in the product's vocabulary.

---

## 10. Motion

Restrained. 150ms feedback, 250ms transition, `ease-out`. Respect `prefers-reduced-motion`
absolutely.

**The one motion that matters:** on save, the hero number **counts** to its new value over
250ms. That is the feedback loop turning recording into awareness — the single most
important animation in the product, and worth the craft.

Everything else: a fade, a height transition, nothing that draws attention to itself.

**Banned:** parallax, bouncing, staggered card entrances, animated counters on page load
(a number that animates every visit is decoration; a number that animates *on change* is
information), confetti of any kind.

---

## 11. Responsive

| | Mobile ≤640 | Tablet 641–1024 | Desktop ≥1025 |
|---|---|---|---|
| Nav | Bottom bar, 5 items | Bottom bar | Left rail 240px |
| Today | Single column, hero above fold | Single, wider | Two columns |
| Month | Stacked sections | Stacked | Master-detail |
| Tables | **Become rows/cards** | Cards | Real tables |
| Add | Full-height sheet | Sheet | Centred modal |

**Mobile is designed, not narrowed.** It is the capture surface and it is where Copilot
beat every web-first competitor. A horizontally scrolling table on a phone is a failure,
not a compromise.

---

## 12. Financial data presentation rules

The rules that make this a finance product rather than a dashboard.

1. **One hero per screen.** Everything else is supporting evidence
2. **Never a bare percentage.** `18%` alone is noise. `18% — higher than your recent average` is information
3. **Every number carries its comparison** where one exists: against plan, against your normal, against last cycle
4. **Unknown is not zero.** `—` and `₹0` are different facts and must look different
5. **Never colour alone** for direction — a word or arrow always accompanies it
6. **Round for reading, not for accuracy.** Whole rupees in summaries; paise only in the ledger
7. **Always show what a number is *of*.** `₹80,000` becomes `₹80,000 of ₹1,50,000 · 53%`
8. **Time is always explicit.** "this cycle", "since 28 Aug" — never an unlabelled figure
9. **Negative numbers use a true minus and `--critical`**, but only where negative is genuinely bad — a spending row is not negative, it is spending
10. **The breakdown is always one tap away.** A number the user cannot verify is a number they will not trust

---

## 13. Accessibility

- WCAG **AA** minimum; **AAA** on the hero number
- Colour never the sole carrier of meaning
- Touch targets ≥ 44×44
- Full keyboard navigation on desktop; visible focus ring, never `outline: none`
- Screen-reader labels spell numbers naturally: *"Room left today, two hundred and ninety rupees"*
- Respect system text scaling to 200% without layout collapse
- `prefers-reduced-motion` disables the counting animation and all transitions

---

## 14. What this system forbids

A checklist to run against any screen before calling it done:

❌ A grid of equal-weight KPI tiles · ❌ A donut chart of spending · ❌ Gradient hero cards ·
❌ Shadows on every card · ❌ Three or more semantic colours at once · ❌ Red for ordinary
spending · ❌ Confetti or badges · ❌ Proportional (non-tabular) figures · ❌ `10.0K`
formatting · ❌ Placeholder-as-label · ❌ A chart without a takeaway sentence ·
❌ A number without a breakdown · ❌ A spinner over the hero number
