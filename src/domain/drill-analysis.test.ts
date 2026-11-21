import { describe, expect, it } from "vitest";
import type { CommunicationRoute, Role } from "../data/sample-map";
import { analyzeCommunicationNetwork } from "./communication-network";
import { prepareDrillRoutes } from "./drill-analysis";

const roles: Role[] = [
  { id: "coordinator", label: "Coordinator", detail: "Main hall", x: 0, y: 0, acceptedModes: ["written", "spoken"] },
  { id: "welcome", label: "Welcome desk", detail: "Entry", x: 1, y: 1, acceptedModes: ["written"] },
  { id: "programs", label: "Programs lead", detail: "Room", x: 2, y: 2, acceptedModes: ["written"] },
];

const routes: CommunicationRoute[] = [
  { id: "first", fromRoleId: "coordinator", toRoleId: "welcome", label: "Group chat", channelId: "internet", alternate: false, mode: "written", acknowledgementChannelId: "internet", acknowledgementMode: "written" },
  { id: "second", fromRoleId: "welcome", toRoleId: "programs", label: "Group chat", channelId: "internet", alternate: false, mode: "written", acknowledgementChannelId: "internet", acknowledgementMode: "written" },
  { id: "paper", fromRoleId: "coordinator", toRoleId: "welcome", label: "Paper", channelId: "paper", alternate: true, mode: "written" },
  { id: "phone", fromRoleId: "coordinator", toRoleId: "welcome", label: "Call", channelId: "phone", alternate: false, mode: "spoken", acknowledgementChannelId: "internet", acknowledgementMode: "spoken" },
  { id: "wrong-ack", fromRoleId: "welcome", toRoleId: "programs", label: "Relay", channelId: "internet", alternate: false, mode: "written", acknowledgementChannelId: "phone", acknowledgementMode: "spoken" },
];

describe("prepareDrillRoutes", () => {
  it("models acknowledgment in the reverse direction with Kiro's graph analyzer", () => {
    const prepared = prepareDrillRoutes(roles, [routes[0]], [], []);
    const delivered = analyzeCommunicationNetwork({
      roles,
      coordinatorId: "coordinator",
      routes: prepared.deliveryRoutes,
      failedChannelId: null,
      activeAlternateRouteIds: [],
    });
    const acknowledgedFromWelcome = analyzeCommunicationNetwork({
      roles,
      coordinatorId: "welcome",
      routes: prepared.acknowledgementRoutes,
      failedChannelId: null,
      activeAlternateRouteIds: [],
    });

    expect(delivered.reachableRoleIds).toContain("welcome");
    expect(acknowledgedFromWelcome.reachableRoleIds).toContain("coordinator");
  });

  it("lets Kiro's analyzer use a selected alternate after the primary channel fails", () => {
    const prepared = prepareDrillRoutes(roles, routes.slice(0, 3), ["internet"], ["paper"]);
    const result = analyzeCommunicationNetwork({
      roles,
      coordinatorId: "coordinator",
      routes: prepared.deliveryRoutes,
      failedChannelId: null,
      activeAlternateRouteIds: prepared.deliveryRoutes.filter((route) => route.alternate).map((route) => route.id),
    });

    expect(result.reachableRoleIds).toContain("welcome");
  });

  it("keeps delivery-only routes out of the acknowledgment graph", () => {
    const result = prepareDrillRoutes(roles, [routes[2]], [], ["paper"]);
    expect(result.deliveryRoutes.map((route) => route.id)).toEqual(["paper"]);
    expect(result.acknowledgementRoutes).toEqual([]);
  });

  it("uses only routes whose reverse acknowledgment mode fits the recipient", () => {
    const result = prepareDrillRoutes(roles, routes.slice(0, 2), [], []);
    expect(result.acknowledgementRoutes.map((route) => route.id)).toEqual(["first:ack", "second:ack"]);

    const mismatch = prepareDrillRoutes(roles, [routes[4]], [], []);
    expect(mismatch.acknowledgementRoutes).toEqual([]);
  });

  it("removes failed delivery and acknowledgment channels", () => {
    const result = prepareDrillRoutes(roles, routes, ["internet", "phone"], ["paper"]);
    expect(result.deliveryRoutes).toEqual([routes[2]]);
    expect(result.acknowledgementRoutes).toEqual([]);
  });

  it("includes only active alternate routes", () => {
    const result = prepareDrillRoutes(roles, routes, [], []);
    expect(result.deliveryRoutes.map((route) => route.id)).not.toContain("paper");
  });
});
