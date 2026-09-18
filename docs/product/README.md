# Product Documentation — Index

**Working name:** Kosh
**Phase:** 0 — Discovery **complete**
**Created:** 08 Sep 2026

---

## Read in this order

**To understand the product (20 min)**
1. [PRODUCT_VISION.md](PRODUCT_VISION.md) — the thesis
2. [USER_PROBLEMS.md](USER_PROBLEMS.md) — what we solve, ranked
3. [PRODUCT_DIFFERENTIATION.md](PRODUCT_DIFFERENTIATION.md) — why not a spreadsheet or Monarch
4. [MVP_DEFINITION.md](MVP_DEFINITION.md) — what gets built first

**To build it**
5. [DOMAIN_MODEL.md](DOMAIN_MODEL.md) — the conceptual model. **Most consequential document here**
6. [../architecture/TECHNICAL_ARCHITECTURE.md](../architecture/TECHNICAL_ARCHITECTURE.md) — stack and correctness rules
6b. [../architecture/BACKEND_CONVENTIONS.md](../architecture/BACKEND_CONVENTIONS.md) — **binding** layering and error contract
6c. [../architecture/FRONTEND_CONVENTIONS.md](../architecture/FRONTEND_CONVENTIONS.md) — **binding** services, Redux, components
7. [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) — navigation and screens
8. [../design/UI_UX_PRINCIPLES.md](../design/UI_UX_PRINCIPLES.md) — **the authority for every screen** + quality gate
9. [../design/DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) — visual language, "Quiet Instrument"
10. [../design/SCREEN_SPECS.md](../design/SCREEN_SPECS.md) — screen-by-screen, in build order

**To make decisions**
9. [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) — ten tie-breakers
11. [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md) — the boundaries
12. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) — **needs your input**

---

## Full index

| Document | Purpose |
|---|---|
| [PRODUCT_VISION.md](PRODUCT_VISION.md) | Thesis, the ladder, north star, non-goals |
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | Ten decision rules |
| [USER_PERSONAS.md](USER_PERSONAS.md) | Arjun, Meera, Rohit, and the anti-persona |
| [USER_PROBLEMS.md](USER_PROBLEMS.md) | P1–P10, ranked, evidence-marked |
| [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md) | In, out, and permanently out |
| [PRODUCT_FEATURE_MAP.md](PRODUCT_FEATURE_MAP.md) | Every feature by phase, with rejections |
| [EXCEL_TO_PRODUCT_MAPPING.md](EXCEL_TO_PRODUCT_MAPPING.md) | All 13 sheets classified |
| [EXCEL_GAPS_AND_PRODUCT_OPPORTUNITIES.md](EXCEL_GAPS_AND_PRODUCT_OPPORTUNITIES.md) | 8 structural failures + 14 opportunities |
| [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md) | US and India landscape, AA, positioning |
| [PRODUCT_DIFFERENTIATION.md](PRODUCT_DIFFERENTIATION.md) | Five differentiators and the structural advantage |
| [USER_JOURNEYS.md](USER_JOURNEYS.md) | Six journeys, the emotional arc |
| [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) | Navigation, layering, naming |
| [UX_PRINCIPLES.md](UX_PRINCIPLES.md) | *Superseded* → points to design/UI_UX_PRINCIPLES.md |
| [DOMAIN_MODEL.md](DOMAIN_MODEL.md) | Entities, rules, calculations |
| [MVP_DEFINITION.md](MVP_DEFINITION.md) | M1–M13, build order, done criteria |
| [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md) | Phases 1–5 with exit criteria |
| [BUSINESS_MODEL.md](BUSINESS_MODEL.md) | Pricing, economics, GTM, risks |
| [PRODUCT_AUDIT.md](PRODUCT_AUDIT.md) | 2026-09-16 audit: obligation + insight engines, intelligence map, SaaS roadmap, 12 increments. **Study only** |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | 8 questions; 3 blocking |
| [ASSUMPTIONS.md](ASSUMPTIONS.md) | 23 assumptions, falsifiable |
| [PRODUCT_LEARNING_LOG.md](PRODUCT_LEARNING_LOG.md) | Live log. **Update at every cycle close** |
| [../architecture/TECHNICAL_ARCHITECTURE.md](../architecture/TECHNICAL_ARCHITECTURE.md) | Stack, API, testing, prototype vs production |
| [../architecture/BACKEND_CONVENTIONS.md](../architecture/BACKEND_CONVENTIONS.md) | **Binding.** MVC layering, DTOs, exceptions, error contract, testing per layer |
| [../architecture/FRONTEND_CONVENTIONS.md](../architecture/FRONTEND_CONVENTIONS.md) | **Binding.** Service layer, Redux Toolkit + RTK Query, functional components, money on the client |
| [../design/UI_UX_PRINCIPLES.md](../design/UI_UX_PRINCIPLES.md) | **Authority.** 16 principles + the 14-point quality gate |
| [../design/DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) | "Quiet Instrument" — philosophy, type, colour, components, financial data rules |
| [../design/SCREEN_SPECS.md](../design/SCREEN_SPECS.md) | 7 screens fully specified, in build order |
| [../design/COMPETITIVE_UX_RESEARCH.md](../design/COMPETITIVE_UX_RESEARCH.md) | UX research; what to adapt and what to reject |

---

## The product in five lines

**Thesis** — Every money app tells you what happened. This one tells you what you can do.
**Number** — `held − reserved − committed = Real Balance`, then `÷ days left = Room`.
**Loop** — Plan → Live → Review → Reflect → Adjust → Grow, on the *salary* cycle.
**Promise** — It says "I don't know" rather than showing a plausible wrong number.
**Bet** — People will pay for truth about their money, even with manual entry.

---

## Where this came from

Not a market study. A working Excel system built for one real person over three days in
September 2026 — which functioned, and nearly corrupted itself six times.

Every problem in `USER_PROBLEMS.md` marked **[obs]** was watched happening. Every entry
in `PRODUCT_LEARNING_LOG.md` L1–L15 is a real incident.

**We are not porting a spreadsheet. We are giving a proven mental model a substrate that
cannot silently corrupt it.**

---

## Status

| | |
|---|---|
| Phase 0 Discovery | ✅ Complete |
| Phase 1 MVP | ⬜ Not started — awaiting sign-off |
| Blocking questions | 3 — see OPEN_QUESTIONS Q1–Q3 |
| Code written | **None, by design** |
