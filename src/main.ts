import { alternateStrategies, channels, coordinatorId, roles, routes } from "./data/sample-map";
import { exerciseScenarios } from "./data/exercise-scenarios";
import { analyzeCommunicationNetwork } from "./domain/communication-network";
import { getDebriefPrompts } from "./domain/debrief-prompts";
import { filterUsableRoutes } from "./domain/route-usability";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./styles.css";

type ExercisePhase = "brief" | "outage" | "response" | "debrief";
type ChannelId = typeof exerciseScenarios[number]["channelId"];

const app = document.querySelector<HTMLDivElement>("#app")!;
const phases: { id: ExercisePhase; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "outage", label: "Break" },
  { id: "response", label: "Restore" },
  { id: "debrief", label: "Debrief" },
];
let activePhase: ExercisePhase = "brief";
let furthestPhaseIndex = 0;
let failedChannelId: ChannelId = exerciseScenarios[0].channelId;
const activeAlternateRouteIds = new Set<string>();
let worksheetOwnerId = "";
let practiceDate = "";
let nextChangeToTest = "";
let analysisError = "";
let compactMap = window.matchMedia("(max-width: 560px)").matches;

const usableRoutes = filterUsableRoutes(roles, routes);
const usableRouteIds = new Set(usableRoutes.map((route) => route.id));
const phonePositions: Record<string, { x: number; y: number }> = {
  coordinator: { x: 180, y: 365 },
  welcome: { x: 85, y: 160 },
  programs: { x: 275, y: 160 },
  pantry: { x: 275, y: 575 },
  library: { x: 85, y: 575 },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function scenarioFor(channelId = failedChannelId) {
  return exerciseScenarios.find((scenario) => scenario.channelId === channelId) ?? exerciseScenarios[0];
}

function position(roleId: string) {
  const role = roles.find((item) => item.id === roleId)!;
  return compactMap ? phonePositions[roleId] : role;
}

function analyze() {
  try {
    const result = analyzeCommunicationNetwork({
      roles,
      routes: usableRoutes,
      coordinatorId,
      failedChannelId,
      activeAlternateRouteIds: [...activeAlternateRouteIds],
    });
    analysisError = "";
    return result;
  } catch (error) {
    analysisError = error instanceof Error ? error.message : "Network analysis is unavailable.";
    return null;
  }
}

function routePath(routeId: string) {
  const route = routes.find((item) => item.id === routeId)!;
  const from = position(route.fromRoleId);
  const to = position(route.toRoleId);
  const parallelRoutes = routes.filter((item) => item.fromRoleId === route.fromRoleId && item.toRoleId === route.toRoleId);
  const lane = parallelRoutes.indexOf(route) - (parallelRoutes.length - 1) / 2;
  const controlY = (from.y + to.y) / 2 + (route.alternate ? 52 : -22) + lane * 24;
  const controlX = (from.x + to.x) / 2;
  return {
    route,
    from,
    to,
    d: `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`,
    labelY: (from.y + 2 * controlY + to.y) / 4 + (route.alternate ? 9 : -7),
  };
}

function renderMap(reachable: Set<string>, isolated: Set<string>, failedLabel: string) {
  const edges = routes.map((route) => {
    const { d, labelY } = routePath(route.id);
    const failed = route.channelId === failedChannelId;
    const selected = !route.alternate || activeAlternateRouteIds.has(route.id);
    const mismatch = selected && !failed && !usableRouteIds.has(route.id);
    const active = selected && !failed && !mismatch;
    const className = failed
      ? "edge edge--failed"
      : mismatch
        ? "edge edge--incompatible"
        : active
          ? "edge edge--active"
          : "edge edge--idle";
    const from = position(route.fromRoleId);
    const to = position(route.toRoleId);
    const label = failed ? "SIGNAL LOST" : mismatch ? "DOESN’T FIT" : route.alternate ? route.mode?.toUpperCase() ?? route.label.toUpperCase() : route.label.toUpperCase();
    return `<path class="${className}" d="${d}"/>${failed || mismatch || (active && route.alternate) ? `<text class="edge-label" x="${(from.x + to.x) / 2}" y="${labelY}">${label}</text>` : ""}`;
  }).join("");

  const nodes = roles.map((role) => {
    const state = reachable.has(role.id) ? "reachable" : isolated.has(role.id) ? "isolated" : "unknown";
    const modeLabel = role.acceptedModes?.map((mode) => mode === "written" ? "WRITTEN FIRST" : "SPOKEN FIRST").join(" · ") ?? "MODE NOT SET";
    const point = position(role.id);
    return `<g class="node node--${state}" transform="translate(${point.x} ${point.y})"><circle class="node-ring" r="34"/><circle class="node-dot" r="6"/><text class="node-name" y="54">${role.label}</text><text class="node-detail" y="72">${role.detail}</text><text class="node-mode" y="88">${modeLabel}</text><text class="node-state" y="-45">${state === "unknown" ? "ANALYSIS PENDING" : state.toUpperCase()}</text></g>`;
  }).join("");

  return `<section class="map-panel" aria-label="Live communication switchboard">
    <div class="map-head"><div><h3>Community House</h3><p>Fictional roles · simplified route assumptions</p></div><span class="map-status"><span class="status-mark"></span>${isolated.size} ISOLATED</span></div>
    <div class="map-canvas"><svg viewBox="${compactMap ? "0 0 360 730" : "0 0 920 520"}" role="img" aria-label="Live fictional switchboard. ${failedLabel} is unavailable; ${isolated.size} roles are isolated.">${edges}${nodes}</svg><span class="map-caption">NOT TO SCALE · FICTIONAL ROLES</span></div>
    <div class="legend"><span><i class="legend-dot legend-dot--connected"></i> Connected</span><span><i class="legend-dot legend-dot--isolated"></i> Isolated</span><span><i class="legend-line legend-line--failed"></i> Signal lost</span><span><i class="legend-line legend-line--gap"></i> Route mismatch</span></div>
  </section>`;
}

function navigateToPhase(phase: ExercisePhase, advance = false) {
  const targetIndex = phases.findIndex((item) => item.id === phase);
  if (advance) furthestPhaseIndex = Math.max(furthestPhaseIndex, targetIndex);
  if (targetIndex > furthestPhaseIndex) return;
  activePhase = phase;
  render();
  document.querySelector<HTMLElement>("#phase-title")?.focus();
}

function render() {
  const result = analyze();
  const reachable = new Set(result?.reachableRoleIds ?? []);
  const isolated = new Set(result?.isolatedRoleIds ?? []);
  const scenario = scenarioFor();
  const failedLabel = channels.find((channel) => channel.id === failedChannelId)?.label ?? "No channel";
  const isolatedRoles = roles.filter((role) => isolated.has(role.id));
  const connectedRoles = roles.filter((role) => reachable.has(role.id));
  const isolatedLabels = result ? isolatedRoles.map((role) => role.label).join(", ") || "None in this scenario" : "Analysis unavailable";
  const connectedLabels = result ? connectedRoles.map((role) => role.label).join(", ") || "None" : "Analysis unavailable";
  const triedStrategies = alternateStrategies.filter((strategy) =>
    routes.filter((route) => route.alternate && route.channelId === strategy.id)
      .every((route) => activeAlternateRouteIds.has(route.id)),
  );
  const mismatchedRoutes = routes.filter((route) =>
    route.alternate &&
    activeAlternateRouteIds.has(route.id) &&
    route.channelId !== failedChannelId &&
    !usableRouteIds.has(route.id),
  );
  const mismatchSummary = mismatchedRoutes.map((route) => {
    const recipient = roles.find((role) => role.id === route.toRoleId)!;
    return `${route.label} → ${recipient.label}`;
  });
  const prompts = getDebriefPrompts(isolatedRoles.map((role) => role.label), mismatchSummary);
  const ownerLabel = roles.find((role) => role.id === worksheetOwnerId)?.label ?? "Choose a fictional role";
  const statusText = analysisError
    ? "Analysis unavailable"
    : isolated.size
      ? `${isolated.size} role${isolated.size === 1 ? "" : "s"} still isolated`
      : mismatchedRoutes.length
        ? "A route gap remains"
        : "Every role has a route";
  const impactDetail = analysisError
    ? "The sample map could not be analyzed. Reload the page to try again."
    : mismatchedRoutes.length
      ? `${mismatchSummary.join("; ")} cannot carry a message to that role in this fictional scenario.`
      : isolated.size
        ? `Still out of reach: ${isolatedLabels}. Try a route that fits those roles.`
        : "Ask the group how they would confirm that the update arrived.";
  const map = renderMap(reachable, isolated, failedLabel);

  const scenarioChoices = exerciseScenarios.map((item, index) => `<label class="scenario-choice ${item.channelId === failedChannelId ? "scenario-choice--selected" : ""}">
    <input type="radio" name="scenario" value="${item.channelId}" ${item.channelId === failedChannelId ? "checked" : ""}>
    <span class="choice-index">0${index + 1}</span><span class="choice-copy"><strong>${item.title}</strong><small>${item.setup}</small></span><span class="choice-light" aria-hidden="true"></span>
  </label>`).join("");

  const routeControls = alternateStrategies.map((strategy) => {
    const strategyRoutes = routes.filter((route) => route.alternate && route.channelId === strategy.id);
    const checked = strategyRoutes.every((route) => activeAlternateRouteIds.has(route.id));
    const incompatibleCount = strategyRoutes.filter((route) => !usableRouteIds.has(route.id)).length;
    const mismatchNote = incompatibleCount ? ` · ${incompatibleCount} written-first role${incompatibleCount === 1 ? "" : "s"} cannot use this spoken route` : "";
    return `<label class="route-option"><input type="checkbox" data-strategy="${strategy.id}" ${checked ? "checked" : ""}><span class="route-switch" aria-hidden="true"></span><span class="route-copy"><strong>${strategy.label}</strong><small>${strategy.description}${mismatchNote}</small></span><span class="route-type">${strategy.mode.toUpperCase()}</span></label>`;
  }).join("");

  const phaseBody = activePhase === "brief" ? `
    <div class="brief-layout">
      <div class="scenario-picker"><h3>Choose the moment</h3><fieldset><legend class="visually-hidden">Fictional exercise scenario</legend>${scenarioChoices}</fieldset></div>
      <aside class="readout"><div class="readout-heading"><span class="signal-led" aria-hidden="true"></span><h3>Read this to the room</h3></div><blockquote>${scenario.readAloud}</blockquote><div class="facilitator-cue"><strong>Then ask</strong><p>${scenario.discussionCue}</p></div><p class="setup-copy">${scenario.setup}</p></aside>
    </div>
    <div class="brief-map">${map}</div>` : activePhase === "outage" ? `
    <div class="phase-intro-row"><div><p class="phase-label">THE INTERRUPTION</p><h3>${scenario.title}</h3><p>${scenario.setup}</p></div><label class="channel-control">Break a channel<select id="channel-select">${channels.map((channel) => `<option value="${channel.id}" ${channel.id === failedChannelId ? "selected" : ""}>${channel.label}</option>`).join("")}</select></label></div>
    <div class="outage-layout">${map}<aside class="signal-report"><p class="phase-label">WHAT CHANGED</p><h3>${failedLabel} is out.</h3><p>${statusText}</p><p class="report-detail">${impactDetail}</p><div class="role-ledger"><div><strong>Still connected</strong><span>${connectedLabels}</span></div><div><strong>Waiting on an update</strong><span>${isolatedLabels}</span></div></div></aside></div>` : activePhase === "response" ? `
    <div class="phase-intro-row"><div><p class="phase-label">THE GROUP’S DECISION</p><h3>Which route can carry the update?</h3><p>Try each backup with the role receiving it in mind. The board marks routes that do not fit the fictional role.</p></div><div class="decision-stamp"><span class="signal-led" aria-hidden="true"></span>${statusText}</div></div>
    <div class="response-layout"><div>${map}<div class="impact" aria-live="polite"><strong>${statusText}</strong><p>${impactDetail}</p></div></div><fieldset class="route-console"><legend>Patch in a backup route</legend><p class="console-help">Choose one or both. The board recalculates immediately.</p><div class="route-list">${routeControls}</div><div class="console-note"><span class="legend-line legend-line--gap"></span><p>A visible gap means the route does not match the destination’s fictional mode.</p></div></fieldset></div>` : `
    <div class="debrief-outcome"><div class="outcome-lamp"><span class="signal-led ${isolated.size > 0 || mismatchedRoutes.length > 0 ? "signal-led--alert" : ""}" aria-hidden="true"></span><span>${statusText}</span></div><p>${impactDetail}</p></div>
    <div class="debrief-layout"><section class="room-questions"><h3>Talk it through</h3><ol>${prompts.map((prompt) => `<li>${prompt}</li>`).join("")}</ol><p class="scenario-cue">${scenario.discussionCue}</p></section><section class="action-record"><h3>Leave with one next step</h3><label for="next-change">What will the group change or practice?</label><textarea id="next-change" rows="3" maxlength="280" placeholder="Example: have the welcome desk confirm room changes over paper before doors open">${escapeHtml(nextChangeToTest)}</textarea><div class="worksheet-fields"><div class="worksheet-field"><label for="owner-role">Fictional role to lead it</label><select id="owner-role"><option value="">Choose a fictional role</option>${roles.filter((role) => role.id !== coordinatorId).map((role) => `<option value="${role.id}" ${role.id === worksheetOwnerId ? "selected" : ""}>${role.label}</option>`).join("")}</select></div><div class="worksheet-field"><label for="practice-date">Practice date</label><input id="practice-date" type="date" value="${practiceDate}"></div></div><button class="button button--print" id="print-plan" type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/></svg> Print the after-action sheet</button></section></div>
`;

  const printSheet = `<section class="print-sheet" id="follow-up"><header><p class="sheet-kicker">DEAD AIR · COMMUNITY HOUSE</p><h3>After-action sheet</h3><p>${scenario.title} · ${failedLabel} unavailable</p></header><dl class="sheet-grid"><div><dt>Still connected</dt><dd>${connectedLabels}</dd></div><div><dt>Still isolated</dt><dd>${isolatedLabels}</dd></div><div><dt>Backups tried</dt><dd>${triedStrategies.length ? triedStrategies.map((strategy) => strategy.label).join(", ") : "None selected"}</dd></div><div><dt>Routes that did not fit</dt><dd>${mismatchSummary.length ? mismatchSummary.join(" · ") : "None identified"}</dd></div></dl><div class="sheet-prompts"><h4>Questions for next time</h4><ol>${prompts.map((prompt) => `<li>${prompt}</li>`).join("")}</ol></div><div class="sheet-action"><h4>One change to test</h4><p class="action-print-value">${escapeHtml(nextChangeToTest) || "Write one route, check, or adjustment to practice."}</p></div><div class="sheet-assignments"><div><h4>Role leading next practice</h4><p>${escapeHtml(ownerLabel)}</p></div><div><h4>Practice date</h4><p>${escapeHtml(practiceDate || "Write a date")}</p></div></div><p class="sheet-foot">Fictional exercise only. Written/spoken labels are simplified scenario assumptions, not real-world accessibility guidance.</p></section>`;

  const phaseIndex = phases.findIndex((phase) => phase.id === activePhase);
  const phaseTitle: Record<ExercisePhase, string> = {
    brief: "Set the scene.",
    outage: "Break the line.",
    response: "Find a route that fits.",
    debrief: "What changes next time?",
  };
  const phaseDescription: Record<ExercisePhase, string> = {
    brief: "Choose a fictional moment and read the prompt aloud.",
    outage: "Remove one communication channel and see who loses the update.",
    response: "Test a backup route. Watch for a path that still leaves someone out.",
    debrief: "Turn what the group learned into one practiceable change.",
  };

  app.innerHTML = `
    <header class="topbar"><a class="brand" href="#" aria-label="Dead Air home"><svg class="brand-mark" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/></svg> DEAD AIR</a><span class="exercise-tag"><span class="live-dot"></span> FACILITATOR KIT</span></header>
    <main>
      <section class="masthead"><div><h1>Make the message<br><em>make it through.</em></h1><p>Run a short fictional communications drill with your group.</p></div><span class="session-time"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> ABOUT 4 MINUTES</span></section>
      <nav class="phase-rail" aria-label="Exercise steps">${phases.map((phase, index) => `<button type="button" class="phase-tab ${phase.id === activePhase ? "phase-tab--active" : ""} ${index < furthestPhaseIndex ? "phase-tab--complete" : ""}" data-phase="${phase.id}" ${index > furthestPhaseIndex ? "disabled" : ""} ${phase.id === activePhase ? 'aria-current="step"' : ""}><span class="phase-number">0${index + 1}</span><span>${phase.label}</span></button>`).join("")}</nav>
      <section class="session-panel" aria-labelledby="phase-title"><header class="phase-heading"><p class="phase-label">PHASE 0${phaseIndex + 1} / 04</p><h2 id="phase-title" tabindex="-1">${phaseTitle[activePhase]}</h2><p>${phaseDescription[activePhase]}</p></header><div class="phase-content">${phaseBody}</div><footer class="phase-footer">${phaseIndex > 0 ? `<button type="button" class="text-button" data-phase="${phases[phaseIndex - 1].id}">Back to ${phases[phaseIndex - 1].label.toLowerCase()}</button>` : `<span class="safety-note">Fictional roles only · no real messages are sent</span>`}${phaseIndex < phases.length - 1 ? `<button type="button" class="button button--next" data-phase="${phases[phaseIndex + 1].id}" data-advance="true">${activePhase === "brief" ? "Begin the outage" : activePhase === "outage" ? "Choose a backup route" : "Debrief the result"}<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>` : `<span class="safety-note">Nothing here replaces local emergency guidance.</span>`}</footer></section>
      ${activePhase === "debrief" ? printSheet : ""}
      <footer class="site-footer"><span>DEAD AIR · PRACTICE, NOT RESPONSE</span><span>Worksheet data stays in this browser. GitHub Pages may log standard visit data.</span></footer>
    </main>`;

  document.querySelectorAll<HTMLButtonElement>("[data-phase]").forEach((button) => {
    button.addEventListener("click", () => navigateToPhase(button.dataset.phase as ExercisePhase, button.dataset.advance === "true"));
  });
  document.querySelectorAll<HTMLInputElement>('input[name="scenario"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || input.value === failedChannelId) return;
    failedChannelId = input.value as ChannelId;
    activeAlternateRouteIds.clear();
    render();
    document.querySelector<HTMLInputElement>(`input[name="scenario"][value="${input.value}"]`)?.focus();
  }));
  document.querySelector<HTMLSelectElement>("#channel-select")?.addEventListener("change", (event) => {
    failedChannelId = (event.target as HTMLSelectElement).value as ChannelId;
    activeAlternateRouteIds.clear();
    render();
    document.querySelector<HTMLSelectElement>("#channel-select")?.focus();
  });
  document.querySelectorAll<HTMLInputElement>("[data-strategy]").forEach((input) => input.addEventListener("change", () => {
    const strategyRouteIds = routes.filter((route) => route.alternate && route.channelId === input.dataset.strategy).map((route) => route.id);
    strategyRouteIds.forEach((id) => input.checked ? activeAlternateRouteIds.add(id) : activeAlternateRouteIds.delete(id));
    render();
    document.querySelector<HTMLInputElement>(`[data-strategy="${input.dataset.strategy}"]`)?.focus();
  }));
  document.querySelector<HTMLTextAreaElement>("#next-change")?.addEventListener("input", (event) => {
    nextChangeToTest = (event.target as HTMLTextAreaElement).value;
    const printableAction = document.querySelector<HTMLElement>(".action-print-value");
    if (printableAction) printableAction.textContent = nextChangeToTest || "Write one route, check, or adjustment to practice.";
  });
  document.querySelector<HTMLSelectElement>("#owner-role")?.addEventListener("change", (event) => {
    worksheetOwnerId = (event.target as HTMLSelectElement).value;
    const owner = document.querySelector<HTMLElement>(".sheet-assignments div:first-child p");
    if (owner) owner.textContent = roles.find((role) => role.id === worksheetOwnerId)?.label ?? "Choose a fictional role";
  });
  document.querySelector<HTMLInputElement>("#practice-date")?.addEventListener("change", (event) => {
    practiceDate = (event.target as HTMLInputElement).value;
    const date = document.querySelector<HTMLElement>(".sheet-assignments div:last-child p");
    if (date) date.textContent = practiceDate || "Write a date";
  });
  document.querySelector<HTMLButtonElement>("#print-plan")?.addEventListener("click", () => window.print());
}

render();

window.addEventListener("resize", () => {
  const nextCompactMap = window.matchMedia("(max-width: 560px)").matches;
  if (nextCompactMap !== compactMap) {
    compactMap = nextCompactMap;
    render();
  }
});
