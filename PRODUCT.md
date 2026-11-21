# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + TypeScript with native SVG and DOM; selected by the user for this empty project.

## Users

Facilitators and volunteers at community centers, libraries, and other local hubs who want to practice discussing communication failures.

## Product Purpose

Dead Air lets a facilitator load a fictional community-center communication map, simulate the loss of a channel, see which roles remain connected to the coordinator, and test whether a backup route fits the receiving role’s fictional written or spoken mode. The group leaves with a one-page follow-up plan. The product goal is to help a group spot network isolation and a backup-route mismatch, then choose a route to practice. This goal has not been validated with facilitators.

## Positioning

A local-first tabletop rehearsal focused on inclusive communication paths between roles at a community hub. It is distinct from tools that send real messages or coordinate during emergencies.

## Operating Context

A facilitator uses the app on a laptop or phone with a group. The app starts with fictional sample data, requires no accounts or real names, and can print or save a follow-up plan through the browser.

## Capabilities and Constraints

- A five-phase facilitator flow supplies fictional scenario cards with read-aloud context and a discussion cue, then guides the group through a first outage, route choice, a controlled second failure, and debrief.
- The facilitator can choose a failed channel and activate grouped paper or spoken alternate routes.
- Route-mode compatibility is evaluated against fictional recipient-role modes before the Kiro-owned analyzer calculates reachability.
- Active but incompatible routes remain visible as gaps and do not count as usable paths.
- Delivery and acknowledgment routes are modeled separately. An acknowledgment route travels back toward the coordinator; the Kiro-owned `communication-network` module checks both directions without a second UI graph algorithm.
- Before results are revealed, the facilitator records the group’s expected delivery and acknowledgment for each role. The app compares those forecasts with modeled paths in the fictional exercise.
- Facilitators can save two alternate-route plans, compare delivery and acknowledgment gaps, and load either plan onto the switchboard. Both plans are recalculated after the second channel failure.
- The interface distinguishes roles with delivery paths, roles with return acknowledgment paths, isolated roles, and incompatible route attempts.
- Users can create or edit a fictional exercise, then import or export a bounded JSON package locally.
- State-specific debrief questions and an editable next action turn the exercise into a one-page action sheet with objective gaps, a fictional role owner, and a practice date.
- App data stays in page memory; the app makes no runtime API requests and uses no accounts, backend, analytics, telemetry, runtime AI, or external data. The static host serves page assets and may log visitor IP addresses.
- Total spend must remain $0. Do not depend on paid services, APIs, subscriptions, trials, required payment methods, custom domains, prize credits, or paid AI.
- The public application must work without a Kiro account or payment.
- A facilitator can run the exercise at their own pace; the software does not impose a countdown.
- Open source repository and license are required for the hackathon submission.

## Brand Commitments

The product is named Dead Air. The user selected an analog switchboard over a community map as the interface direction. Keep the experience accessible, responsive, polished, and free of jumpscares.

## Evidence on Hand

The sample community-center map and all sample roles are fictional. No real user data or external proof assets have been provided. Do not invent testimonials, real-world outcomes, or emergency guidance.

## Product Principles

- Make communication failures and alternate paths understandable at a glance.
- Treat route fit as a simplified fictional rehearsal dimension, not an accessibility audit or real-world guarantee.
- Keep the exercise focused on discussion and learning, not operational emergency response.
- Use fictional data and avoid collecting personal information.
- Keep the exercise usable without runtime network access, accounts, or payment.
