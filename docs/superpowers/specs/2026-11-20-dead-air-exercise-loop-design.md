# Dead Air inclusive exercise design

## Intent

Make Dead Air a facilitator-led communications rehearsal for community hubs: it shows when a channel outage isolates a fictional role and when a backup route does not fit that role’s fictional communication mode. The product remains a practice tool, distinct from real-time offline messaging products. Costume Contest remains the best-fit category, with the analog switchboard/map as the existing visual direction.

## Approaches

- **Inclusive route rehearsal (selected):** model simple written/spoken role needs, show inaccessible attempted routes, recover roles with a fitting backup, and print a follow-up worksheet. This gives the current map a clearer purpose while keeping the real Kiro-owned reachability analyzer unchanged.
- Add more outage effects and visual drama: could improve atmosphere but would not strengthen the product’s distinction or close the route-fit gap.
- Add more channels or real messaging: broadens scope, creates cost/privacy/safety risks, and competes directly with offline messaging tools.

## Goals

- Demonstrate both Internet and Phone failure using fictional data and two grouped backup strategies: paper dispatch (written) and volunteer relay (spoken).
- Mark an active route incompatible when its mode is not among the destination role’s fictional supported modes; do not count that route as a usable edge.
- Pass the compatible routes to `analyzeCommunicationNetwork`; that Kiro-owned module remains the sole source of graph reachability.
- Show connected roles, isolated roles, and active access mismatches. Provide a one-page print plan with the scenario, roles, routes tried, mismatches, a fictional role owner, and a practice date.
- Preserve the existing visual identity; keep data in the current page session and offline/local.

## Non-goals and anti-goals

- This is not an accessibility audit, emergency plan, real messaging system, or operational response tool. Mode labels are simplified fictional exercise assumptions, not claims that a route is accessible in every real setting.
- No real names/contact details, account, backend, telemetry, runtime network, runtime AI, paid service, custom domain, or new dependency.
- Do not alter or duplicate `src/domain/communication-network.ts` reachability logic or its existing tests.
- No new outage types, persistent storage, or features beyond the core exercise and print sheet.

## Constraints and implementation calls

- Keep Vite, TypeScript, native SVG/DOM, the existing `analyzeCommunicationNetwork` contract, and user-selected switchboard-over-map visual direction.
- Add destination `acceptedModes` and route `mode` metadata. A small route-usability helper filters mismatches before the graph module; it does not traverse or otherwise analyze graph connectivity.
- Group alternate routes into Paper dispatch and Volunteer relay. Paper routes support written-mode roles; spoken relays support spoken-mode roles. An incompatible selected route remains visible and labeled as a mismatch.
- Worksheet owner choices are fictional role labels only. Practice date and other form state remain in memory and are not persisted.

## Acceptance criteria

1. Internet and Phone can each be selected as a failed channel, with the map and role summary updated from Kiro’s analyzer.
2. Activating Paper dispatch connects the written-mode roles whose Internet paths failed.
3. Activating Volunteer relay reconnects spoken-mode roles affected by Phone failure; a spoken relay to a written-mode role is visibly marked as an access mismatch and does not alter reachability.
4. Route-usability filtering is independently testable and never implements reachability.
5. The plan reflects the selected failure, connected/isolated roles, tried routes, and active mismatches; it includes a role-only owner selector and practice date.
6. The print plan fits a single page, hides interactive app controls, and prints useful selected values.
7. No runtime network, account, payment, real personal data requirement, or persistent data dependency is introduced.
8. Existing Kiro analyzer implementation and test file remain unchanged.

## Left to the builder

Use short labels and high-contrast line states so a facilitator can explain the route mismatch quickly. Do not frame the simplified modes as a substitute for real-world accessibility planning.
