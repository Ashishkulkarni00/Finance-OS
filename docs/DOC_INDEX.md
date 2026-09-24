# Documentation index — what is true, what is history

Written 2026-09-20, **closed out 2026-09-23** (ROADMAP 1.6). There were **62 markdown files**,
56 untouched since 2026-09-18, with two competing strategy documents, three competitor
analyses and four "experience" docs shadowing four "spec" docs. This index ends that: it names
the living set and marks everything else as history. There are now 71; the living set is
still ~12, and the growth is ADRs, which is where growth belongs.

**Rule: if a document is not in §1, it does not define the product.** Older documents remain
readable as a record of how we got here, and must not be cited as current truth.

---

## 1. Living documents

| Document | Owns |
|---|---|
| `FINANCIAL_OS.md` | What we're building, the loop, the engines, principles, North Star, decisions D1-D9 |
| `FINANCIAL_STATE.md` | The canonical state model, primitives, derived-vs-stored, thresholds |
| `ROADMAP.md` | Phases, impact assessment, build order, what we're not building |
| `DOC_INDEX.md` | This file |
| `CONTINUE_HERE.md` | Live session handoff — next action, waiting-on, don't-do |
| `SESSION_HANDOFF.md` | How to work with the user; stack; data snapshot |
| `product/FIX_BACKLOG.md` | Known defects and gaps, with a Done log |
| `architecture/decisions/` (ADRs) | Binding technical decisions |
| `architecture/BACKEND_CONVENTIONS.md`, `FRONTEND_CONVENTIONS.md`, `TECHNICAL_ARCHITECTURE.md` | How code is written here |
| `design/DESIGN_SYSTEM.md`, `design/UI_UX_PRINCIPLES.md` | Visual and interaction language |
| `postman/*.json` | The API documentation (no OpenAPI — ADR-0013 §6) |

---

## 2. Superseded — history, not truth

| Document | Superseded by | Note |
|---|---|---|
| `design/PRODUCT_STRATEGY.md` | `FINANCIAL_OS.md` | The FORECAST/DECIDE/EXPLAIN/STANDING ladder survives inside the new product loop |
| `product/STRATEGY_DEEP_DIVE.md` | `FINANCIAL_OS.md` + `ROADMAP.md` | Its competitor pass and Phase 3 list are now in the new docs |
| `product/MVP_DEFINITION.md` | `ROADMAP.md` | Described M1-M13 as future; all are built |
| `product/INFORMATION_ARCHITECTURE.md` | Needs a rewrite in Phase 2 | Self-contradictory: records the five-tab IA as applied, then tables the old "Month / Add / Plan" |
| `product/COMPETITIVE_ANALYSIS.md`, `design/COMPETITIVE_UX_RESEARCH.md` | `FINANCIAL_OS.md` §4/§6 | Three competitor passes existed; the 2026-09-20 research replaces them |
| `product/UX_PRINCIPLES.md` | `design/UI_UX_PRINCIPLES.md` | Was already a 20-line redirect stub |
| `product/DOMAIN_MODEL.md` | `FINANCIAL_STATE.md` for the model; still useful for entity detail | Predates insights, forecast, imports, goal schedule, debit cards, card statements |
| `product/MONTH_EXPERIENCE.md`, `ACCOUNTS_EXPERIENCE.md`, `LEDGER_EXPERIENCE.md`, `PLAN_EXPERIENCE.md` | `design/*_UX_SPEC.md` | Duplicated the specs |
| `product/PRODUCT_AUDIT.md`, `SCREEN_PURPOSE_AUDIT.md`, `DATA_ENTRY_AUDIT.md`, `LEDGER_IMPROVEMENT_PLAN.md`, `PLANNED_CHANGES.md`, `FUTURE_ROADMAP.md`, `PRODUCT_FEATURE_MAP.md` | `ROADMAP.md` + `FIX_BACKLOG.md` | Point-in-time audits, largely executed |
| `product/DISCIPLINE_AND_TRUST.md` | Feeds `ROADMAP.md` Phase 1.1 and Phase 6 | Design still valid; was parked by the user |

---

## 3. Drift — all cleared 2026-09-23

- ~~**`G:\FinanceOS\CLAUDE.md`** asserts "frontend — empty (not started)", "M2 status: done.
  Next: M3", stale test counts…~~ **Fixed 2026-09-21.** Rewritten to carry only what does not
  change — origin, invariants, stack, Boot 4 traps, standing instructions — and **no milestone
  status at all**, since a status line there is what went stale and then lied. It points at
  this index and at `CONTINUE_HERE.md` for anything live. **Keep it that way: do not add
  "current state" back to it.**
- ~~`product/INFORMATION_ARCHITECTURE.md` contradicts itself~~ **Banner added 2026-09-23.**
  It was the last unbannered document that a reader could plausibly have cited as truth. The
  banner states the navigation that actually exists and points elsewhere. The **rewrite is
  still owed in Phase 2**, when the Pulse gives the IA a settled shape to describe — a banner
  stops it lying, it does not make it useful.
- ~~ADR index should gain the architectural decisions from D1-D9~~ **Done.** D2 → ADR-0015,
  D7 → ADR-0016, D6 → ADR-0017, D3 → **ADR-0018**, D8 → **ADR-0019**. D1, D4, D5 and D9 are
  deliberately *not* ADRs yet: D1 (state is the unit) and D4/D5 (goals compete, decisions are
  records) describe work that has not been built, and an ADR written before the decision is
  actually faced records a guess. D9 (no monetisation that conflicts with advice) is a product
  commitment, not a technical one, and lives in `FINANCIAL_OS.md`.

### Living documents that were made true in the same pass

- **`ROADMAP.md`** — Phase 1 now carries a status column and honest exit criteria: four of
  five met, 1.5 frozen. Three items are marked **built but never executed**.
- **`FINANCIAL_STATE.md`** §4 was a list of *missing* primitives, three of which now exist. It
  is split into Built and Still missing, keeping each one's original reason, because the
  reason is still why the thing behaves as it does.
- **`SESSION_HANDOFF.md`** — said the latest migration was V17 (it is V20) and quoted
  **125/125** tests as though current, when nothing has run since 2026-09-17. Both corrected;
  the feature map gained Needs you and the write-effect toast, and the data snapshot is
  refreshed and flagged where six test rows distort it.

## 3a. What is *deliberately* not documented

- **No OpenAPI/springdoc** — only Boot 3-targeting versions exist (ADR-0013 §6). The Postman
  collection is the API documentation and is updated in the same change as the code.
- **No per-screen spec for `/needs-you`.** It renders the insight engine's existing output
  with the existing row component; a spec would describe `InsightList` twice.
- **No document owns "current status".** `CONTINUE_HERE.md` does, and only it. Anything else
  claiming to is drift by definition.

---

## 4. Rule for new documents

Don't create one unless it owns something no living document owns. Prefer editing. A
point-in-time audit is a message, not a document — put its conclusions in `FIX_BACKLOG.md`
or `ROADMAP.md` and let the audit itself expire.
