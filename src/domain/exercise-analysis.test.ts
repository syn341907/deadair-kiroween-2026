import { describe, expect, it } from "vitest";
import type { CommunicationRoute, Role } from "../data/sample-map";
import { analyzeExercisePlan } from "./exercise-analysis";

const roles: Role[] = [
  { id: "coordinator", label: "Coordinator", detail: "Desk", x: 0, y: 0, acceptedModes: ["written", "spoken"] },
  { id: "welcome", label: "Welcome", detail: "Entry", x: 1, y: 1, acceptedModes: ["written"] },
  { id: "programs", label: "Programs", detail: "Room", x: 2, y: 2, acceptedModes: ["written"] },
];

const routes: CommunicationRoute[] = [
  { id: "primary", fromRoleId: "coordinator", toRoleId: "welcome", label: "Chat", channelId: "internet", alternate: false, mode: "written", acknowledgementChannelId: "internet", acknowledgementMode: "written" },
  { id: "relay", fromRoleId: "welcome", toRoleId: "programs", label: "Pass note", channelId: "paper", alternate: true, mode: "written", acknowledgementChannelId: "paper", acknowledgementMode: "written" },
  { id: "paper-welcome", fromRoleId: "coordinator", toRoleId: "welcome", label: "Paper to welcome", channelId: "paper", alternate: true, mode: "written", acknowledgementChannelId: "paper", acknowledgementMode: "written" },
  { id: "paper-programs", fromRoleId: "coordinator", toRoleId: "programs", label: "Paper to programs", channelId: "paper", alternate: true, mode: "written" },
];

describe("analyzeExercisePlan", () => {
  it("reports delivery and reverse acknowledgment reachability through the shared analyzer", () => {
    const result = analyzeExercisePlan(roles, routes, "coordinator", ["internet"], ["paper-welcome", "relay"]);
    expect(result.delivery.reachableRoleIds).toEqual(["coordinator", "programs", "welcome"]);
    expect(result.acknowledgement.reachableRoleIds).toEqual(["coordinator", "welcome", "programs"]);
  });

  it("keeps separate alternate selections isolated between plan analyses", () => {
    const planA = analyzeExercisePlan(roles, routes, "coordinator", ["internet"], ["paper-welcome", "relay"]);
    const planB = analyzeExercisePlan(roles, routes, "coordinator", ["internet"], []);
    expect(planA.delivery.reachableRoleIds).toContain("programs");
    expect(planB.delivery.reachableRoleIds).not.toContain("welcome");
    expect(planB.delivery.reachableRoleIds).not.toContain("programs");
  });

  it("recalculates plan results when another channel fails", () => {
    const result = analyzeExercisePlan(roles, routes, "coordinator", ["internet", "paper"], ["paper-welcome", "relay", "paper-programs"]);
    expect(result.delivery.isolatedRoleIds).toEqual(["programs", "welcome"]);
    expect(result.acknowledgement.isolatedRoleIds).toEqual(["welcome", "programs"]);
  });
});
