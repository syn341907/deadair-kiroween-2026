# Confirmation-aware drill studio implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Dead Air an editable, confirmation-aware tabletop exercise product with a clear, polished interface.

**Architecture:** Keep Vite, TypeScript, SVG/DOM, and the Kiro-owned BFS as the only reachability engine. Add pure data preparation for delivery and acknowledgment routes, validate local JSON exercise packages, and build an in-memory editor and facilitator flow around those modules.

**Tech Stack:** Existing TypeScript, Vite, Vitest, DOM/SVG/CSS; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-20-confirmation-aware-drill-studio-design.md`

## Global Constraints

- Spend remains $0; add no services, dependencies, custom domain, account, or runtime network request.
- Use fictional role labels; do not solicit real names or personal information.
- Keep exercise data in memory; import/export is explicit local file handling.
- Keep `src/domain/communication-network.ts` and its tests as the only BFS implementation; do not edit them.
- Keep the product practice-only and do not claim actual message delivery, accessibility, resilience, or emergency readiness.
- Preserve keyboard use, semantic status, reduced-motion behavior, mobile layout, print output, and the existing visual world.

## Review Focus

- Failed channels remove both delivery and acknowledgment routes before analysis.
- Delivery-only edges never imply an acknowledgment path.
- Imported scenario text is escaped, schema-checked, and bounded before it reaches the UI.
- Empty or duplicate role IDs, dangling routes, invalid mode values, and excessive collection sizes fail with a readable error.
- Injects add a second outage without clearing route choices or action notes.

---

### Task 1: Add confirmation-aware graph inputs

**Files:**
- Modify: `src/data/sample-map.ts`
- Modify: `src/data/exercise-scenarios.ts`
- Create: `src/domain/drill-analysis.ts`
- Create: `src/domain/drill-analysis.test.ts`

**Interfaces:**
- Add optional `acknowledgementChannelId` and `acknowledgementMode` to route metadata.
- `prepareDrillRoutes(roles, routes, failedChannelIds, activeAlternateRouteIds)` returns filtered delivery routes and reversed acknowledgment routes.
- The main flow uses Kiro’s analyzer for delivery reachability and runs it from each role to confirm a modeled return path to the coordinator; no second graph traversal is added.

- [x] Write tests for delivery-only paths, two-way acknowledgments, mismatched acknowledgment mode, and multiple failed channels.
- [x] Run focused tests and observe the expected missing-export failures.
- [x] Implement route preparation and update fictional examples.
- [x] Run focused and full tests.

### Task 2: Validate editable exercise packages

**Files:**
- Create: `src/domain/exercise-package.ts`
- Create: `src/domain/exercise-package.test.ts`
- Modify: `src/data/exercise-scenarios.ts`

**Interfaces:**
- `ExercisePackage` contains metadata, objective, one inject, roles, and routes.
- `parseExercisePackage(value: unknown): ExercisePackage` validates a maximum of 10 roles, 24 routes, bounded text lengths, unique safe IDs, valid role references, channel/mode values, and a required coordinator.
- Scenario export serializes only the validated fictional exercise fields.

- [x] Write tests for valid round-trip, malformed shape, XSS-like text treated as plain text, duplicate IDs, dangling endpoints, invalid modes, and size limits.
- [x] Run focused tests and observe expected failures.
- [x] Implement parser and serializer without dependencies.
- [x] Run focused and full tests.

### Task 3: Model objective and facilitator inject

**Files:**
- Modify: `src/data/exercise-scenarios.ts`
- Modify: `src/domain/debrief-prompts.ts`
- Modify: `src/domain/debrief-prompts.test.ts`

- [x] Add tests for objective completion prompts when delivery exists but acknowledgment does not, and when an inject adds a second failure.
- [x] Implement objective-linked prompt selection with plain language that avoids claiming actual receipt.
- [x] Run focused and full tests.

### Task 4: Build the exercise studio interface

**Files:**
- Modify: `src/main.ts`
- Modify: `src/styles.css`

- [x] Add a local exercise editor, bounded role/route controls, JSON import/export, and safe text rendering.
- [x] Expand the facilitator flow to expose separate outage, response, controlled inject, and debrief phases.
- [x] Compute delivery and acknowledgment through the same Kiro analyzer, with status labels that distinguish a possible route from actual receipt.
- [x] Add a semantic role-status ledger equivalent to the switchboard SVG.
- [x] Keep role labels, route selections, action text, owner, and date while navigating or revealing the inject.
- [x] Produce a concise print sheet linked to the selected objective gaps.

### Task 5: Refine the visual system and release docs

**Files:**
- Modify: `src/styles.css`
- Modify: `README.md`
- Modify: `PRODUCT.md`

- [x] Refine the switchboard UI around the delivery/acknowledgment dual signal and distinct facilitator states.
- [x] Inspect desktop, phone widths, keyboard focus, reduced-motion rules, and print CSS; fix visible defects.
- [x] Document the editor, JSON format, no-network operation, and the three-minute judge path.
- [x] Run `npm test`, `npm run build`, and static no-network review.
- [x] Commit and push after checks pass; verify the public deployment and backup-route flow.
