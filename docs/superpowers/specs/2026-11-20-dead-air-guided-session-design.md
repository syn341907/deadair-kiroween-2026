# Dead Air guided session design

## Intent

Make Dead Air a complete facilitator-led tabletop exercise, rather than a page of map controls. The facilitator should be able to brief a fictional incident, test a communication failure, choose a backup route with the group, and leave with a concrete action to practice.

## Approaches

- **Guided four-part rehearsal (selected):** Brief, outage, route decision, debrief. It gives the existing switchboard a job in a session and turns the worksheet into a record of the group’s decision.
- **Open dashboard with more toggles:** preserves the current single-screen interaction but does not help a facilitator know what to say or what to learn.
- **Real messaging or AI-generated scenarios:** creates privacy, reliability, and cost dependencies that conflict with the $0, local-first constraint.

## Experience

1. **Brief:** choose one of two fictional situations (Internet or Phone failure) and read a short facilitator script aloud.
2. **Outage:** select the failed channel and see the routes and roles affected on the switchboard.
3. **Route decision:** try Paper dispatch or Volunteer relay; show connected roles, isolated roles, and incompatible route gaps as the group discusses the trade-offs.
4. **Debrief:** show prompts tied to the current outcome, record one specific change to test next time, assign a fictional role and practice date, then print a one-page plan.

Facilitators can move backward through the steps to change a decision without losing the worksheet notes. Scenario content and worksheet state live only in browser memory.

## Goals

- Give a facilitator a usable start-to-finish exercise without needing to invent a script.
- Make the group’s route choice and the people still left out the memorable interaction.
- Produce a real after-action sheet with the scenario, outcome, route gaps, discussion prompts, written change, fictional role owner, and date.
- Keep the Kiro-owned reachability module as the sole graph engine.
- Preserve the analog switchboard direction, keyboard access, small-screen layout, print view, and $0 release constraints.

## Non-goals and anti-goals

- No real emergency guidance, messaging, contacts, real personal data, accounts, backend, analytics, telemetry, runtime AI, external data, or persistent storage.
- No claims that fictional written/spoken modes measure real-world accessibility or resilience.
- No new dependencies, paid services, prize credits, custom domains, or signup requirements.
- Do not rewrite or duplicate `src/domain/communication-network.ts` or its tests.

## Product decisions

- Keep the two existing failure channels and two alternate strategies; deepen the session around them instead of adding graph complexity.
- Provide two short fictional scenario scripts, one for each channel, with a discussion cue for each phase.
- Keep the entire session in one responsive page with clear step navigation and a visible current phase. Rewinding must preserve in-memory notes and route choices.
- Make the debrief change a real text field and print its value. Do not save it after the page closes.
- Use no timer. The facilitator controls pacing; no countdown should imply operational urgency.

## Acceptance criteria

1. A first-time visitor can identify the four session phases and begin the exercise without setup or personal data.
2. Each scenario has a facilitator read-aloud prompt and maps to its corresponding existing channel failure.
3. Internet/Phone selection and alternate routes still use the existing domain filters and Kiro-owned analyzer; the graph updates visibly.
4. The debrief shows at least one useful prompt based on isolated roles or route mismatches, plus one universal follow-up question.
5. A facilitator can enter one specific next change, choose a fictional role, and set a date; those values survive phase changes and appear in print output.
6. Print output is a concise one-page after-action plan; app controls stay out of print.
7. Keyboard focus is visible, labels are explicit, mobile layout remains usable, and reduced-motion preference is honored.
8. No new network/API requests, account, payment, dependencies, or persistent data are introduced.

## Known risk

The scenario assumptions and exercise value have not been reviewed by a real facilitator. Keep the wording honest and present the scenarios as fictional practice material.
