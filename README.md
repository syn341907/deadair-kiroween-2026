# Dead Air

A fictional communications-failure exercise for community-center, library, and other local-hub volunteers. A facilitator disables Internet or Phone, sees which fictional roles lose their path to the coordinator, tries alternate routes, and prints a one-page follow-up worksheet.

Dead Air is for practice and discussion only. It does not send messages, handle real emergencies, or provide emergency guidance. All roles and locations are fictional. Written/spoken labels are simplified exercise assumptions, not accessibility guarantees. Worksheet values stay in page memory; nothing is sent or persisted.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Choose **Internet**. Turn on **Volunteer relay** to see that its spoken routes do not fit the written-first roles, then turn on **Paper dispatch** to reconnect them. Choose **Phone** and turn on **Volunteer relay** to restore the spoken-first roles. Assign a fictional role and practice date, then print or save the follow-up worksheet as a PDF.

## Hosting setup

The repository includes a GitHub Actions workflow for GitHub Pages. Once Pages is enabled, each push to `main` builds the static app and publishes `dist/`. The workflow uses no secrets, paid APIs, or external runtime services.

## Checks

```sh
npm test
npm run build
```

## How it works

`src/domain/route-usability.ts` filters routes against each fictional recipient role’s accepted communication modes. The app passes usable routes to `src/domain/communication-network.ts`, which applies the failed-channel and active-alternate rules, then calculates reachability with breadth-first search. All data is bundled with the app or held in page memory. There are no runtime API requests, accounts, or backend.

## Safety and privacy

Use fictional role labels only. Dead Air is not an emergency response product or accessibility assessment. Its written/spoken modes are simplified scenario assumptions. Worksheet owner and date values are not persisted.

## Kiro

The `.kiro/` directory contains the `communication-network` Spec and project steering constraints. Kiro implemented `src/domain/communication-network.ts` and its focused tests. The tests use a small inline fixture and do not depend on the fictional sample map.

## Judge instructions

No account is required to use the app. Use the fictional map to simulate a channel failure, try an alternate route, and print the follow-up worksheet. The app is a practice and discussion tool only.
