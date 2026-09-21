# Documentation index — what is true, what is history

Written 2026-09-20. There were **62 markdown files**, 56 untouched since 2026-09-18, with two
competing strategy documents, three competitor analyses and four "experience" docs shadowing
four "spec" docs. This index ends that: it names the living set and marks everything else as
history.

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
| `product/STRATEGY_DEEP_DIVE.md` | `FINANCIAL_OS.md` + `ROADMAP.md` | Its competitor pass and Phase 2 list are now in the new docs |
| `product/MVP_DEFINITION.md` | `ROADMAP.md` | Described M1-M13 as future; all are built |
| `product/INFORMATION_ARCHITECTURE.md` | Needs a rewrite in Phase 1 | Self-contradictory: records the five-tab IA as applied, then tables the old "Month / Add / Plan" |
| `product/COMPETITIVE_ANALYSIS.md`, `design/COMPETITIVE_UX_RESEARCH.md` | `FINANCIAL_OS.md` §4/§6 | Three competitor passes existed; the 2026-09-20 research replaces them |
| `product/UX_PRINCIPLES.md` | `design/UI_UX_PRINCIPLES.md` | Was already a 20-line redirect stub |
| `product/DOMAIN_MODEL.md` | `FINANCIAL_STATE.md` for the model; still useful for entity detail | Predates insights, forecast, imports, goal schedule, debit cards, card statements |
| `product/MONTH_EXPERIENCE.md`, `ACCOUNTS_EXPERIENCE.md`, `LEDGER_EXPERIENCE.md`, `PLAN_EXPERIENCE.md` | `design/*_UX_SPEC.md` | Duplicated the specs |
| `product/PRODUCT_AUDIT.md`, `SCREEN_PURPOSE_AUDIT.md`, `DATA_ENTRY_AUDIT.md`, `LEDGER_IMPROVEMENT_PLAN.md`, `PLANNED_CHANGES.md`, `FUTURE_ROADMAP.md`, `PRODUCT_FEATURE_MAP.md` | `ROADMAP.md` + `FIX_BACKLOG.md` | Point-in-time audits, largely executed |
| `product/DISCIPLINE_AND_TRUST.md` | Feeds `ROADMAP.md` Phase 0.1 and Phase 5 | Design still valid; was parked by the user |

---

## 3. Known drift to fix (not yet done)

- **`G:\FinanceOS\CLAUDE.md`** still asserts as fact: "frontend — empty (not started)",
  "Nothing exists yet for: cycles, commitments, Real Balance, cards, loans, goals, or any
  frontend", "do not start frontend work", "M2 status: done. Next: M3", and test counts
  (77/77, 23) that no longer match (22 test files). It is the file a new session reads first,
  so it is the highest-value correction outstanding.
- `product/INFORMATION_ARCHITECTURE.md` contradicts itself (above); rewrite when the Pulse
  lands in Phase 1.
- ADR index should gain the reassessment decisions D1-D9 that are architectural: plan
  versioning (D2), debt truth from payments (D3), reactive write path (D6), protection
  primitive (D7), AI as interface (D8).

---

## 4. Rule for new documents

Don't create one unless it owns something no living document owns. Prefer editing. A
point-in-time audit is a message, not a document — put its conclusions in `FIX_BACKLOG.md`
or `ROADMAP.md` and let the audit itself expire.
