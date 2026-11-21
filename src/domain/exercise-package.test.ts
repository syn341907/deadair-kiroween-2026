import { describe, expect, it } from "vitest";
import { exerciseScenarios } from "../data/exercise-scenarios";
import { parseExercisePackage, serializeExercisePackage } from "./exercise-package";

const starter = exerciseScenarios[0];

describe("exercise package", () => {
  it("round-trips a valid fictional exercise", () => {
    expect(parseExercisePackage(JSON.parse(serializeExercisePackage(starter)))).toEqual(starter);
  });

  it("rejects unsupported versions and malformed shapes", () => {
    expect(() => parseExercisePackage({ ...starter, version: 3 })).toThrow("version");
    expect(() => parseExercisePackage(null)).toThrow("exercise file");
  });

  it("rejects duplicate IDs and routes to unknown roles", () => {
    expect(() => parseExercisePackage({ ...starter, roles: [...starter.roles, starter.roles[1]] })).toThrow("unique");
    expect(() => parseExercisePackage({ ...starter, routes: [{ ...starter.routes[0], toRoleId: "missing" }] })).toThrow("unknown role");
  });

  it("rejects unknown communication modes and mismatched inject failures", () => {
    expect(() => parseExercisePackage({ ...starter, routes: [{ ...starter.routes[0], mode: "telepathy" }] })).toThrow("mode");
    expect(() => parseExercisePackage({ ...starter, inject: { ...starter.inject, failedChannelId: starter.initialFailedChannelId } })).toThrow("different channel");
  });

  it("bounds imported roles, routes, and copy lengths", () => {
    expect(() => parseExercisePackage({ ...starter, roles: Array.from({ length: 11 }, (_, index) => ({ ...starter.roles[0], id: `role-${index}` })) })).toThrow("10 roles");
    expect(() => parseExercisePackage({ ...starter, title: "x".repeat(81) })).toThrow("80 characters");
  });

  it("preserves markup-looking labels as plain data for escaped rendering", () => {
    const data = { ...starter, title: "<img src=x onerror=alert(1)>" };
    expect(parseExercisePackage(data).title).toBe(data.title);
  });
});
