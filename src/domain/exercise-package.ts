import type { CommunicationMode, CommunicationRoute, Role } from "../data/sample-map";
import type { ExercisePackage } from "../data/exercise-scenarios";

const validModes = new Set<CommunicationMode>(["written", "spoken"]);
const idPattern = /^[a-z][a-z0-9-]{0,31}$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(value: unknown, name: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new Error(`${name} must be 1–${maxLength} characters.`);
  }
  return value;
}

function safeId(value: unknown, name: string) {
  if (typeof value !== "string" || !idPattern.test(value)) throw new Error(`${name} must use lowercase letters, numbers, and hyphens.`);
  return value;
}

function mode(value: unknown, name: string): CommunicationMode | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !validModes.has(value as CommunicationMode)) throw new Error(`${name} has an unknown communication mode.`);
  return value as CommunicationMode;
}

function uniqueIds(items: Array<{ id: string }>, name: string) {
  if (new Set(items.map((item) => item.id)).size !== items.length) throw new Error(`${name} IDs must be unique.`);
}

function parseRole(value: unknown): Role {
  if (!record(value)) throw new Error("Each role must be an object.");
  const acceptedModes = value.acceptedModes;
  if (acceptedModes !== undefined && (!Array.isArray(acceptedModes) || acceptedModes.some((item) => !validModes.has(item as CommunicationMode)))) {
    throw new Error("Role communication modes are invalid.");
  }
  const x = value.x;
  const y = value.y;
  if (typeof x !== "number" || !Number.isFinite(x) || x < 0 || x > 920 || typeof y !== "number" || !Number.isFinite(y) || y < 0 || y > 730) {
    throw new Error("Role map positions must be valid numbers.");
  }
  return {
    id: safeId(value.id, "Role ID"),
    label: boundedString(value.label, "Role label", 48),
    detail: boundedString(value.detail, "Role location", 64),
    x,
    y,
    ...(acceptedModes === undefined ? {} : { acceptedModes: acceptedModes as CommunicationMode[] }),
  };
}

function parseRoute(value: unknown): CommunicationRoute {
  if (!record(value)) throw new Error("Each route must be an object.");
  if (typeof value.alternate !== "boolean") throw new Error("Route alternate must be true or false.");
  const routeMode = mode(value.mode, "Route mode");
  const acknowledgementMode = mode(value.acknowledgementMode, "Acknowledgment mode");
  const acknowledgementChannelId = value.acknowledgementChannelId === undefined
    ? undefined
    : safeId(value.acknowledgementChannelId, "Acknowledgment channel");
  if ((acknowledgementMode === undefined) !== (acknowledgementChannelId === undefined)) {
    throw new Error("Acknowledgment channel and mode must be supplied together.");
  }
  return {
    id: safeId(value.id, "Route ID"),
    fromRoleId: safeId(value.fromRoleId, "Route sender"),
    toRoleId: safeId(value.toRoleId, "Route recipient"),
    label: boundedString(value.label, "Route label", 56),
    channelId: safeId(value.channelId, "Route channel"),
    alternate: value.alternate,
    ...(routeMode === undefined ? {} : { mode: routeMode }),
    ...(acknowledgementMode === undefined ? {} : { acknowledgementMode, acknowledgementChannelId }),
  };
}

export function parseExercisePackage(value: unknown): ExercisePackage {
  if (!record(value)) throw new Error("This exercise file is not a valid exercise object.");
  let size: number;
  try {
    size = JSON.stringify(value).length;
  } catch {
    throw new Error("This exercise file cannot be read as JSON.");
  }
  if (size > 64_000) throw new Error("Exercise files must be smaller than 64 KB.");
  if (value.version !== 1) throw new Error("This exercise file uses an unsupported version.");
  if (!Array.isArray(value.roles) || value.roles.length < 2 || value.roles.length > 10) throw new Error("An exercise must have 2–10 roles.");
  if (!Array.isArray(value.routes) || value.routes.length < 1 || value.routes.length > 24) throw new Error("An exercise must have 1–24 routes.");

  const roles = value.roles.map(parseRole);
  const routes = value.routes.map(parseRoute);
  uniqueIds(roles, "Role");
  uniqueIds(routes, "Route");

  const coordinatorId = safeId(value.coordinatorId, "Coordinator ID");
  const roleIds = new Set(roles.map((role) => role.id));
  if (!roleIds.has(coordinatorId)) throw new Error("The coordinator must match a role in the map.");
  if (routes.some((route) => !roleIds.has(route.fromRoleId) || !roleIds.has(route.toRoleId))) throw new Error("A route points to an unknown role.");

  if (!record(value.inject)) throw new Error("The exercise needs one facilitator inject.");
  const initialFailedChannelId = safeId(value.initialFailedChannelId, "Initial failure channel");
  const inject = {
    id: safeId(value.inject.id, "Inject ID"),
    title: boundedString(value.inject.title, "Inject title", 64),
    body: boundedString(value.inject.body, "Inject text", 360),
    failedChannelId: safeId(value.inject.failedChannelId, "Inject failure channel"),
  };
  if (inject.failedChannelId === initialFailedChannelId) throw new Error("The inject must fail a different channel.");
  const channels = new Set(routes.flatMap((route) => [route.channelId, route.acknowledgementChannelId].filter((id): id is string => Boolean(id))));
  if (!channels.has(initialFailedChannelId) || !channels.has(inject.failedChannelId)) throw new Error("Both failed channels need at least one route on the map.");

  return {
    version: 1,
    id: safeId(value.id, "Exercise ID"),
    title: boundedString(value.title, "Exercise title", 80),
    setup: boundedString(value.setup, "Setup", 560),
    readAloud: boundedString(value.readAloud, "Read-aloud prompt", 420),
    discussionCue: boundedString(value.discussionCue, "Discussion cue", 240),
    objective: boundedString(value.objective, "Objective", 240),
    initialFailedChannelId,
    coordinatorId,
    inject,
    roles,
    routes,
  };
}

export function serializeExercisePackage(value: unknown) {
  return JSON.stringify(parseExercisePackage(value), null, 2);
}
