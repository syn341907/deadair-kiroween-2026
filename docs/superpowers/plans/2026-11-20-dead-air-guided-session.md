# Dead Air guided session implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Dead Air into a complete, guided facilitator exercise with a real printable debrief.

**Architecture:** Keep the current Vite/TypeScript/SVG app and Kiro-owned reachability module. Add concise local scenario/debrief content, a four-phase UI flow, and an editable in-memory next-action field. Do not persist, message, or call services.

**Tech Stack:** Existing TypeScript, Vite, Vitest, native DOM/SVG/CSS; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-20-dead-air-guided-session-design.md`

## Global Constraints

- Total spend must remain $0.
- Judges must be able to use the public app without login or payment.
- App data remains in browser memory; no runtime API calls or persistence.
- Use fictional scenarios and role labels only.
- Keep `src/domain/communication-network.ts` and its tests unchanged.
- Preserve responsive, keyboard-accessible, reduced-motion, and print behavior.

## Review Focus

- Switching phases must preserve the selected channel, active routes, notes, owner, and date.
- Scenario and outage channel must stay paired when the visitor switches scenarios.
- A mode-mismatched volunteer relay stays visibly marked and does not count as reachability.
- Empty notes and unassigned owner/date print as writable blanks, not stale values.
- Print output stays concise and excludes navigation and interactive controls.

---

### Task 1: Model scenario and debrief copy

**Files:**
- Create: `src/data/exercise-scenarios.ts`
- Create: `src/domain/debrief-prompts.test.ts`
- Create: `src/domain/debrief-prompts.ts`

**Interfaces:**
- `ExerciseScenario`: `{ id: string; channelId: string; title: string; setup: string; readAloud: string; discussionCue: string }`.
- Export two fixed scenarios, one for `internet` and one for `phone`.
- `getDebriefPrompts(isolatedRoleLabels: string[], mismatchedRouteLabels: string[]): string[]` returns concise, state-specific questions and one universal next-time check.

- [x] Write tests for no isolates, one/multiple isolates, mismatches, and deterministic prompt output.
- [x] Run the new focused tests and confirm the missing export fails.
- [x] Implement only the scenario data and pure prompt selection.
- [x] Run focused and full tests; expect all to pass.

### Task 2: Build the four-phase facilitator flow

**Files:**
- Modify: `src/main.ts`

**Interfaces:**
- Phase IDs: `brief`, `outage`, `response`, `debrief`.
- Scenario/channel choice updates `failedChannelId` and resets only the alternate-route selection; worksheet notes remain.
- Back/forward phase controls update the visible active phase without rebuilding or discarding field values.

- [x] Add accessible phase navigation and a first-use brief with scenario script.
- [x] Present map controls during outage/response and keep the same analyzer path.
- [x] Show current graph result and outcome prompts in the response/debrief phases.
- [x] Turn the next-change line into a labeled textarea whose value is held in memory.
- [x] Include prompts, outcome, owner, date, and next change in the printable worksheet.
- [x] Run the full suite and build.

### Task 3: Apply the switchboard visual direction to the complete flow

**Files:**
- Modify: `src/styles.css`
- Modify: `README.md`
- Modify: `PRODUCT.md`

- [x] Give the four phases a clear hierarchy within the existing analog switchboard identity.
- [x] Make the chosen action and route failure easy to read with visible focus and reduced-motion support.
- [x] Keep the print sheet to one page and hide navigation/controls.
- [x] Update the README’s under-three-minute judge path and describe what the app produces; keep price/privacy claims accurate.
- [x] Run `npm test`, `npm run build`, and inspect the desktop flow and print stylesheet.
- [x] Check the public Pages deployment succeeds and the live application loads the new app assets.
