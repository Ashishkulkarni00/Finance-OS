# The in-app manual

Written 2026-09-26. **Status: Phase A and Phase B built and verified on screen.**
Branch `feature/documentation`.

## Where it stands (2026-09-27)

**67 topics · 17 categories · 65 worked examples · 4 topics marked `definitional` ·
57 `data-doc` anchors.** Builds clean, and the app boots clean.

The manual is its own mode on `/help/*` (app rail hidden, `← Back to Kosh` returns to the
last non-help route). Contextual help opens as an overlay over the live page. The 7 guide
sheets and 7 primers now read from 7 shared hub topics, verified strictly *not* thinner —
Debts' sheet grew from 1,633 to 3,824 characters of rendered text.

### The build-breaking incident, and why the check stays

A Sonnet subagent added `validateSections()`'s example rule — *throw unless a topic has a
worked example or is explicitly `definitional: true`* — and then **hit its session rate
limit partway through adding the examples themselves.** The validator throws at module load,
so the whole app stopped booting, not just the manual.

Ten topics were left failing and were finished by hand: worked examples for all four
`calculations` topics and all four `troubleshooting` topics, and `definitional: true` on the
two `faq` topics, which genuinely are a question list and a policy statement.

**The check is correct and stays.** A validator that throws is what made a half-finished job
impossible to miss; the alternative — a warning — would have shipped a manual with a third of
its topics missing the most useful block in it. The lesson is about sequencing, not about the
rule: **add the content first, then the check that enforces it.**

Worth knowing for anyone extending this: `vite build` does **not** execute the content module,
so it passes while the app is broken. The only real check is loading a page in a browser.

### Outstanding

- **`attention` and `faq` are thinner than the rest** (2 topics each). The agent was asked to
  bring them up to standard and ran out of session before doing so.
- **Anchor coverage is 57, not exhaustive.** The per-figure sweep in §4 "Coverage" is
  substantially done but some sub-figures remain untagged. The rule still holds: no anchor
  without an authored topic behind it.
- **Long-press (touch) has never been verified** — implemented to spec, no touch emulation
  was set up.
- **No visible help icon** was added to any existing page. `useHelp()` is exported and ready.

## Phase A — what was built (2026-09-26)

20 topics across 6 browsable categories, plus the machinery. Implemented by a Sonnet
subagent against this spec; **independently re-verified** here — `tsc -b --noEmit` and
`vite build` clean, and the behaviour below driven with real pointer input over CDP.

**Measured, not assumed:**
- `/today` carries 5 tagged anchors (`position.real-balance`, `position.room`, 3 ×
  `insight.item`).
- Right-click a tagged element → custom menu appears → URL becomes
  `/today?help=today.real-balance`, overlay open, **the page underneath still mounted**, rail
  still present. That last one is the whole design of §2 and it holds.
- Right-click ordinary text → **no custom menu**. The native menu is untouched.

**Two polish bugs found on screen and fixed after the handback** — both were duplication the
build could not catch:
- The overlay printed its title twice: once in its header bar, once as an H2 directly under
  it. `TopicView` gained `headingLevel="none"` for a surface that already names the topic.
- `/help` showed two identical search boxes, one in the sidebar and one in the main column.
  The home page now passes `searchInSidebar={false}`, so there is always exactly one and on
  home it is the prominent one.

**Deviation from §8 the implementer flagged, and it was the right call.** Three of the six
required anchors (`insight.item`, `loan.card`, `month.shape`) resolve, per §4's own table, to
categories §8 assigns to Phase B. Rather than have half the anchors open a placeholder, one
seed topic was written in each of `attention`, `loans` and `months`. They are deliberately
**excluded from `CATEGORIES`**, so the home grid and sidebar still honestly show six
categories; the seeds are reachable by anchor and direct link only.

**Found on the way: `features/today/components/FreeUntilSalaryHero.tsx` is dead code** — it
contains the "Free until salary" wording but is imported nowhere. `TodayPage` renders
`Pulse.tsx`. The first tagging attempt went into the dead file and the CDP check caught it.
Worth deleting, separately.

