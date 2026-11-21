# Dead Air rehearsal upgrade

## Intent

Make Dead Air a usable facilitator-led exercise product by giving groups a prediction to make before they see modeled results and a way to compare two backup plans.

## Product decisions

- Keep the existing five phases, local-first operation, fictional scenario library, scenario editor, and facilitator-controlled second-failure inject.
- During the first outage, hide modeled map results until the group records predicted delivery and acknowledgment for each non-coordinator role.
- After reveal, show prediction differences alongside the modeled result. Label them as exercise outcomes, not real-world probabilities or proof of receipt.
- In Patch, let users define two backup plans from the existing alternate routes and compare delivery and acknowledgment coverage side by side. Keep the map tied to the selected active plan.
- Recalculate both plans after the second failure so the comparison remains useful through the inject.
- Use the existing Kiro-owned graph analyzer for all reachability. Do not add probability, timing, operational advice, services, accounts, dependencies, or real personal data.
- Call the product a facilitator-led exercise tool throughout the app and README. Retain “demo” only where a competition-specific instruction requires it.

## Acceptance criteria

1. Before the first outage result is revealed, a facilitator can record predicted delivery and acknowledgment for each participant role.
2. The map and modeled status remain concealed until the facilitator selects Reveal results.
3. After reveal, each prediction is compared with the corresponding modeled outcome, and the copy does not imply real delivery or likelihood.
4. A facilitator can create two alternate-route plans from the existing routes and see delivery and acknowledgment counts plus uncovered roles for each.
5. Plan comparison uses the same channel failures and Kiro-owned graph analyzer as the live map; the second-failure inject recalculates both plans.
6. Existing guided flow, scenario editing/import/export, keyboard operation, responsive layout, and print worksheet continue to work.
7. README and product copy describe a complete local exercise tool, not a demo; the public URL and $0/runtime-network claims remain accurate.
8. No dependencies, runtime network calls, backend, persistence, account requirement, or paid service are added.

## Verification

- Add focused unit tests for plan analysis and comparison states.
- Run the focused and full Vitest suites plus `npm run build`.
- Inspect desktop and narrow phone layouts and confirm map visibility before/after reveal, keyboard focus, and print behavior.
