import type { CommunicationRoute, Role } from "../data/sample-map";
import { filterUsableRoutes } from "./route-usability";

export function prepareDrillRoutes(
  roles: Role[],
  routes: CommunicationRoute[],
  failedChannelIds: string[],
  activeAlternateRouteIds: string[],
) {
  const failedChannels = new Set(failedChannelIds);
  const activeAlternates = new Set(activeAlternateRouteIds);
  const deliveryRoutes = filterUsableRoutes(roles, routes).filter((route) =>
    !failedChannels.has(route.channelId) && (!route.alternate || activeAlternates.has(route.id)),
  );
  const rolesById = new Map(roles.map((role) => [role.id, role]));
  const acknowledgementRoutes = deliveryRoutes.flatMap((route) => {
    const channelId = route.acknowledgementChannelId;
    const mode = route.acknowledgementMode;
    const acknowledgementRecipient = rolesById.get(route.fromRoleId);
    if (!channelId || !mode || !acknowledgementRecipient || failedChannels.has(channelId)) return [];
    if (acknowledgementRecipient.acceptedModes !== undefined && !acknowledgementRecipient.acceptedModes.includes(mode)) return [];
    return [{ ...route, id: `${route.id}:ack`, fromRoleId: route.toRoleId, toRoleId: route.fromRoleId, channelId, mode }];
  });

  return { deliveryRoutes, acknowledgementRoutes };
}
