# Inclusive Exercise Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Dead Air demonstrate whether outage backups can reach fictional roles through routes compatible with their stated communication modes.

**Architecture:** Add route-mode metadata and a pure destination-compatibility filter, then pass only usable routes into the existing Kiro-owned reachability analyzer. Render mismatch states from the same route data and add a one-page role-only follow-up worksheet.

**Tech Stack:** Existing Vite, TypeScript, Vitest, native DOM/SVG/CSS; no dependency additions.

**Spec:** `docs/superpowers/specs/2026-11-20-dead-air-exercise-loop-design.md`

## Global Constraints

- No runtime network requests, accounts, backend, analytics, telemetry, or runtime AI.
- Use fictional roles only; no real names or contact details.
- Keep the current Kiro graph analyzer and its tests unchanged; do not duplicate reachability.
- Preserve keyboard access, visible focus, readable contrast, responsive behavior, reduced-motion support, and one-page print output.
- Keep total spend at $0; add no dependencies or paid services.

## Review Focus

- A route from coordinator to an unknown recipient must not be considered mode-compatible; filter it out and test it.
- Missing mode metadata in the existing analyzer fixture must preserve old behavior; test it.
- A route compatible with the recipient remains available even if the sender accepts different modes; test destination-only matching.
- An active but mismatched route remains visible as a mismatch and does not change the analyzer result; verify in the UI.
- Worksheet selections must survive rerenders but must not be persisted; verify by changing scenarios and checking printed values.

---

### Task 1: Add route-mode compatibility filtering

**Files:**
- Modify: `src/data/sample-map.ts`
- Create: `src/domain/route-usability.ts`
- Create: `src/domain/route-usability.test.ts`

**Interfaces:**
- Add `CommunicationMode = "written" | "spoken"`.
- Add optional `Role.acceptedModes?: CommunicationMode[]` and `CommunicationRoute.mode?: CommunicationMode` to preserve existing Kiro test fixtures.
- Export `filterUsableRoutes(roles: Role[], routes: CommunicationRoute[]): CommunicationRoute[]`.
- Unknown destinations are filtered out. Missing mode metadata stays compatible for backwards compatibility; otherwise the destination must list the route mode.

- [x] **Step 1: Write tests** named `filters a mode the recipient does not accept`, `uses the destination role’s modes`, `keeps legacy routes without mode metadata`, and `drops routes to unknown recipients`.
- [x] **Step 2: Run the focused test and confirm the new imports/function are missing.**
- [x] **Step 3: Add minimal types and filter implementation.** Do not traverse the graph.
- [x] **Step 4: Run the focused test and confirm it passes.**

### Task 2: Integrate compatible routes and clear mismatch feedback

**Files:**
- Modify: `src/data/sample-map.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Add fictional role modes and grouped paper/spoken alternate routes to the sample map.
- Keep `analyzeCommunicationNetwork` input/output and implementation unchanged.

- [x] **Step 1: Add the written-first and spoken-first sample roles/routes, including two groupable strategies.**
- [x] **Step 2: Pass `filterUsableRoutes(roles, routes)` to the analyzer and keep all routes available for SVG drawing.**
- [x] **Step 3: Add grouped strategy controls; active incompatible routes must render as `DOESN’T FIT` and not enter the analyzer, while failed channel routes render as `SIGNAL LOST`.**
- [x] **Step 4: Run `npm run build` and `npm test`.**

### Task 3: Make the follow-up plan actionable and submission docs accurate

**Files:**
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Modify: `README.md`
- Modify: `PRODUCT.md`

- [x] **Step 1: Add an in-memory fictional-role owner selector and practice date, plus a print-only writing line for the next change.**
- [x] **Step 2: Print selected values, scenario, isolated roles, tried strategies, and access mismatches on one page; hide app controls in print.**
- [x] **Step 3: Update setup/demo docs to explain the written/spoken route-fit reveal and local-only worksheet.**
- [x] **Step 4: Run `npm run build` and `npm test`; inspect the desktop and phone layout, keyboard focus, mismatched route state, and print CSS.**

## Self-review

- Spec coverage maps to Tasks 1–3. The existing reachability analyzer and its test file remain unchanged.
- All implementation names and the legacy metadata behavior are defined above.
- Review-focus cases are covered in Task 1 or Task 3’s UI verification.
- Scope uses existing dependencies and the established single-page architecture.
