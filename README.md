# Dead Air

[Open the live demo](https://syn341907.github.io/deadair-kiroween-2026/)

Dead Air is a facilitator-led communications exercise studio for fictional community hubs. Break a channel, choose a backup, see whether each role has a modeled way to send an acknowledgment back, and leave with an action sheet. It never sends messages or gives emergency instructions.

## Try it

1. Choose **Room change, dead Wi-Fi** or **Pickup entrance, silent line**.
2. Read the fictional setup aloud and begin the outage.
3. In **Patch**, enable Paper or In Person and compare delivery with acknowledgment paths.
4. Reveal the second failure when the group is ready.
5. In **Debrief**, record a next practice action, choose a fictional role owner and date, then print or save the one-page sheet.

The full walkthrough takes under three minutes. Judges do not need an account.

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

`src/domain/route-usability.ts` filters routes by each recipient role’s declared modes. `src/domain/drill-analysis.ts` prepares the failed-channel and alternate-route inputs, then calls the Kiro-owned `src/domain/communication-network.ts` for reachability. Acknowledgment routes are modeled in the reverse direction, and the same analyzer is used from each role to check whether a route reaches the coordinator. The UI does not implement a second graph traversal.

The app is a static Vite build. It has no runtime network requests, backend, account, analytics, AI service, or external asset dependency. GitHub Pages may record standard visitor information, including IP addresses.

## Kiro development notes

Kiro created the `communication-network` Spec from the interface contract, then implemented the BFS module and its focused tests. The repository tracks the Spec and steering files under `.kiro/`. The analyzer returns deterministic reachable and isolated role IDs; the UI and drill adapter use that exported contract without changing or copying its reachability algorithm.

Other product work in this repository adds the fictional exercise package, JSON validation, delivery/acknowledgment preparation, facilitator flow, scenario editor, and presentation. The exact Kiro surface and tools used should be stated from the project’s own Kiro activity history in the submission write-up.

## Safety and privacy

Dead Air is a practice and discussion tool, not a communications system, emergency response product, accessibility assessment, or source of emergency guidance. It does not message people. Do not enter real names, contact details, or sensitive information. Worksheet values are kept in page memory and are not persisted by the app.

## Hosting

The public demo is served from the repository’s GitHub Pages deployment. The production site is built from `dist/` by the repository workflow; no secrets or paid runtime services are used.
