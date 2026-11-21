# Dead Air rehearsal upgrade implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add prediction-and-reveal and backup-plan comparison to Dead Air, and describe it as a complete facilitator tool.

**Architecture:** Extract the current UI graph calculation into a tested domain helper that delegates every reachability calculation to Kiro’s analyzer. Keep forecast, selected plans, and comparison state in the existing in-memory app session; use existing role, route, and scenario types.

**Tech Stack:** Existing TypeScript, Vite, Vitest, native DOM/SVG/CSS. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-21-dead-air-rehearsal-upgrade-design.md`

## Global Constraints

- Keep the product local-first and free, with no runtime requests, accounts, persistence, or added dependencies.
- Keep `src/domain/communication-network.ts` and its tests unchanged.
- Keep all modeled outcomes fictional and deterministic; do not present them as real-world probability or proof of receipt.
- Preserve accessibility, responsive layout, reduced motion, and print output.

## Task 1: Extract and test shared plan analysis

**Files:** create `src/domain/exercise-analysis.ts`, create `src/domain/exercise-analysis.test.ts`; modify `src/main.ts` only to replace its inline graph calculation.

- [x] Write tests for primary delivery, reverse acknowledgment, failed-channel filtering, and alternate-route selection using a small fixture.
- [x] Run the focused tests and confirm they fail because the helper is missing.
- [x] Implement `analyzeExercisePlan(roles, routes, coordinatorId, failedChannelIds, activeAlternateRouteIds)` returning delivery and acknowledgment results plus prepared routes; delegate reachability to `analyzeCommunicationNetwork`.
- [x] Verify focused tests and existing tests pass without edits to the Kiro-owned module.

## Task 2: Add concealed forecast and reveal

**Files:** modify `src/main.ts`, `src/styles.css`.

- [x] Add per-role predicted delivery and acknowledgment choices to the outage phase.
- [x] Keep the map hidden until the facilitator reveals results; require explicit reveal.
- [x] Show forecast-versus-modeled differences for delivery and acknowledgment after reveal.
- [x] Reset the forecast and reveal state when the scenario or first failed channel changes.
- [x] Preserve focus and announce reveal through a status region.

## Task 3: Add side-by-side backup-plan comparison and release wording

**Files:** modify `src/main.ts`, `src/styles.css`, `README.md`, `PRODUCT.md`.

- [x] Let the facilitator save two alternate-route selections as Plan A and Plan B.
- [x] Show each plan’s modeled delivery and acknowledgment coverage and uncovered role names, calculated through `analyzeExercisePlan`.
- [x] Recompute saved plans when the second failure is revealed; let the facilitator load either plan into the live map.
- [x] Replace product-facing “demo” language with “app” or “exercise tool”; retain competition-only wording when required.
- [x] Verify `npm test`, `npm run build`, responsive layout, keyboard flow, and print stylesheet.

## Review Focus

- No outcome is visible before explicit reveal.
- A participant can be predicted as delivery-only, acknowledgment-only, both, or neither without role-selection coupling bugs.
- Plan snapshots do not mutate when current route checkboxes are edited later.
- Saved plan comparison reflects the second failure and mode incompatibilities.
- UI continues to use the Kiro-owned graph engine without a second reachability implementation.

## Verification record

- `npm test`: 33 tests passed across 6 files.
- `npm run build`: TypeScript and Vite production build passed.
- `git diff --check`: passed.
- Browser walkthrough confirmed the outage result stays hidden until all forecasts are recorded, Plan A remains unchanged while Plan B is edited, and both plans recalculate after the second failure. The 320px view keeps the comparison cards within the viewport.
- Print styles were not changed. The verified app build was not deployed during this work.