**Not done in Phase A:** no visible help icon was added to an existing page — `useHelp()` is
exported and ready, but §8 freezes the guide sheets and primers until the retrofit, and
there was no other natural slot. Long-press is implemented to spec but was **not** verified
end to end (headless touch emulation was not set up), so treat it as untested.

The brief: a new user opens Kosh for the first time and can understand every screen, fill
every form, and read every number without asking anyone. A patient financial guide built
into the product.

---

## 1. What already exists — read this before writing any content

Kosh is **not** undocumented. There is already a help layer of roughly 1,400 lines:

| What | Where | Shape |
|---|---|---|
| 7 **guide sheets** | `features/{accounts,debts,investments,ledger,month,plan,today}/components/*GuideSheet.tsx` | A modal per page. Already structured as data: `CASES` (question → answer), `BADGES` (label → meaning), `ELSEWHERE` (thing → where) |
| 7 **page primers** | `features/*/components/*Primer.tsx` | A dismissible strip at the top of a page: headline, detail, three `term → means` rules, and a link to the guide |
| `PagePrimer` | `components/PagePrimer.tsx` | The shared primer component, dismissal in `localStorage` |
| `InfoTip` | `components/InfoTip.tsx` | The ⓘ beside a form label |

**The content in these is accurate, in the right voice, and hard-won.** It was written
against real behaviour and corrected in use. Rewriting it from scratch would lose that and
produce a second description of Debts that drifts from the first within a month.

### The load-bearing decision: one source, two surfaces

All of it moves into the content layer in §3. Then:

- A **guide sheet** renders its topic's `qa` and `elsewhere` blocks — the fast answer, in
  context, unchanged for the user.
- The **manual** renders the whole topic — every block, for someone reading to learn.

They cannot drift, because there is one file. This is also what satisfies the brief's
maintainability requirement, so it is not extra work; it is the work.

### The lesson this has to respect

`CLAUDE.md`: *"Help belongs at the point of decision — on the page and in the form, not
behind a quiet link to a guide."* The user's own recorded feedback is that a guide behind a
quiet link **did not land**.

A manual does not repeal that. It serves a different reader: someone who has never seen the
product, who is *deliberately* reading. The daily user must keep being helped in place. So:

> **The manual never replaces a primer, an `InfoTip` or a guide sheet. It is where their
> content also lives, and where a stranger can read all of it in order.**

Any change that makes in-context help *thinner* because "it's in the manual now" is a
regression against the brief's own goal.

---

## 2. Two ways to read the same topic

This is the second load-bearing decision, and it resolves the hardest requirement in the
brief — *"do not unexpectedly discard user input"* when help is opened from a page.

| Mode | Route | When | What it must preserve |
|---|---|---|---|
| **Overlay** | current route + `?help=<topicId>` | Contextual: right-click, `?` key, a help icon, an empty state | **Everything.** Nothing unmounts |
| **Page** | `/help/...` | Browsing: the nav item, a link inside the manual, a bookmark | Nothing to preserve — the user chose to go there |

**Why overlay rather than navigate-and-return.** The brief asks help to preserve the route,
the tab, the scroll position, the open modal *and* unsaved form values, then return exactly.
Implemented as navigation, that is a serialise-and-restore problem with a long tail of bugs,
and the first thing it will get wrong is a half-filled Add-loan form.

Implemented as an overlay it is free: the page underneath never unmounts, so there is nothing
to restore. Closing the overlay is the "Back to where I was" action, and it cannot fail.

`?help=` is a **search param on the current route**, so browser back closes the overlay and
forward reopens it, and the URL is shareable. No history is destroyed.

**Scroll:** the shell pins `h-screen` and scrolls `<main>`, not the document
(`AppShell.tsx`). The overlay must not scroll `<main>` at all — it owns its own scroll
container. Nothing needs restoring.

---

## 3. The content layer

`src/features/help/` — plain TypeScript, no MDX, no new dependencies. Type-safe, greppable,
and searchable without an index build step.

