# Confirmation-aware drill studio design

## Intent

Turn Dead Air from a fixed sample exercise into a small, local-first tabletop exercise studio. Its distinguishing behavior is to show both whether a modeled delivery route exists and whether the role has a modeled way to acknowledge the update. A facilitator can introduce a second failure, edit a fictional exercise, and leave with an objective-linked action sheet.

## Approaches

- **Confirmation-aware facilitator studio (selected):** reuse the Kiro BFS engine for delivery and acknowledgment analyses, add one deterministic inject, and let users edit/import/export fictional exercise JSON locally. This addresses the product’s most important modeling gap and makes it useful beyond the included sample.
- **Add more fixed scenarios only:** fast, but leaves the reachability-only claim and one-size-fits-all map intact.
- **Real messaging, live collaboration, or runtime AI:** conflicts with the no-cost, local-first and practice-only product boundary and creates unnecessary operational risk.

## Core experience

1. **Choose or author:** load one of the built-in exercises, edit its fictional roles/routes and objective, or import a valid JSON exercise. Export custom exercises as JSON; no account or app server is involved.
2. **Set the objective:** define the exercise objective and the acknowledgment expected from the fictional roles. Explain that route availability is modeled possibility, not proof that a person received anything.
3. **Break a channel:** choose one initial channel failure and inspect delivery and acknowledgment paths separately.
4. **Respond:** activate alternate routes and see roles with a delivery path, roles with only a modeled route mismatch, and roles without a path.
5. **Reveal an inject:** the facilitator chooses when to add the exercise’s second fictional channel failure. Recalculate both analyses and update the map immediately.
6. **Debrief:** identify objective gaps, write one next action, select a fictional role owner/date, and print or download the action sheet.

## Product decisions

- Keep the current analog switchboard visual world; use distinct line treatment and a visible text ledger for delivery and acknowledgment.
- Add optional acknowledgment channel/mode data to a route. The acknowledgment edge runs back to the sender; construct a reversed graph view for the existing Kiro analyzer without changing or copying its BFS implementation. Check each role’s return path by running the analyzer from that role to the coordinator.
- Filter multiple failed channels before calling Kiro’s analyzer. Keep all graph reachability calculations inside `src/domain/communication-network.ts`.
- A facilitator-controlled inject adds another failed channel; it does not trigger automatically or simulate a real incident.
- Provide one editor for fictional labels, roles, routes, communication modes, route acknowledgment capability, objective, scenario copy, and inject. Validate imported JSON with strict size/count/string limits before using it.
- Keep state in memory. Import/export is explicit file handling; no cloud storage, local persistence, real names, or other personal information.
- State labels must distinguish “route available” from “message received.” No numeric resilience score, emergency recommendation, real-world accessibility claim, or outcome guarantee.
- Keep print output to one page where practical and provide an equivalent semantic route ledger alongside the SVG.
- Add no dependencies, services, tracking, paid assets, runtime requests, or video production.

## Goals

- Make the key outcome—delivery path versus confirmation path—immediately clear.
- Give a facilitator one editable, repeatable exercise with a controlled complication.
- Produce a useful objective-gap/action record with a fictional owner and date.
- Preserve the $0 static release and Kiro-owned BFS engine.
- Make the primary flow usable with keyboard, screen reader, laptop, phone, and print.

## Non-goals

- Sending or receiving real messages.
- Incident response, emergency guidance, accessibility certification, or verified proof of receipt.
- User accounts, collaboration, analytics, runtime AI, network storage, or automatic action tracking.
- Rewriting or duplicating Kiro’s reachability logic or its tests.

## Acceptance criteria

1. The starter exercises work without setup; all roles, copy, and maps are fictional.
2. The interface names delivery and acknowledgment states separately and does not imply actual receipt.
3. A facilitator can activate a backup route, reveal a second failure when ready, and see the computed result update.
4. A user can edit a scenario, export it, import it again, and receive a clear validation error for malformed or oversized input.
5. Adding a route that can carry an acknowledgment changes the acknowledgment result; a delivery-only route does not.
6. The debrief links gaps to the selected objectives and includes an editable action, fictional owner, and date in the print sheet.
7. A semantic text ledger exposes the same role statuses as the SVG.
8. Keyboard focus, reduced motion, responsive layout, and the one-page print view are preserved.
9. No runtime network requests, paid services, accounts, persistence, real names, or new dependencies are introduced.

## Known limits

The included graphs and route/mode assumptions are fictional. A modeled path does not verify that a message was received or acknowledged in real life. Exercise content is not professional emergency-management guidance.
