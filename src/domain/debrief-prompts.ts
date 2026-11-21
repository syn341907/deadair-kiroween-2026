export type DebriefContext = {
  objective: string;
  unreachableRoleLabels: string[];
  unconfirmedRoleLabels: string[];
  mismatchedRouteLabels: string[];
};

export function getDebriefPrompts({
  objective,
  unreachableRoleLabels,
  unconfirmedRoleLabels,
  mismatchedRouteLabels,
}: DebriefContext) {
  const outcomePrompt = unreachableRoleLabels.length
    ? `Which route change could give ${unreachableRoleLabels.join(", ")} a modeled delivery path?`
    : unconfirmedRoleLabels.length
      ? `A modeled delivery path exists for ${unconfirmedRoleLabels.join(", ")}, but no acknowledgment path is modeled. How could the group close that loop?`
      : "The model shows delivery and acknowledgment paths. What would the group still need to check in discussion?";
  const objectivePrompt = mismatchedRouteLabels.length
    ? `How do ${mismatchedRouteLabels.join(", ")} affect this objective: ${objective}?`
    : `Did the modeled routes meet this objective: ${objective}?`;

  return [outcomePrompt, objectivePrompt, "What action will be practiced, who will own it, and when will the group revisit it?"];
}