```
features/help/
  types.ts                 the model below
  content/
    index.ts               CATEGORIES, TOPICS, the flat lookup, the search index
    getting-started.ts
    accounts.ts
    income.ts
    monthly-plan.ts
    spending.ts
    loans.ts
    cards.ts
    goals.ts
    investments.ts
    today.ts
    months.ts
    attention.ts
    corrections.ts
    calculations.ts
    faq.ts
    troubleshooting.ts
  contextMap.ts            data-doc key → topic id
  search.ts
  components/              renderers, one per block kind
  HelpOverlay.tsx
  HelpProvider.tsx
  useDocAnchor.ts
```

### The model

```ts
export type DocTopicId = string;      // 'loans.adding-a-loan'
export type DocCategoryId = string;   // 'loans'

export type DocBlock =
  | { kind: 'prose'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'fields'; intro?: string; items: DocField[] }
  | { kind: 'qa'; items: { question: string; answer: string }[] }
  | { kind: 'terms'; items: { term: string; means: string }[] }
  | { kind: 'example'; title: string; lines: { label: string; value: string }[]; note?: string }
  | { kind: 'callout'; tone: 'note' | 'warn'; text: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'elsewhere'; items: { thing: string; where: string; to?: string }[] };

export interface DocField {
  /** The exact label on screen. If it changes in the form, it changes here. */
  label: string;
  what: string;
  whereToFind?: string;
  example?: string;
  requirement: 'required' | 'optional' | 'auto';
}

export interface DocTopic {
  id: DocTopicId;
  category: DocCategoryId;
  /** Route slug. Full path is /help/<category>/<slug>. */
  slug: string;
  title: string;
  /** One sentence. Used on the category index, in search results, and as the overlay's
   *  subtitle. Must stand alone. */
  summary: string;
  /** Ordered position in the Start Here path, if it is on it. */
  startHereStep?: number;
  blocks: DocBlock[];
  related: DocTopicId[];
  /** Deep links into the product this topic describes. */
  seeInApp?: { label: string; to: string }[];
}
```

`requirement: 'auto'` is how the brief's *"what the application calculates automatically"* is
answered — as a property of each field, not a separate paragraph that goes stale.

### The section order every feature topic follows

The brief fixes this, and it should not be improvised per topic:

1. **What is this?** — `prose`, one or two sentences
2. **Why use it?** — `prose`, the real-life benefit
3. **What do I enter?** — `fields`
4. **How do I fill it?** — `steps`
5. **After you save** — `prose`
6. **How this helps** — `prose`
7. **Common mistakes** — `qa` or `callout`
8. **Related** — `related` + `elsewhere`

A renderer emits the headings; the content files supply the blocks in order.

---

## 4. Contextual help

### `data-doc`, and why right-click is narrowed

The brief asks for right-click help and also says not to interfere with the browser
unnecessarily. Those pull against each other, and the resolution is scope:

> **Only an element carrying `data-doc` intercepts the context menu. Everywhere else the
> native menu opens untouched.**

One listener on `document`, `e.target.closest('[data-doc]')`. No match → return, do nothing.
Match → `preventDefault()` and open a compact menu at the cursor with **"Read help about
this"** and the topic's title beneath it, so the user can see where they are about to go.

This keeps copy, paste, open-in-new-tab and inspect working on all the text in the app —
which, in a product full of figures a user will want to copy, matters.

### Reaching it without a mouse

Right-click cannot be the only door. All four open the same overlay:

| Door | Note |
|---|---|
| Right-click a tagged element | Desktop |
| **Long-press** a tagged element (~500ms) | Touch. Cancel on move or scroll |
| **`?`** key | Opens help for the current page. Ignored while an input, textarea or `contenteditable` has focus, or a modifier is held |
| A visible **help icon / "Learn more"** | On section headers, empty states, and form rows |

### Tagging

```ts
const docProps = useDocAnchor('loan.emi');   // → { 'data-doc': 'loan.emi' }
<div {...docProps}>…</div>
```

