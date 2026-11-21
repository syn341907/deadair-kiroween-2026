import type { CommunicationRoute, Role } from "../data/sample-map";
import { analyzeCommunicationNetwork } from "./communication-network";
import { prepareDrillRoutes } from "./drill-analysis";

export type ExerciseAnalysis = {
  delivery: { reachableRoleIds: string[]; isolatedRoleIds: string[] };
  acknowledgement: { reachableRoleIds: string[]; isolatedRoleIds: string[] };
  deliveryRoutes: CommunicationRoute[];
  acknowledgementRoutes: CommunicationRoute[];
  error: string;
};

export function analyzeExercisePlan(
  roles: Role[],
  routes: CommunicationRoute[],
  coordinatorId: string,
  failedChannelIds: string[],
  activeAlternateRouteIds: string[],
): ExerciseAnalysis {
  try {
    const prepared = prepareDrillRoutes(roles, routes, failedChannelIds, activeAlternateRouteIds);
    const deliveryAlternates = prepared.deliveryRoutes.filter((route) => route.alternate).map((route) => route.id);
    const acknowledgementAlternates = prepared.acknowledgementRoutes.filter((route) => route.alternate).map((route) => route.id);
    const input = { roles, coordinatorId, failedChannelId: null, activeAlternateRouteIds: deliveryAlternates };
    const acknowledgementResults = roles.map((role) => analyzeCommunicationNetwork({
      ...input,
      coordinatorId: role.id,
      routes: prepared.acknowledgementRoutes,
      activeAlternateRouteIds: acknowledgementAlternates,
    }));
    const acknowledgedRoleIds = roles
      .filter((role, index) => role.id === coordinatorId || acknowledgementResults[index].reachableRoleIds.includes(coordinatorId))
      .map((role) => role.id);

    return {
      delivery: analyzeCommunicationNetwork({ ...input, routes: prepared.deliveryRoutes }),
      acknowledgement: {
        reachableRoleIds: acknowledgedRoleIds,
        isolatedRoleIds: roles.filter((role) => !acknowledgedRoleIds.includes(role.id)).map((role) => role.id),
      },
      deliveryRoutes: prepared.deliveryRoutes,
      acknowledgementRoutes: prepared.acknowledgementRoutes,
      error: "",
    };
  } catch (error) {
    return {
      delivery: { reachableRoleIds: [], isolatedRoleIds: roles.map((role) => role.id) },
      acknowledgement: { reachableRoleIds: [], isolatedRoleIds: roles.map((role) => role.id) },
      deliveryRoutes: [],
      acknowledgementRoutes: [],
      error: error instanceof Error ? error.message : "The exercise could not be analyzed.",
    };
  }
}
