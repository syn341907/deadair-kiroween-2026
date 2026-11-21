import { describe, it, expect } from "vitest";
import {
  analyzeCommunicationNetwork,
  type NetworkAnalysisInput,
} from "./communication-network";
import type { Role, CommunicationRoute } from "../data/sample-map";

// ---------------------------------------------------------------------------
// Minimal inline fixture — independent of sample-map.ts data.
// Roles: coordinator, roleA, roleB, roleC
// Routes:
//   coord → A  (internet, non-alternate)
//   coord → B  (phone,    non-alternate)
//   coord → C  (paper,    alternate, id: "alt-paper")
//   A     → coord (internet, non-alternate) — creates a cycle with the first route
// ---------------------------------------------------------------------------

const roles: Role[] = [
  { id: "coordinator", label: "Coordinator", detail: "", x: 0, y: 0 },
  { id: "roleA",       label: "Role A",       detail: "", x: 1, y: 0 },
  { id: "roleB",       label: "Role B",       detail: "", x: 2, y: 0 },
  { id: "roleC",       label: "Role C",       detail: "", x: 3, y: 0 },
];

const routes: CommunicationRoute[] = [
  { id: "coord-a",   fromRoleId: "coordinator", toRoleId: "roleA", label: "", channelId: "internet", alternate: false },
  { id: "coord-b",   fromRoleId: "coordinator", toRoleId: "roleB", label: "", channelId: "phone",    alternate: false },
  { id: "alt-paper", fromRoleId: "coordinator", toRoleId: "roleC", label: "", channelId: "paper",    alternate: true  },
  { id: "a-coord",   fromRoleId: "roleA",       toRoleId: "coordinator", label: "", channelId: "internet", alternate: false },
];

function base(overrides: Partial<NetworkAnalysisInput> = {}): NetworkAnalysisInput {
  return {
    roles,
    routes,
    coordinatorId: "coordinator",
    failedChannelId: null,
    activeAlternateRouteIds: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

describe("analyzeCommunicationNetwork", () => {
  // T1 — baseline: no failure, no alternates active
  it("T1: reaches all non-alternate-only roles when nothing fails", () => {
    const result = analyzeCommunicationNetwork(base());
    expect(result.reachableRoleIds).toEqual(["coordinator", "roleA", "roleB"]);
    expect(result.isolatedRoleIds).toEqual(["roleC"]);
  });

  // T2 — internet failure isolates roleA
  it("T2: internet failure isolates roles only reachable via internet", () => {
    const result = analyzeCommunicationNetwork(base({ failedChannelId: "internet" }));
    expect(result.reachableRoleIds).toEqual(["coordinator", "roleB"]);
    expect(result.isolatedRoleIds).toEqual(["roleA", "roleC"]);
  });

  // T3 — phone failure isolates roleB
  it("T3: phone failure isolates roles only reachable via phone", () => {
    const result = analyzeCommunicationNetwork(base({ failedChannelId: "phone" }));
    expect(result.reachableRoleIds).toEqual(["coordinator", "roleA"]);
    expect(result.isolatedRoleIds).toEqual(["roleB", "roleC"]);
  });

  // T4 — active alternate reconnects roleC
  it("T4: active alternate route reconnects an otherwise isolated role", () => {
    const result = analyzeCommunicationNetwork(
      base({ activeAlternateRouteIds: ["alt-paper"] }),
    );
    expect(result.reachableRoleIds).toEqual(["coordinator", "roleA", "roleB", "roleC"]);
    expect(result.isolatedRoleIds).toEqual([]);
  });

  // T5 — alternate active but its channel failed → still excluded
  it("T5: alternate is excluded when its channel also fails", () => {
    const result = analyzeCommunicationNetwork(
      base({ failedChannelId: "paper", activeAlternateRouteIds: ["alt-paper"] }),
    );
    expect(result.isolatedRoleIds).toContain("roleC");
  });

  // T6 — alternate exists but not activated
  it("T6: inactive alternate does not contribute to reachability", () => {
    const result = analyzeCommunicationNetwork(base({ activeAlternateRouteIds: [] }));
    expect(result.isolatedRoleIds).toContain("roleC");
  });

  // T7 — cycle terminates
  it("T7: directed cycle does not cause an infinite loop", () => {
    // coord → A and A → coord is a cycle; both should be reachable
    const result = analyzeCommunicationNetwork(base());
    expect(result.reachableRoleIds).toContain("coordinator");
    expect(result.reachableRoleIds).toContain("roleA");
  });

  // T8 — determinism
  it("T8: same input produces identical output on repeated calls", () => {
    const input = base({ activeAlternateRouteIds: ["alt-paper"] });
    const r1 = analyzeCommunicationNetwork(input);
    const r2 = analyzeCommunicationNetwork(input);
    expect(r1).toEqual(r2);
  });

  // T9 — unknown coordinator → all isolated
  it("T9: unknown coordinatorId makes all roles isolated", () => {
    const result = analyzeCommunicationNetwork(base({ coordinatorId: "ghost" }));
    expect(result.reachableRoleIds).toEqual([]);
    expect(result.isolatedRoleIds).toEqual(["coordinator", "roleA", "roleB", "roleC"]);
  });
});
