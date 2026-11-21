# Dead Air

[Open the live demo](https://syn341907.github.io/deadair-kiroween-2026/)

A guided fictional communications-failure exercise for community-center, library, and other local-hub volunteers. Dead Air leads a facilitator through four steps: set a scene, break a channel, test a backup route, and turn the result into a one-page after-action sheet.

Dead Air is for practice and discussion only. It does not send messages, handle real emergencies, or provide emergency guidance. All roles and locations are fictional. Written/spoken labels are simplified exercise assumptions, not accessibility guarantees. Worksheet values stay in this page and are not sent to a Dead Air server or saved by the app. GitHub Pages may log standard visitor information, including IP addresses.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Choose a fictional scenario and read the facilitator card aloud. Advance through **Break** and **Restore**, switch Internet or Phone off, then try Volunteer relay or Paper dispatch. The board shows who is still isolated and calls out a route that does not fit its fictional recipient. In **Debrief**, write one change, assign a fictional role and practice date, then print or save the after-action sheet as a PDF.

## Hosting setup

GitHub Pages serves the public demo from the `dist/` build. The GitHub Actions workflow deploys on each push to `main`; it uses no secrets, paid APIs, or external runtime services.

## Checks

```sh
npm test
npm run build
```

## How it works

`src/domain/route-usability.ts` filters routes against each fictional recipient role’s accepted communication modes. The app passes usable routes to `src/domain/communication-network.ts`, which applies the failed-channel and active-alternate rules, then calculates reachability with breadth-first search. All data is bundled with the app or held in page memory. There are no runtime API requests, accounts, or backend.

## Safety and privacy

Use fictional role labels only. Dead Air is not an emergency response product or accessibility assessment. Its written/spoken modes are simplified scenario assumptions. Worksheet owner and date values are not persisted. GitHub Pages records visitor IP addresses in security logs.

## Kiro

The `.kiro/` directory contains the `communication-network` Spec and project steering constraints. Kiro implemented `src/domain/communication-network.ts` and its focused tests. The tests use a small inline fixture and do not depend on the fictional sample map.

## Judge instructions

No account is required to use the app. In a short walkthrough: choose **A room change, mid-session**, read the scenario card, advance to **Break the line**, then to **Restore**, enable **Volunteer relay** and **Paper dispatch**, and observe the connected, isolated, and mismatched routes. Finish in **Debrief**, enter one next change and a fictional owner, then open the print dialog. A full group exercise takes about four minutes; the product walkthrough takes under three. The app is a practice and discussion tool only.
