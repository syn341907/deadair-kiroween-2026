# Dead Air

[Open Dead Air](https://syn341907.github.io/deadair-kiroween-2026/)

Dead Air is a complete, facilitator-led exercise tool for practicing communications failures at fictional community hubs. A group forecasts who can receive and acknowledge an update, tests two backup plans against channel failures, and leaves with a printable action sheet. Dead Air never sends messages or gives emergency instructions.

## Try it

1. Choose **Room change, dead Wi-Fi** or **Pickup entrance, silent line**.
2. Read the setup aloud and select the first channel failure.
3. Before revealing results, record the group’s delivery and acknowledgment forecast for each role.
4. In **Patch**, build Plan A and Plan B from the available routes, compare their gaps, and load one onto the switchboard.
5. Reveal the second failure when the group is ready, then revisit the comparison.
6. In **Debrief**, record the next practice action, choose a fictional role owner and date, then print or save the action sheet.

The guided flow works without an account. Take as much time as the group needs for discussion.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Vite prints the local URL. The build and focused domain checks are:

```sh
npm test
npm run build
```

## Edit an exercise

Use **Create a copy** or **Edit this fictional exercise** to change the scenario text, objective, inject, fictional roles, route modes, and routes. Export the exercise as JSON to keep it, then import that file later. The editor validates imported files and puts a 64 KB limit on them. Exercise data stays in page memory unless you export it; nothing is uploaded to Dead Air.

Use fictional labels and locations. Written/spoken modes are simple scenario assumptions, not accessibility assessments. A modeled path means only that a route exists in the exercise data; it does not confirm a person received or understood a message.

## How the model works

`src/domain/route-usability.ts` filters routes by each recipient role’s declared modes. `src/domain/exercise-analysis.ts` compares route plans while delegating reachability to Kiro’s `src/domain/communication-network.ts`. `src/domain/drill-analysis.ts` prepares failed-channel and alternate-route inputs. Acknowledgment routes are modeled in reverse, using the same analyzer to check whether a path reaches the coordinator. The UI does not implement another graph traversal.

The app is a static Vite build. It has no runtime network requests, backend, account, analytics, AI service, or external asset dependency. GitHub Pages may record standard visitor information, including IP addresses.

## Kiro development notes

Kiro created the `communication-network` Spec from the interface contract, then implemented the BFS module and its focused tests. The repository tracks the Spec and steering files under `.kiro/`. The analyzer returns deterministic reachable and isolated role IDs; the UI and drill adapter use that exported contract without changing or copying its reachability algorithm.

The app also includes fictional exercise packages, JSON validation, delivery and acknowledgment analysis, facilitator flow, local scenario editing, forecast comparison, and backup-plan comparison. State the exact Kiro surface and tools used from the project’s own Kiro activity history in any submission write-up.

## Safety and privacy

Dead Air is a practice and discussion tool, not a communications system, emergency response product, accessibility assessment, or source of emergency guidance. It does not message people. Do not enter real names, contact details, or sensitive information. Worksheet values are kept in page memory and are not persisted by the app.

## Hosting

The public application is served from the repository’s GitHub Pages deployment. The production site is built from `dist/` by the repository workflow; no secrets or paid runtime services are used.