`contextMap.ts` maps the key to a topic id, so a tag is a stable product concept
(`loan.emi`) and the topic it resolves to can be re-pointed without touching components.
A key with no mapping must **warn in dev and do nothing in production** — never open a wrong
or generic topic. The brief is explicit: *"avoid showing the same generic documentation link
everywhere."*

### Coverage: tag everything that raises a question (revised 2026-09-26)

The table below was a *minimum*. The target is now **every figure, row, badge, status and
form on every screen** — if a new user could look at it and wonder "what is that?", it
carries an anchor.

The rule that keeps this from becoming noise: **an anchor must resolve to a topic that
answers that specific question.** Ten anchors pointing at one general page is worse than
three that land precisely, and the brief forbids it outright. So coverage grows with the
content, never ahead of it — a key with no authored topic must not ship.

Sweep, screen by screen: Today (each derivation line, Free this month, If income stopped,
Owed, Net worth, Needs you, Coming up, the goal push) · Months (the month line and each of
its terms, plan rows, Settle/Skip/Record it, day-to-day spending, Month close's five steps) ·
Ahead (each forecast month, unlocks, goals) · Money → Accounts (rows, balance, available,
net worth, the confidence label) · Cards (limit, available, blocked principal, statement,
unbilled, due date) · Debts (rows, EMI, outstanding, payoff date, unrecorded-EMI flag,
prepayment) · Investments (holdings, value check-in, gain) · Cover (policies, cover amount,
renewal) · Ledger (rows, type, category, import) · and every one of the 18 forms.

**The minimum tag set from Phase A** (each opens a genuinely different topic):

| Key | Where | Topic |
|---|---|---|
| `position.real-balance` | Today's Real Balance | `today.real-balance` |
| `position.room` | Today's Room | `today.room` |
| `insight.item` | Any `InsightRow` | `attention.what-needs-you` |
| `month.shape` | Months' MonthShape line | `months.the-month-line` |
| `month.plan-row` | A bill row in THE PLAN | `monthly-plan.settling-a-bill` |
| `loan.card` | A loan row on Debts | `loans.understanding-a-loan` |
| `loan.emi` | An EMI figure | `loans.what-an-emi-is` |
| `loan.outstanding` | Outstanding on a loan | `loans.outstanding-vs-remaining` |
| `card.statement` | A card statement block | `cards.statements-and-paying` |
| `card.available` | Available credit | `cards.available-credit` |
| `goal.card` | A goal | `goals.tracking-a-goal` |
| `goal.pace` | A goal's pace | `goals.is-it-on-track` |
| `investment.row` | A holding | `investments.sips-and-rds` |
| `account.balance` | An account balance | `accounts.balance-vs-available` |
| `networth.total` | Net worth | `accounts.net-worth` |
| `commitment.form` | Add/Edit commitment sheet | `monthly-plan.adding-a-commitment` |
| `loan.form` | Add/Edit loan sheet | `loans.adding-a-loan` |
| `account.form` | Create/Edit account sheet | `accounts.adding-an-account` |
| `transaction.form` | AddSheet | `spending.recording-an-expense` |

---

## 5. The manual UI

### Routes

```
/help                                    home
/help/:category                          category index
/help/:category/:slug                    topic
```

Registered **inside** `AppShell` so the rail stays visible and the user is never stranded.

### Home

Welcome line · what Kosh does in three sentences · **Start Here** (the `startHereStep`
topics in order, as a numbered path) · search · category grid with each category's topic
count and summary · the six most-asked questions.

### Layout

| Region | Contents |
|---|---|
| Left sidebar | Search box · category tree, expandable, current topic marked |
| Main | Title · summary · blocks · related topics · previous / next within the category |
| Right (≥1280px only) | "On this page" from the section headings · "See it in the app" from `seeInApp` |

Below 1280px the right column folds into the top of the main column. Below 900px the sidebar
becomes a `<details>` disclosure above the content. The shell is desktop-first and has no
mobile layout yet (`AppShell.tsx`), so the manual must at minimum **not break** narrow — a
full mobile shell is out of scope here.

### Search

Client-side, no dependency. At module load, flatten every topic to
`{ id, title, summary, haystack }` where `haystack` is the lowercased concatenation of all
block text. Score: title match > summary match > body match; rank; cap at 8. ~50 topics makes
this instant, and it keeps the content the single source for search too.

### Navigation entry

**Not a sixth peer item.** The rail's five are the product's five jobs; Help is not a sixth
job. Put it at the **foot of the rail, below a hairline**, visually quieter — always present,
never competing. `owns: ['/help']`.

### The manual is its own mode — the app rail is hidden (revised 2026-09-26)

**This reverses the original instruction to keep the rail visible.** It was the wrong call:
the rail spends 240px repeating navigation that means nothing while you are reading, and
leaves the manual in a column too narrow to set text well.

On `/help/*` the app rail is **replaced**, not kept:

- The left column becomes the **manual's own** navigation — search, then the category tree.
- At its head sits a single **`← Back to Kosh`** button. It returns to the last non-help
  route the user was on (remembered in `HelpProvider`; falls back to `/today`). That is the
  only way back, and it is unmissable, which is what makes hiding the rail safe.
- The freed width goes to the reading column. Body text is capped at **68ch** regardless —
  wider is harder to read, not easier. The surplus becomes margin and the right rail.

**Overlay mode is unaffected.** It sits *over* the app, so the rail stays exactly where it
is. Only full-page `/help/*` switches mode.

---

## 5a. Craft (added 2026-09-26)

The bar is the one in `CLAUDE.md`: *"the spreadsheet it replaces — aligned figures, visible
derivations, ruled density."* The manual should read like a **well-set handbook**, not a
decorated web page. Editorial, not ornamental.

| | |
|---|---|
| **Measure** | 68ch for prose. Nothing else matters as much for whether long text gets read |
| **Hierarchy** | `font-serif` + `text-editorial` for topic titles, as home already does. Section headings are small caps in `--ink-muted`, ruled above with a hairline — the same `SectionHeader` language the app already speaks |
| **Rhythm** | One vertical scale (`space-*`). A section is separated by space, not by a box. Boxes are for things that *are* boxed: examples, callouts, tables |
| **Examples** | A worked example is the most valuable block in the manual and should look it — `--sunken` panel, hairline, figures right-aligned and tabular-aligned like every other figure in the product |
| **Fields** | A definition list, not cards. Label in `--ink`, the explanation in `--ink-soft`, and a quiet right-aligned `Required` / `Optional` / `Worked out for you` marker |
| **Callouts** | A 3px left edge in `--attention` or `--accent`, no fill, no icon-in-a-circle. The app's own toast language |
| **Numerals** | Tabular figures anywhere money appears, matching `Amount` |
| **Restraint** | No illustrations, no emoji, no gradients, no card-in-card. Density and alignment carry it |

### Buttery navigation

Every topic is already in the bundle, so there is no load to hide — the work is making it
*feel* instant and continuous rather than jumpy.

- **`startViewTransition`** on topic-to-topic navigation where supported, plain swap where
  not. Never block on it.
- **Scroll to top of the reading column on topic change**, not the document — and instantly,
  not smoothly; a smooth scroll on navigation reads as lag.
- **Search:** results as you type, `↑`/`↓` to move, `Enter` to open, `Esc` to clear. Never a
  layout shift as results appear — reserve the space.
- **Overlay:** the same 220ms `cubic-bezier(0.22, 1, 0.36, 1)` slide the effect toast uses, so
  the product has one motion language. `prefers-reduced-motion` honoured everywhere.
- **Prev / next** are always present at the foot of a topic, and wrap across category
  boundaries so the manual can be read straight through.
- No spinners anywhere in the manual. There is nothing to wait for.

### Standardised structure — explicit, not inferred

**Phase A inferred section headings positionally from block kinds, and it misfired** (a
third prose paragraph got labelled "After you save" on a topic with no form). Inference was
the wrong mechanism for the thing the brief most wants to be uniform.

`DocTopic` changes from a flat `blocks` array to explicit sections:

```ts
export interface DocSection {
  /** One of SECTION_HEADINGS, so every topic reads the same way. */
  heading: DocSectionHeading;
  blocks: DocBlock[];
}

export const SECTION_HEADINGS = [
  'What is this?',
  'Why use it?',
  'What do I enter?',
  'How do I fill it?',
  'After you save',
  'How this helps',
  'Common mistakes',
  'Related',
] as const;

export interface DocTopic {
  …
  sections: DocSection[];   // replaces `blocks`
}
```

A topic supplies the sections that apply and omits the rest, **in this order** — the type
enforces the vocabulary, a lint-style check in `content/index.ts` enforces the order and
fails the build on a topic that invents a heading or reorders them. "On this page" then falls
out of the data instead of being re-derived.

**Every topic that describes a form must carry `What do I enter?` and `How do I fill it?`.**
**Every topic must carry at least one `example` block** unless it is purely definitional.

---

## 6. Voice

Plain, conversational, short. The reader has never used a finance app and does not know what
a principal is. The brief's substitution table is the standard:

> cash flow → money coming in and going out · liabilities → money you still need to pay ·
> outstanding principal → the amount of your loan still left · liquidity → money you can get
> at quickly · reconciliation → checking the recorded amount matches the real one

Where a term is unavoidable, define it in the same breath. Every example in rupees, in Indian
grouping, matching `Wording.money` (`₹1,23,450`). Use the product's own vocabulary:
**commitment**, not "bill obligation"; real dates, never salary-month ranges.

Never judge (rule 8). Never state a figure the product would not state. Where the product
declines to answer — no payoff date without a rate, `INCOMPLETE` rather than a guess — the
manual explains **why the refusal is the right answer**, because that is precisely what reads
as broken to a new user.

---

## 7. Accuracy

Documentation that describes behaviour the code does not have is worse than none. Every
topic is written from the implementation, not from what the feature ought to do.

Behaviour already known to surprise, which the manual must state plainly:

- A **card purchase is an expense when swiped**; paying the bill is a transfer. Money is
  never counted twice.
- **A loan's balance moves when a payment is recorded, not on the due date** (ADR-0018). An
  unrecorded EMI is flagged, never assumed.
- **Cover is never an asset** and never touches net worth (ADR-0016).
- **Available credit subtracts EMI principal blocked against the limit**, so it is lower than
  limit − outstanding.
- A goal's balance is **not** all reachable: a mandatory minimum balance stays put.
- The financial month runs **salary date to salary date**, not the calendar month.
- "Update balance" **re-bases the opening anchor**; postings count only from strictly after
  that date.
- Derived figures are **never stored** — they are recomputed on every read, which is why a
  correction anywhere is immediately right everywhere.

When something is unclear, read the code. Do not invent a calculation.

---

## 8. Phasing

**Phase A — the machine, and the content a first-time user hits first.**
Types · content infra · search · three routes · overlay + `?help=` · `HelpProvider` ·
`useDocAnchor` · context menu (right-click, long-press, `?`) · rail entry · block renderers.
Content: Getting started, Accounts, Income, Monthly plan, Recording expenses, Today.

**Phase B — the rest of the content, and the retrofit.**
Loans/EMIs, Cards, Goals & emergency fund, SIPs & RDs, Monthly overview, Alerts & overdue,
Editing and correcting, Automatic calculations, FAQ, Troubleshooting. Field-level docs for all
18 forms. Then the retrofit: the 7 guide sheets and 7 primers re-pointed at the content layer
so there is one source.

The retrofit is deliberately last — the content model has to survive contact with real
content before existing, working help is rewired to depend on it.

## 9. Out of scope, on purpose

- **No tests.** The user's freeze has held since 2026-09-17. Verification is
  `tsc -b --noEmit`, `vite build`, and headless-Chrome checks.
- **No screenshots.** They go stale silently and there is no pipeline to regenerate them.
  Diagrams only where they carry something words cannot.
- **No mobile shell.** The app does not have one yet.
- **No backend.** Content ships with the frontend bundle. Nothing to serve, nothing to
  migrate, no schema — which also means the migration freeze is untouched.
