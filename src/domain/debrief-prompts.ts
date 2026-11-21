export function getDebriefPrompts(
  isolatedRoleLabels: string[],
  mismatchedRouteLabels: string[],
) {
  const outcomePrompt = isolatedRoleLabels.length === 0
    ? "What confirmed that every role received the update?"
    : isolatedRoleLabels.length === 1
      ? `How would ${isolatedRoleLabels[0]} know the update never arrived?`
      : "Which isolated role would you check on first, and why?";
  const mismatchPrompt = mismatchedRouteLabels.length > 0
    ? `Which written backup could reach people missed by ${mismatchedRouteLabels.join(", ")}?`
    : "What would make this backup route easier to repeat next time?";

  return [outcomePrompt, mismatchPrompt, "Who will check this route at the next practice?"];
}
