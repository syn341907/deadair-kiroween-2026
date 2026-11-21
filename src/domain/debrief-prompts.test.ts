import { describe, expect, it } from "vitest";
import { getDebriefPrompts } from "./debrief-prompts";

const objective = "Send the room change and receive a confirmation.";

describe("getDebriefPrompts", () => {
  it("distinguishes delivery from confirmation", () => {
    const prompts = getDebriefPrompts({
      objective,
      unreachableRoleLabels: [],
      unconfirmedRoleLabels: ["Welcome desk"],
      mismatchedRouteLabels: [],
    });
    expect(prompts[0]).toContain("A modeled delivery path exists for Welcome desk");
    expect(prompts[0]).toContain("no acknowledgment path is modeled");
    expect(prompts[1]).toContain(objective);
  });

  it("names roles without a modeled delivery path", () => {
    expect(getDebriefPrompts({
      objective,
      unreachableRoleLabels: ["Programs lead"],
      unconfirmedRoleLabels: [],
      mismatchedRouteLabels: [],
    })[0]).toContain("Programs lead");
  });

  it("connects an incompatible route to the exercise objective", () => {
    const prompts = getDebriefPrompts({
      objective,
      unreachableRoleLabels: [],
      unconfirmedRoleLabels: [],
      mismatchedRouteLabels: ["Spoken relay → Programs lead"],
    });
    expect(prompts[1]).toContain("Spoken relay → Programs lead");
    expect(prompts[1]).toContain(objective);
  });

  it("always ends with an owned follow-up action", () => {
    expect(getDebriefPrompts({
      objective,
      unreachableRoleLabels: [],
      unconfirmedRoleLabels: [],
      mismatchedRouteLabels: [],
    })[2]).toContain("who will own it");
  });
});
