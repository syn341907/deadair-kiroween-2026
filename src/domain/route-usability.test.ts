import { describe, expect, it } from "vitest";
import type { CommunicationRoute, Role } from "../data/sample-map";
import { filterUsableRoutes } from "./route-usability";

const roles: Role[] = [
  { id: "coordinator", label: "Coordinator", detail: "", x: 0, y: 0, acceptedModes: [] },
  { id: "written-role", label: "Written role", detail: "", x: 1, y: 0, acceptedModes: ["written"] },
  { id: "spoken-role", label: "Spoken role", detail: "", x: 2, y: 0, acceptedModes: ["spoken"] },
  // acceptedModes omitted — simulates a legacy role that pre-dates mode tracking
  { id: "legacy-role", label: "Legacy role", detail: "", x: 3, y: 0 },
  // acceptedModes: [] — role explicitly accepts no mode
  { id: "no-mode-role", label: "No-mode role", detail: "", x: 4, y: 0, acceptedModes: [] },
];

const route = (id: string, toRoleId: string, mode?: "written" | "spoken"): CommunicationRoute => ({
  id,
  fromRoleId: "coordinator",
  toRoleId,
  label: id,
  channelId: "paper",
  alternate: true,
  ...(mode ? { mode } : {}),
});

describe("filterUsableRoutes", () => {
  it("filters a mode the recipient does not accept", () => {
    expect(filterUsableRoutes(roles, [route("voice-to-text", "written-role", "spoken")])).toEqual([]);
  });

  it("uses the destination role’s modes", () => {
    expect(filterUsableRoutes(roles, [route("spoken-to-spoken", "spoken-role", "spoken")])).toHaveLength(1);
  });

  it("keeps legacy routes without mode metadata", () => {
    expect(filterUsableRoutes(roles, [route("legacy", "legacy-role")])).toHaveLength(1);
  });

  it("rejects a mode-less route to a recipient with acceptedModes: []", () => {
    expect(filterUsableRoutes(roles, [route("no-mode-to-empty", "no-mode-role")])).toEqual([]);
  });

  it("drops routes to unknown recipients", () => {
    expect(filterUsableRoutes(roles, [route("missing-role", "unknown", "written")])).toEqual([]);
  });
});
