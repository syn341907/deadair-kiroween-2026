import type { CommunicationRoute, Role } from "../data/sample-map";

export function filterUsableRoutes(roles: Role[], routes: CommunicationRoute[]) {
  const rolesById = new Map(roles.map((role) => [role.id, role]));

  return routes.filter((route) => {
    const recipient = rolesById.get(route.toRoleId);
    if (!recipient) return false;
    // acceptedModes omitted/undefined → legacy role; any route is usable.
    // acceptedModes: [] → role accepts no mode; no route is usable, including mode-less ones.
    if (recipient.acceptedModes === undefined) return true;
    if (!route.mode) return recipient.acceptedModes.length > 0;
    return recipient.acceptedModes.includes(route.mode);
  });
}
