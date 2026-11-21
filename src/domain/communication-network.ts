import type { CommunicationRoute, Role } from "../data/sample-map";

export type NetworkAnalysisInput = {
  roles: Role[];
  routes: CommunicationRoute[];
  coordinatorId: string;
  failedChannelId: string | null;
  activeAlternateRouteIds: string[];
};

export type NetworkAnalysisResult = {
  reachableRoleIds: string[];
  isolatedRoleIds: string[];
};

export function analyzeCommunicationNetwork(
  input: NetworkAnalysisInput,
): NetworkAnalysisResult {
  const { roles, routes, coordinatorId, failedChannelId, activeAlternateRouteIds } = input;

  // 1. Filter to active edges only.
  const activeEdges = routes.filter((route) => {
    if (route.channelId === failedChannelId) return false;
    if (route.alternate && !activeAlternateRouteIds.includes(route.id)) return false;
    return true;
  });

  // 2. Build adjacency index for fast lookup.
  const adj = new Map<string, string[]>();
  for (const edge of activeEdges) {
    const neighbors = adj.get(edge.fromRoleId) ?? [];
    neighbors.push(edge.toRoleId);
    adj.set(edge.fromRoleId, neighbors);
  }

  // 3. BFS from coordinator (visited set prevents infinite loops on cycles).
  const visited = new Set<string>();
  visited.add(coordinatorId);
  const queue: string[] = [coordinatorId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adj.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // 4. Partition all role IDs, sorted for determinism.
  const allIds = roles.map((r) => r.id).sort();
  const reachableRoleIds = allIds.filter((id) => visited.has(id));
  const isolatedRoleIds = allIds.filter((id) => !visited.has(id));

  return { reachableRoleIds, isolatedRoleIds };
}
