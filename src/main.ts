import { channels, coordinatorId, roles as sampleRoles, routes as sampleRoutes } from "./data/sample-map";
import { exerciseScenarios, type ExercisePackage } from "./data/exercise-scenarios";
import { analyzeCommunicationNetwork } from "./domain/communication-network";
import { getDebriefPrompts } from "./domain/debrief-prompts";
import { prepareDrillRoutes } from "./domain/drill-analysis";
import { parseExercisePackage, serializeExercisePackage } from "./domain/exercise-package";
import type { CommunicationMode, CommunicationRoute, Role } from "./data/sample-map";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./styles.css";

type ExercisePhase = "brief" | "outage" | "response" | "inject" | "debrief";
type SessionDraft = { action: string; ownerId: string; practiceDate: string; actionStatus: string };

const app = document.querySelector<HTMLDivElement>("#app")!;
const phases: { id: ExercisePhase; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "outage", label: "Break" },
  { id: "response", label: "Patch" },
  { id: "inject", label: "Inject" },
  { id: "debrief", label: "Debrief" },
];
const exerciseDrafts = new Map<string, ExercisePackage>();
const sessionDrafts = new Map<string, SessionDraft>();
let exercise = cloneExercisePackage(exerciseScenarios[0]);
let activePhase: ExercisePhase = "brief";
let furthestPhaseIndex = 0;
let failedChannelIds = new Set<string>([exercise.initialFailedChannelId]);
let activeAlternateRouteIds = new Set<string>();
let injectRevealed = false;
let editorOpen = false;
let compactMap = window.matchMedia("(max-width: 560px)").matches;
let nextCustomId = 1;
let importStatus = "";

function cloneExercisePackage(value: ExercisePackage): ExercisePackage {
  return JSON.parse(JSON.stringify(value)) as ExercisePackage;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function storeExerciseDraft() {
  exerciseDrafts.set(exercise.id, cloneExercisePackage(exercise));
}

function exerciseLibrary() {
  const items = new Map(exerciseScenarios.map((item) => [item.id, item]));
  exerciseDrafts.forEach((item, id) => items.set(id, item));
  return [...items.values()];
}

function routeChannelIds() {
  return [...new Set(exercise.routes.flatMap((route) => [route.channelId, route.acknowledgementChannelId].filter((id): id is string => Boolean(id))))];
}

function channelLabel(id: string) {
  return channels.find((channel) => channel.id === id)?.label ?? id.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

function position(roleId: string) {
  const role = exercise.roles.find((item) => item.id === roleId)!;
  if (!compactMap) return { x: role.x, y: role.y };
  if (roleId === exercise.coordinatorId) return { x: 180, y: 365 };
  const others = exercise.roles.filter((item) => item.id !== exercise.coordinatorId);
  const index = others.findIndex((item) => item.id === roleId);
  const angle = -Math.PI / 2 + 2 * Math.PI * index / Math.max(others.length, 1);
  return { x: 180 + 96 * Math.cos(angle), y: 365 + 232 * Math.sin(angle) };
}

function routePath(route: CommunicationRoute) {
  const from = position(route.fromRoleId);
  const to = position(route.toRoleId);
  const parallelRoutes = exercise.routes.filter((item) => item.fromRoleId === route.fromRoleId && item.toRoleId === route.toRoleId);
  const lane = parallelRoutes.indexOf(route) - (parallelRoutes.length - 1) / 2;
  const controlX = (from.x + to.x) / 2;
  const controlY = (from.y + to.y) / 2 + (route.alternate ? 52 : -22) + lane * 24;
  return {
    from,
    to,
    deliveryPath: `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`,
    acknowledgementPath: `M ${to.x} ${to.y} Q ${controlX} ${controlY + 8} ${from.x} ${from.y}`,
    labelY: (from.y + 2 * controlY + to.y) / 4,
  };
}

function analyze() {
  try {
    const prepared = prepareDrillRoutes(exercise.roles, exercise.routes, [...failedChannelIds], [...activeAlternateRouteIds]);
    const deliveryActiveAlternates = prepared.deliveryRoutes.filter((route) => route.alternate).map((route) => route.id);
    const acknowledgementActiveAlternates = prepared.acknowledgementRoutes.filter((route) => route.alternate).map((route) => route.id);
    const input = { roles: exercise.roles, coordinatorId: exercise.coordinatorId, failedChannelId: null, activeAlternateRouteIds: deliveryActiveAlternates };
    const acknowledgementResults = exercise.roles.map((role) => analyzeCommunicationNetwork({
      ...input,
      coordinatorId: role.id,
      routes: prepared.acknowledgementRoutes,
      activeAlternateRouteIds: acknowledgementActiveAlternates,
    }));
    const acknowledgmentReachableRoleIds = exercise.roles
      .filter((role, index) => role.id === exercise.coordinatorId || acknowledgementResults[index].reachableRoleIds.includes(exercise.coordinatorId))
      .map((role) => role.id);
    return {
      delivery: analyzeCommunicationNetwork({ ...input, routes: prepared.deliveryRoutes }),
      acknowledgement: {
        reachableRoleIds: acknowledgmentReachableRoleIds,
        isolatedRoleIds: exercise.roles.filter((role) => !acknowledgmentReachableRoleIds.includes(role.id)).map((role) => role.id),
      },
      deliveryRoutes: prepared.deliveryRoutes,
      acknowledgementRoutes: prepared.acknowledgementRoutes,
      error: "",
    };
  } catch (error) {
    return {
      delivery: { reachableRoleIds: [], isolatedRoleIds: exercise.roles.map((role) => role.id) },
      acknowledgement: { reachableRoleIds: [], isolatedRoleIds: exercise.roles.map((role) => role.id) },
      deliveryRoutes: [],
      acknowledgementRoutes: [],
      error: error instanceof Error ? error.message : "The exercise could not be analyzed.",
    };
  }
}

function statusForRole(role: Role, reachableIds: Set<string>, mismatchRoleIds: Set<string>, coordinatorRoleId: string, acknowledgment = false) {
  if (reachableIds.has(role.id)) return acknowledgment ? "Acknowledgment path" : "Delivery path";
  if (!acknowledgment && mismatchRoleIds.has(role.id)) return "Mode mismatch";
  if (role.id === coordinatorRoleId) return "Starting point";
  return acknowledgment ? "No modeled return path" : "No modeled delivery path";
}

function renderMap(result: ReturnType<typeof analyze>, mismatchRoleIds: Set<string>) {
  const deliveryReachable = new Set(result.delivery.reachableRoleIds);
  const acknowledgmentReachable = new Set(result.acknowledgement.reachableRoleIds);
  const deliveryRouteIds = new Set(result.deliveryRoutes.map((route) => route.id));
  const acknowledgmentRouteIds = new Set(result.acknowledgementRoutes.map((route) => route.id.replace(/:ack$/, "")));
  const edges = exercise.routes.map((route) => {
    const { deliveryPath, acknowledgementPath, from, to, labelY } = routePath(route);
    const selected = !route.alternate || activeAlternateRouteIds.has(route.id);
    const deliveryFailed = failedChannelIds.has(route.channelId);
    const deliveryUsable = deliveryRouteIds.has(route.id);
    const deliveryClass = deliveryFailed ? "failed" : selected && !deliveryUsable ? "mismatch" : deliveryUsable ? "active" : "idle";
    const ackModeFits = route.acknowledgementMode && rolesById().get(route.fromRoleId)?.acceptedModes?.includes(route.acknowledgementMode);
    const ackFailed = Boolean(route.acknowledgementChannelId && failedChannelIds.has(route.acknowledgementChannelId));
    const ackUsable = acknowledgmentRouteIds.has(route.id);
    const ackClass = ackFailed ? "failed" : ackUsable ? "active" : selected && !ackModeFits ? "mismatch" : "idle";
    const label = deliveryFailed ? "CHANNEL DOWN" : deliveryClass === "mismatch" ? "MODE GAP" : route.label.toUpperCase();
    const ackEdge = route.acknowledgementChannelId
      ? `<path class="edge edge--ack-${ackClass}" d="${acknowledgementPath}" ${ackUsable ? 'marker-end="url(#ack-arrow)"' : ""}/><text class="edge-label edge-label--ack" x="${(from.x + to.x) / 2}" y="${labelY + 14}">ACK · ${escapeHtml(channelLabel(route.acknowledgementChannelId).toUpperCase())}</text>`
      : "";
    return `<path class="edge edge--${deliveryClass}" d="${deliveryPath}" ${deliveryUsable ? 'marker-end="url(#delivery-arrow)"' : ""}/><text class="edge-label" x="${(from.x + to.x) / 2}" y="${labelY - 8}">${escapeHtml(label)}</text>${ackEdge}`;
  }).join("");

  const nodes = exercise.roles.map((role) => {
    const delivered = deliveryReachable.has(role.id);
    const acknowledged = acknowledgmentReachable.has(role.id);
    const state = delivered ? acknowledged ? "reachable" : "unconfirmed" : "isolated";
    const modeLabel = role.acceptedModes?.length
      ? role.acceptedModes.map((mode) => mode === "written" ? "WRITTEN" : "SPOKEN").join(" · ")
      : role.acceptedModes === undefined ? "MODES NOT SET" : "NO MODE ACCEPTED";
    const point = position(role.id);
    const displayState = role.id === exercise.coordinatorId ? "COORDINATOR" : state === "reachable" ? "DELIVERY + ACK" : state === "unconfirmed" ? "NEEDS ACK" : mismatchRoleIds.has(role.id) ? "MODE GAP" : "NO ROUTE";
    return `<g class="node node--${state}" transform="translate(${point.x} ${point.y})"><circle class="node-ring" r="34"/><circle class="node-dot" r="6"/><text class="node-name" y="54">${escapeHtml(role.label)}</text><text class="node-detail" y="72">${escapeHtml(role.detail)}</text><text class="node-mode" y="88">${escapeHtml(modeLabel)}</text><text class="node-state" y="-45">${displayState}</text></g>`;
  }).join("");

  const ledgerRows = exercise.roles.map((role) => `<div class="ledger-row"><dt>${escapeHtml(role.label)}</dt><dd><span class="ledger-state ledger-state--${deliveryReachable.has(role.id) ? "ready" : mismatchRoleIds.has(role.id) ? "gap" : "down"}">${statusForRole(role, deliveryReachable, mismatchRoleIds, exercise.coordinatorId)}</span><span class="ledger-state ledger-state--${acknowledgmentReachable.has(role.id) ? "ready" : "down"}">${statusForRole(role, acknowledgmentReachable, new Set(), exercise.coordinatorId, true)}</span></dd></div>`).join("");
  const deliveryCount = exercise.roles.filter((role) => role.id !== exercise.coordinatorId && deliveryReachable.has(role.id)).length;
  const acknowledgmentCount = exercise.roles.filter((role) => role.id !== exercise.coordinatorId && acknowledgmentReachable.has(role.id)).length;
  const participantCount = exercise.roles.length - 1;
  const primaryFailureText = [...failedChannelIds].map(channelLabel).join(" + ");
  return `<section class="map-panel" aria-label="Live communication switchboard">
    <div class="map-head"><div><h3>Community House</h3><p>Fictional roles · modeled paths, not proof of receipt</p></div><div class="map-summary"><span>${deliveryCount}/${participantCount} DELIVERY</span><span>${acknowledgmentCount}/${participantCount} ACK</span></div></div>
    <div class="map-canvas"><svg viewBox="${compactMap ? "0 0 360 730" : "0 0 920 520"}" role="img" aria-label="Fictional switchboard. Failed channels: ${escapeHtml(primaryFailureText)}. ${deliveryCount} of ${participantCount} roles have a modeled delivery path; ${acknowledgmentCount} have a modeled acknowledgment path."><defs><marker id="delivery-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z"/></marker><marker id="ack-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z"/></marker></defs>${edges}${nodes}</svg><span class="map-caption">NOT TO SCALE · FICTIONAL EXERCISE</span></div>
    <div class="legend"><span><i class="legend-line legend-line--delivery"></i> Delivery direction</span><span><i class="legend-line legend-line--ack"></i> Return acknowledgment</span><span><i class="legend-line legend-line--failed"></i> Failed</span><span><i class="legend-line legend-line--gap"></i> Mode gap</span></div>
    <section class="signal-ledger" aria-label="Route status by fictional role"><div class="ledger-heading"><span>Role</span><span>Delivery</span><span>Acknowledgment</span></div><dl>${ledgerRows}</dl></section>
  </section>`;
}

function rolesById() {
  return new Map(exercise.roles.map((role) => [role.id, role]));
}

function routeModeMismatch(route: CommunicationRoute) {
  const recipient = rolesById().get(route.toRoleId);
  if (!recipient || recipient.acceptedModes === undefined) return false;
  if (!route.mode) return recipient.acceptedModes.length === 0;
  return !recipient.acceptedModes.includes(route.mode);
}

function channelOptions(selected: string, excluded = "") {
  return routeChannelIds().filter((id) => id !== excluded).map((id) => `<option value="${escapeHtml(id)}" ${id === selected ? "selected" : ""}>${escapeHtml(channelLabel(id))}</option>`).join("");
}

function modeOptions(selected = "", allowUnspecified = true) {
  const unspecified = allowUnspecified ? `<option value="" ${selected === "" ? "selected" : ""}>Unspecified</option>` : "";
  return `${unspecified}<option value="written" ${selected === "written" ? "selected" : ""}>Written</option><option value="spoken" ${selected === "spoken" ? "selected" : ""}>Spoken</option>`;
}

function renderEditor() {
  if (!editorOpen) return "";
  const roleOptions = exercise.roles.map((role) => `<option value="${escapeHtml(role.id)}">${escapeHtml(role.label)}</option>`).join("");
  const routeRows = exercise.routes.map((route) => `<div class="route-builder-row" role="group" aria-label="Route ${escapeHtml(route.label)}">
    <label>From<select id="route-from-${escapeHtml(route.id)}" data-route-field="fromRoleId" data-route-id="${escapeHtml(route.id)}">${exercise.roles.map((role) => `<option value="${escapeHtml(role.id)}" ${route.fromRoleId === role.id ? "selected" : ""}>${escapeHtml(role.label)}</option>`).join("")}</select></label>
    <label>To<select id="route-to-${escapeHtml(route.id)}" data-route-field="toRoleId" data-route-id="${escapeHtml(route.id)}">${exercise.roles.map((role) => `<option value="${escapeHtml(role.id)}" ${route.toRoleId === role.id ? "selected" : ""}>${escapeHtml(role.label)}</option>`).join("")}</select></label>
    <label>Route label<input id="route-label-${escapeHtml(route.id)}" data-route-field="label" data-route-id="${escapeHtml(route.id)}" maxlength="56" value="${escapeHtml(route.label)}"></label>
    <label>Channel ID<input id="route-channel-${escapeHtml(route.id)}" data-route-field="channelId" data-route-id="${escapeHtml(route.id)}" maxlength="32" value="${escapeHtml(route.channelId)}" aria-describedby="channel-id-help"></label>
    <label>Delivery mode<select id="route-mode-${escapeHtml(route.id)}" data-route-field="mode" data-route-id="${escapeHtml(route.id)}">${modeOptions(route.mode ?? "")}</select></label>
    <label class="check-label"><input type="checkbox" data-route-field="alternate" data-route-id="${escapeHtml(route.id)}" ${route.alternate ? "checked" : ""}> Backup route</label>
    <label class="check-label"><input type="checkbox" data-route-ack="${escapeHtml(route.id)}" ${route.acknowledgementChannelId ? "checked" : ""}> Can carry a reply back</label>
    ${route.acknowledgementChannelId ? `<div class="ack-builder-fields"><label>Reply channel ID<input id="ack-channel-${escapeHtml(route.id)}" data-route-field="acknowledgementChannelId" data-route-id="${escapeHtml(route.id)}" maxlength="32" value="${escapeHtml(route.acknowledgementChannelId)}"></label><label>Reply mode<select id="ack-mode-${escapeHtml(route.id)}" data-route-field="acknowledgementMode" data-route-id="${escapeHtml(route.id)}">${modeOptions(route.acknowledgementMode ?? "", false)}</select></label></div>` : ""}
    <button type="button" class="text-button text-button--remove" data-remove-route="${escapeHtml(route.id)}" ${exercise.routes.length <= 1 ? "disabled" : ""}>Remove route</button>
  </div>`).join("");

  const roleRows = exercise.roles.map((role) => `<div class="role-builder-row" role="group" aria-label="Edit ${escapeHtml(role.label)}">
    <label>Role label<input id="role-label-${escapeHtml(role.id)}" data-role-field="label" data-role-id="${escapeHtml(role.id)}" maxlength="48" value="${escapeHtml(role.label)}"></label>
    <label>Location<input id="role-detail-${escapeHtml(role.id)}" data-role-field="detail" data-role-id="${escapeHtml(role.id)}" maxlength="64" value="${escapeHtml(role.detail)}"></label>
    <div class="mode-builder"><span>Can receive</span><label class="check-label"><input type="checkbox" data-role-mode="written" data-role-id="${escapeHtml(role.id)}" ${role.acceptedModes === undefined || role.acceptedModes.includes("written") ? "checked" : ""}> Written</label><label class="check-label"><input type="checkbox" data-role-mode="spoken" data-role-id="${escapeHtml(role.id)}" ${role.acceptedModes === undefined || role.acceptedModes.includes("spoken") ? "checked" : ""}> Spoken</label></div>
    <button type="button" class="text-button text-button--remove" data-remove-role="${escapeHtml(role.id)}" ${role.id === exercise.coordinatorId || exercise.roles.length <= 2 ? "disabled" : ""}>Remove role</button>
  </div>`).join("");

  return `<section class="exercise-editor" aria-labelledby="editor-title"><header><div><h3 id="editor-title">Build this exercise</h3><p>Use fictional role labels. Changes stay in this page until you export them.</p></div><button type="button" class="text-button" id="close-editor">Close editor</button></header>
    <div class="editor-copy-grid"><label>Exercise title<input id="exercise-title" data-package-field="title" maxlength="80" value="${escapeHtml(exercise.title)}"></label><label>Objective<textarea id="exercise-objective" data-package-field="objective" maxlength="240">${escapeHtml(exercise.objective)}</textarea></label><label>Situation<textarea id="exercise-setup" data-package-field="setup" maxlength="560">${escapeHtml(exercise.setup)}</textarea></label><label>Read aloud<textarea id="exercise-readaloud" data-package-field="readAloud" maxlength="420">${escapeHtml(exercise.readAloud)}</textarea></label><label>Discussion cue<textarea id="exercise-cue" data-package-field="discussionCue" maxlength="240">${escapeHtml(exercise.discussionCue)}</textarea></label></div>
    <div class="editor-select-grid"><label>First failed channel<select id="initial-failure" data-package-field="initialFailedChannelId">${channelOptions(exercise.initialFailedChannelId)}</select></label><label>Inject fails a second channel<select id="inject-failure" data-package-field="inject.failedChannelId">${channelOptions(exercise.inject.failedChannelId, exercise.initialFailedChannelId)}</select></label><label>Inject title<input id="inject-title" data-package-field="inject.title" maxlength="64" value="${escapeHtml(exercise.inject.title)}"></label><label>Inject text<textarea id="inject-body" data-package-field="inject.body" maxlength="360">${escapeHtml(exercise.inject.body)}</textarea></label></div>
    <section class="editor-list"><header><div><h4>Fictional roles</h4><p>Set which communication modes each role can receive in this exercise.</p></div><button type="button" class="button button--small" id="add-role" ${exercise.roles.length >= 10 ? "disabled" : ""}>Add role</button></header><div class="builder-rows">${roleRows}</div></section>
    <section class="editor-list"><header><div><h4>Communication routes</h4><p>Channel IDs use lowercase letters, numbers, and hyphens.</p></div><button type="button" class="button button--small" id="add-route" ${exercise.routes.length >= 24 ? "disabled" : ""}>Add route</button></header><datalist id="known-channels">${routeChannelIds().map((id) => `<option value="${escapeHtml(id)}">`).join("")}</datalist><p class="visually-hidden" id="channel-id-help">Use lowercase letters, numbers, and hyphens.</p><div class="builder-rows">${routeRows}</div></section>
    <p class="editor-safety">This is a fictional practice model. Never enter a real person’s name, contact details, or emergency procedure.</p>
  </section>`;
}

function selectedAlternates() {
  const groups = new Map<string, CommunicationRoute[]>();
  exercise.routes.filter((route) => route.alternate).forEach((route) => {
    const group = groups.get(route.channelId) ?? [];
    group.push(route);
    groups.set(route.channelId, group);
  });
  return [...groups].map(([channelId, group]) => {
    const checked = group.length > 0 && group.every((route) => activeAlternateRouteIds.has(route.id));
    const mismatchCount = group.filter(routeModeMismatch).length;
    const detail = group.map((route) => route.label).join(" · ");
    return `<label class="route-option"><input type="checkbox" data-alternate-group="${escapeHtml(channelId)}" ${checked ? "checked" : ""}><span class="route-switch" aria-hidden="true"></span><span class="route-copy"><strong>${escapeHtml(channelLabel(channelId))}</strong><small>${escapeHtml(detail)}${mismatchCount ? ` · ${mismatchCount} mode mismatch${mismatchCount === 1 ? "" : "es"}` : ""}</small></span><span class="route-type">${group.length} ${group.length === 1 ? "PATH" : "PATHS"}</span></label>`;
  }).join("");
}

function navigateToPhase(phase: ExercisePhase, advance = false) {
  const targetIndex = phases.findIndex((item) => item.id === phase);
  if (phase === "debrief" && !injectRevealed) return;
  if (advance) furthestPhaseIndex = Math.max(furthestPhaseIndex, targetIndex);
  if (targetIndex > furthestPhaseIndex) return;
  activePhase = phase;
  render();
  document.querySelector<HTMLElement>("#phase-title")?.focus();
}

function selectExercise(id: string) {
  const selected = exerciseLibrary().find((item) => item.id === id);
  if (!selected) return;
  exercise = cloneExercisePackage(selected);
  resetOutage();
  sessionDrafts.set(exercise.id, sessionDrafts.get(exercise.id) ?? { action: "", ownerId: "", practiceDate: "", actionStatus: "Planned" });
  activePhase = "brief";
  furthestPhaseIndex = 0;
  editorOpen = false;
  importStatus = "";
  render();
}

function resetOutage() {
  failedChannelIds = new Set([exercise.initialFailedChannelId]);
  activeAlternateRouteIds.clear();
  injectRevealed = false;
  furthestPhaseIndex = Math.min(furthestPhaseIndex, phases.findIndex((phase) => phase.id === "response"));
  if (activePhase === "inject" || activePhase === "debrief") activePhase = "response";
}

function createExercise() {
  let id = `custom-${nextCustomId++}`;
  while (exerciseLibrary().some((item) => item.id === id)) id = `custom-${nextCustomId++}`;
  exercise = cloneExercisePackage(exercise);
  exercise.id = id;
  exercise.title = `Copy: ${exercise.title}`.slice(0, 80);
  exerciseDrafts.set(exercise.id, cloneExercisePackage(exercise));
  sessionDrafts.set(exercise.id, { action: "", ownerId: "", practiceDate: "", actionStatus: "Planned" });
  resetOutage();
  activePhase = "brief";
  furthestPhaseIndex = 0;
  editorOpen = true;
  importStatus = "Edit the copy, then export the JSON exercise file.";
  render();
  document.querySelector<HTMLInputElement>("#exercise-title")?.focus();
}

function nextUnusedId(prefix: string, existingIds: string[]) {
  const ids = new Set(existingIds);
  let suffix = 1;
  while (ids.has(`${prefix}-${suffix}`)) suffix += 1;
  return `${prefix}-${suffix}`;
}

function addRole() {
  if (exercise.roles.length >= 10) return;
  const index = exercise.roles.length;
  const id = nextUnusedId("role", exercise.roles.map((role) => role.id));
  const angle = -Math.PI / 2 + 2 * Math.PI * (index - 1) / Math.max(exercise.roles.length, 2);
  exercise.roles.push({ id, label: `Role ${index}`, detail: "Community room", x: 460 + 300 * Math.cos(angle), y: 260 + 160 * Math.sin(angle), acceptedModes: ["written", "spoken"] });
  storeExerciseDraft();
  render();
  document.querySelector<HTMLInputElement>(`#role-label-${id}`)?.focus();
}

function removeRole(id: string) {
  if (id === exercise.coordinatorId || exercise.roles.length <= 2) return;
  exercise.roles = exercise.roles.filter((role) => role.id !== id);
  exercise.routes = exercise.routes.filter((route) => route.fromRoleId !== id && route.toRoleId !== id);
  activeAlternateRouteIds = new Set([...activeAlternateRouteIds].filter((routeId) => exercise.routes.some((route) => route.id === routeId)));
  storeExerciseDraft();
  render();
}

function addRoute() {
  if (exercise.routes.length >= 24) return;
  const id = nextUnusedId("route", exercise.routes.map((route) => route.id));
  const receiver = exercise.roles.find((role) => role.id !== exercise.coordinatorId)!;
  exercise.routes.push({ id, fromRoleId: exercise.coordinatorId, toRoleId: receiver.id, label: "New route", channelId: exercise.initialFailedChannelId, alternate: false, mode: "written" });
  storeExerciseDraft();
  render();
  document.querySelector<HTMLInputElement>(`#route-label-${id}`)?.focus();
}

function removeRoute(id: string) {
  if (exercise.routes.length <= 1) return;
  exercise.routes = exercise.routes.filter((route) => route.id !== id);
  activeAlternateRouteIds.delete(id);
  storeExerciseDraft();
  render();
}

function updateEditorValue(event: Event) {
  const control = event.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const value = control.type === "checkbox" ? (control as HTMLInputElement).checked : control.value;
  if (control.dataset.packageField) {
    const field = control.dataset.packageField;
    if (field.startsWith("inject.")) exercise.inject[field.slice(7) as "title" | "body" | "failedChannelId"] = String(value);
    else if (field === "initialFailedChannelId") {
      const previousFailure = exercise.initialFailedChannelId;
      exercise.initialFailedChannelId = String(value);
      if (exercise.inject.failedChannelId === exercise.initialFailedChannelId) exercise.inject.failedChannelId = previousFailure;
      resetOutage();
    }
    else exercise[field as "title" | "setup" | "readAloud" | "discussionCue" | "objective"] = String(value);
  }
  if (control.dataset.roleField) {
    const role = rolesById().get(control.dataset.roleId!);
    if (role) role[control.dataset.roleField as "label" | "detail"] = String(value);
  }
  if (control.dataset.routeField) {
    const route = exercise.routes.find((item) => item.id === control.dataset.routeId);
    if (route) {
      const field = control.dataset.routeField as keyof CommunicationRoute;
      if (field === "alternate") route.alternate = Boolean(value);
      else if (field === "acknowledgementChannelId") {
        if (value) {
          route.acknowledgementChannelId = String(value);
          route.acknowledgementMode ??= "written";
        } else {
          delete route.acknowledgementChannelId;
          delete route.acknowledgementMode;
        }
      } else if (field === "acknowledgementMode") {
        route.acknowledgementMode = String(value) as CommunicationMode;
      } else if (field === "mode") {
        if (value) route.mode = String(value) as CommunicationMode;
        else delete route.mode;
      } else if (field === "fromRoleId" || field === "toRoleId" || field === "label" || field === "channelId") route[field] = String(value);
    }
  }
  storeExerciseDraft();
}

function updateRoleMode(event: Event) {
  const control = event.currentTarget as HTMLInputElement;
  const role = rolesById().get(control.dataset.roleId!);
  if (!role) return;
  const modes = new Set<CommunicationMode>(role.acceptedModes ?? ["written", "spoken"]);
  if (control.checked) modes.add(control.dataset.roleMode as CommunicationMode);
  else modes.delete(control.dataset.roleMode as CommunicationMode);
  role.acceptedModes = [...modes];
  storeExerciseDraft();
}

function updateAcknowledgementToggle(event: Event) {
  const control = event.currentTarget as HTMLInputElement;
  const route = exercise.routes.find((item) => item.id === control.dataset.routeAck);
  if (!route) return;
  if (control.checked) {
    route.acknowledgementChannelId = route.channelId;
    route.acknowledgementMode = route.mode ?? "written";
  } else {
    delete route.acknowledgementChannelId;
    delete route.acknowledgementMode;
  }
  storeExerciseDraft();
}

function saveSessionDraft(changes: Partial<SessionDraft>) {
  const current = sessionDrafts.get(exercise.id) ?? { action: "", ownerId: "", practiceDate: "", actionStatus: "Planned" };
  sessionDrafts.set(exercise.id, { ...current, ...changes });
  const action = document.querySelector<HTMLElement>(".action-print-value");
  if (action && changes.action !== undefined) action.textContent = changes.action || "Write one route, check, or adjustment to practice.";
  const owner = document.querySelector<HTMLElement>(".sheet-assignments div:first-child p");
  if (owner && changes.ownerId !== undefined) owner.textContent = rolesById().get(changes.ownerId)?.label ?? "Write a fictional role";
  const date = document.querySelector<HTMLElement>(".sheet-assignments div:nth-child(2) p");
  if (date && changes.practiceDate !== undefined) date.textContent = changes.practiceDate || "Write a date";
  const status = document.querySelector<HTMLElement>(".sheet-assignments div:last-child p");
  if (status && changes.actionStatus !== undefined) status.textContent = changes.actionStatus;
}

async function importExercise(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 64_000) throw new Error("Exercise files must be smaller than 64 KB.");
    const imported = parseExercisePackage(JSON.parse(await file.text()));
    if (exerciseLibrary().some((item) => item.id === imported.id)) {
      imported.id = `custom-${nextCustomId++}`;
      imported.title = `Imported: ${imported.title}`.slice(0, 80);
    }
    exerciseDrafts.set(imported.id, cloneExercisePackage(imported));
    selectExercise(imported.id);
    importStatus = `Loaded “${imported.title}”. Export a copy to keep it.`;
    editorOpen = true;
    render();
  } catch (error) {
    importStatus = `Could not import: ${error instanceof Error ? error.message : "Invalid exercise file."}`;
    render();
  } finally {
    input.value = "";
  }
}

function exportExercise() {
  try {
    const json = serializeExercisePackage(exercise);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exercise.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    importStatus = "Exercise exported to a local JSON file.";
  } catch (error) {
    importStatus = `Export needs attention: ${error instanceof Error ? error.message : "Invalid exercise."}`;
  }
  render();
}

function render() {
  const result = analyze();
  const deliveryReachable = new Set(result.delivery.reachableRoleIds);
  const acknowledgmentReachable = new Set(result.acknowledgement.reachableRoleIds);
  const participantRoles = exercise.roles.filter((role) => role.id !== exercise.coordinatorId);
  const unreachableRoles = participantRoles.filter((role) => !deliveryReachable.has(role.id));
  const unconfirmedRoles = participantRoles.filter((role) => deliveryReachable.has(role.id) && !acknowledgmentReachable.has(role.id));
  const usableDeliveryIds = new Set(result.deliveryRoutes.map((route) => route.id));
  const mismatchRoutes = exercise.routes.filter((route) => {
    const isSelected = !route.alternate || activeAlternateRouteIds.has(route.id);
    return isSelected && !failedChannelIds.has(route.channelId) && !usableDeliveryIds.has(route.id) && routeModeMismatch(route);
  });
  const mismatchRoleIds = new Set(mismatchRoutes.map((route) => route.toRoleId));
  const mismatchLabels = mismatchRoutes.map((route) => `${route.label} → ${rolesById().get(route.toRoleId)?.label ?? "unknown role"}`);
  const prompts = getDebriefPrompts({ objective: exercise.objective, unreachableRoleLabels: unreachableRoles.map((role) => role.label), unconfirmedRoleLabels: unconfirmedRoles.map((role) => role.label), mismatchedRouteLabels: mismatchLabels });
  const session = sessionDrafts.get(exercise.id) ?? { action: "", ownerId: "", practiceDate: "", actionStatus: "Planned" };
  const ownerLabel = rolesById().get(session.ownerId)?.label ?? "Write a fictional role";
  const hasGap = unreachableRoles.length > 0 || unconfirmedRoles.length > 0 || mismatchRoutes.length > 0;
  const resultLabel = result.error
    ? "Analysis needs attention"
    : unreachableRoles.length
      ? `${unreachableRoles.length} role${unreachableRoles.length === 1 ? "" : "s"} without a delivery path`
      : unconfirmedRoles.length
        ? `${unconfirmedRoles.length} role${unconfirmedRoles.length === 1 ? "" : "s"} without an acknowledgment path`
        : mismatchRoutes.length
          ? "A selected route does not fit"
          : "Modeled paths cover the objective";
  const map = renderMap(result, mismatchRoleIds);
  const currentFailure = [...failedChannelIds].map(channelLabel).join(" + ");
  const scenarioChoices = exerciseLibrary().map((item) => `<button class="scenario-choice ${item.id === exercise.id ? "scenario-choice--selected" : ""}" type="button" data-select-scenario="${escapeHtml(item.id)}" aria-pressed="${item.id === exercise.id}"><span class="choice-light" aria-hidden="true"></span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.setup)}</small></button>`).join("");
  const alternateControls = selectedAlternates() || `<p class="empty-routes">No backup routes yet. Add a route in the exercise editor.</p>`;
  const phaseIndex = phases.findIndex((phase) => phase.id === activePhase);
  const phaseTitle: Record<ExercisePhase, string> = { brief: "Set the scene.", outage: "Break the first line.", response: "Patch in another route.", inject: "The signal drops again.", debrief: "What will the group change?" };
  const phaseDescription: Record<ExercisePhase, string> = { brief: "Choose a fictional exercise or shape one for this session.", outage: "Remove one channel and inspect the modeled delivery and return paths.", response: "Choose backup routes. A possible route does not prove anyone received the update.", inject: "Reveal a second channel failure when the room is ready.", debrief: "Compare the map with the objective, then record one next action." };

  const phaseBody = activePhase === "brief" ? `
    <div class="brief-layout"><section class="scenario-picker"><header><div><h3>Choose or shape an exercise</h3><p>Starter scenarios are fictional. Edit, export, or import a local exercise.</p></div><button class="button button--small" type="button" id="new-exercise">Create a copy</button></header><div class="scenario-list">${scenarioChoices}</div><div class="scenario-file-actions"><button class="text-button" type="button" id="import-exercise">Import JSON</button><button class="text-button" type="button" id="export-exercise">Export this exercise</button><input class="visually-hidden" type="file" id="exercise-file" accept="application/json,.json"><span class="file-status" role="status">${escapeHtml(importStatus)}</span></div></section><aside class="readout"><div class="readout-heading"><span class="signal-led" aria-hidden="true"></span><h3>Read this to the room</h3></div><blockquote>${escapeHtml(exercise.readAloud)}</blockquote><div class="objective-readout"><span>EXERCISE OBJECTIVE</span><p>${escapeHtml(exercise.objective)}</p></div><div class="facilitator-cue"><strong>Then ask</strong><p>${escapeHtml(exercise.discussionCue)}</p></div><button type="button" class="text-button" id="toggle-editor">${editorOpen ? "Close exercise editor" : "Edit this fictional exercise"}</button></aside></div>
    ${renderEditor()}<div class="brief-map">${map}</div>` : activePhase === "outage" ? `
    <div class="phase-intro-row"><div><p class="phase-label">THE FIRST INTERRUPTION</p><h3>${escapeHtml(exercise.title)}</h3><p>${escapeHtml(exercise.setup)}</p><p class="objective-line"><strong>Objective:</strong> ${escapeHtml(exercise.objective)}</p></div><label class="channel-control">First channel to fail<select id="initial-channel">${channelOptions(exercise.initialFailedChannelId)}</select></label></div>
    <div class="outage-layout">${map}<aside class="signal-report"><p class="phase-label">MODELED RESULT</p><h3>${escapeHtml(resultLabel)}</h3><p>${result.error ? escapeHtml(result.error) : `Failed channel: ${escapeHtml(currentFailure)}.`}</p><div class="role-ledger"><div><strong>No modeled delivery path</strong><span>${unreachableRoles.length ? escapeHtml(unreachableRoles.map((role) => role.label).join(", ")) : "None"}</span></div><div><strong>Delivery, no modeled acknowledgment</strong><span>${unconfirmedRoles.length ? escapeHtml(unconfirmedRoles.map((role) => role.label).join(", ")) : "None"}</span></div></div></aside></div>` : activePhase === "response" ? `
    <div class="phase-intro-row"><div><p class="phase-label">THE GROUP’S RESPONSE</p><h3>Which route can carry the update?</h3><p>Try a backup and compare delivery with the separate return acknowledgment path.</p></div><div class="decision-stamp ${hasGap ? "decision-stamp--gap" : ""}"><span class="signal-led" aria-hidden="true"></span>${escapeHtml(resultLabel)}</div></div>
    <div class="response-layout"><div>${map}<div class="impact" aria-live="polite"><strong>${escapeHtml(resultLabel)}</strong><p>${escapeHtml(result.error || `Delivery gaps: ${unreachableRoles.map((role) => role.label).join(", ") || "none"}. No modeled acknowledgment path: ${unconfirmedRoles.map((role) => role.label).join(", ") || "none"}.`)}</p></div></div><fieldset class="route-console"><legend>Activate backup routes</legend><p class="console-help">The board updates as you change a route.</p><div class="route-list">${alternateControls}</div><div class="console-note"><span class="legend-line legend-line--ack"></span><p>Dashed return paths show how an acknowledgment could travel back through the modeled route.</p></div></fieldset></div>` : activePhase === "inject" ? `
    <div class="inject-layout"><section class="inject-card ${injectRevealed ? "inject-card--revealed" : ""}"><div class="inject-topline"><span class="inject-signal" aria-hidden="true"></span><span>${injectRevealed ? "SECOND FAILURE ACTIVE" : "FACILITATOR CONTROL"}</span></div><h3>${escapeHtml(exercise.inject.title)}</h3><p>${injectRevealed ? escapeHtml(exercise.inject.body) : "Pause the room. Let the group explain which backup they would try, then reveal the next event."}</p>${injectRevealed ? `<p class="inject-failure">${escapeHtml(channelLabel(exercise.inject.failedChannelId))} is now also unavailable.</p>` : `<button type="button" class="button button--next" id="reveal-inject">Reveal second failure<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>`}</section><aside class="inject-guidance"><h3>Facilitator note</h3><p>Let the group make a route choice before you reveal this card. The inject is fictional and does not simulate an actual emergency.</p><p><strong>Objective:</strong> ${escapeHtml(exercise.objective)}</p></aside></div>${injectRevealed ? `<div class="post-inject-result"><p class="phase-label">AFTER THE SECOND FAILURE</p><h3>${escapeHtml(resultLabel)}</h3><p>${escapeHtml(currentFailure)} are modeled as unavailable. Revisit both directions of the route.</p></div>${map}` : ""}` : `
    <div class="debrief-outcome"><div class="outcome-lamp ${hasGap ? "outcome-lamp--gap" : ""}"><span class="signal-led ${hasGap ? "signal-led--alert" : ""}" aria-hidden="true"></span><span>${escapeHtml(resultLabel)}</span></div><p><strong>Objective:</strong> ${escapeHtml(exercise.objective)}</p></div>
    <div class="debrief-layout"><section class="room-questions"><h3>Talk it through</h3><ol>${prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}</ol><p class="scenario-cue">${escapeHtml(exercise.discussionCue)}</p></section><section class="action-record"><h3>Record the next practice</h3><label for="next-action">What will the group change or practice?</label><textarea id="next-action" rows="3" maxlength="280" placeholder="Example: add a written way to confirm room changes before doors open">${escapeHtml(session.action)}</textarea><div class="worksheet-fields"><div class="worksheet-field"><label for="owner-role">Fictional role to lead it</label><select id="owner-role"><option value="">Choose a role</option>${exercise.roles.filter((role) => role.id !== exercise.coordinatorId).map((role) => `<option value="${escapeHtml(role.id)}" ${role.id === session.ownerId ? "selected" : ""}>${escapeHtml(role.label)}</option>`).join("")}</select></div><div class="worksheet-field"><label for="practice-date">Practice date</label><input id="practice-date" type="date" value="${escapeHtml(session.practiceDate)}"></div><div class="worksheet-field"><label for="action-status">Action status</label><select id="action-status"><option ${session.actionStatus === "Planned" ? "selected" : ""}>Planned</option><option ${session.actionStatus === "In progress" ? "selected" : ""}>In progress</option><option ${session.actionStatus === "Done" ? "selected" : ""}>Done</option></select></div></div><button class="button button--print" id="print-plan" type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/></svg> Print action sheet</button></section></div>
    <section class="print-sheet" id="follow-up"><header><p class="sheet-kicker">DEAD AIR · FICTIONAL EXERCISE</p><h3>After-action sheet</h3><p>${escapeHtml(exercise.title)} · ${escapeHtml(currentFailure)} unavailable</p></header><div class="sheet-objective"><h4>Objective</h4><p>${escapeHtml(exercise.objective)}</p></div><dl class="sheet-grid"><div><dt>Roles with a modeled delivery path</dt><dd>${escapeHtml(exercise.roles.filter((role) => role.id !== exercise.coordinatorId && deliveryReachable.has(role.id)).map((role) => role.label).join(", ") || "None")}</dd></div><div><dt>No modeled delivery path</dt><dd>${escapeHtml(unreachableRoles.map((role) => role.label).join(", ") || "None")}</dd></div><div><dt>Delivery without modeled acknowledgment</dt><dd>${escapeHtml(unconfirmedRoles.map((role) => role.label).join(", ") || "None")}</dd></div><div><dt>Routes that did not fit</dt><dd>${escapeHtml(mismatchLabels.join(" · ") || "None identified")}</dd></div></dl><div class="sheet-action"><h4>Next practice action</h4><p class="action-print-value">${escapeHtml(session.action) || "Write one route, check, or adjustment to practice."}</p><div class="sheet-assignments"><div><h4>Fictional role owner</h4><p>${escapeHtml(ownerLabel)}</p></div><div><h4>Practice date</h4><p>${escapeHtml(session.practiceDate || "Write a date")}</p></div><div><h4>Status</h4><p>${escapeHtml(session.actionStatus)}</p></div></div></div><div class="sheet-prompts"><h4>Questions for next time</h4><ol>${prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}</ol></div><p class="sheet-foot">A modeled route does not prove receipt or acknowledgment. This is a fictional discussion tool, not emergency or accessibility guidance.</p></section>`;

  const phaseNav = phases.map((phase, index) => {
    const canOpen = index <= furthestPhaseIndex && !(phase.id === "debrief" && !injectRevealed);
    return `<button type="button" class="phase-tab ${phase.id === activePhase ? "phase-tab--active" : ""} ${index < furthestPhaseIndex ? "phase-tab--complete" : ""}" data-phase="${phase.id}" ${canOpen ? "" : "disabled"} ${phase.id === activePhase ? 'aria-current="step"' : ""}><span class="phase-number">0${index + 1}</span><span>${phase.label}</span></button>`;
  }).join("");
  const nextButton = activePhase === "inject" && !injectRevealed
    ? ""
    : phaseIndex < phases.length - 1
      ? `<button type="button" class="button button--next" data-phase="${phases[phaseIndex + 1].id}" data-advance="true">${phaseIndex === 0 ? "Begin the outage" : phaseIndex === 1 ? "Choose a backup route" : phaseIndex === 2 ? "Continue to inject" : "Debrief the result"}<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>`
      : `<span class="safety-note">Practice only · no real message is sent</span>`;

  app.innerHTML = `<header class="topbar"><a class="brand" href="#" aria-label="Dead Air home"><svg class="brand-mark" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/></svg> DEAD AIR</a><span class="exercise-tag"><span class="live-dot"></span> SIGNAL ROOM</span></header><main><section class="masthead"><div><h1>Can the message<br><em>get there—and back?</em></h1><p>Run a fictional communications drill. Test the route in both directions.</p></div><span class="session-time">FACILITATOR-LED</span></section><nav class="phase-rail" aria-label="Exercise steps">${phaseNav}</nav><section class="session-panel" aria-labelledby="phase-title"><header class="phase-heading"><p class="phase-label">PHASE 0${phaseIndex + 1} / 05</p><h2 id="phase-title" tabindex="-1">${phaseTitle[activePhase]}</h2><p>${phaseDescription[activePhase]}</p></header><div class="phase-content">${phaseBody}</div><footer class="phase-footer">${phaseIndex > 0 ? `<button type="button" class="text-button" data-phase="${phases[phaseIndex - 1].id}">Back to ${phases[phaseIndex - 1].label.toLowerCase()}</button>` : `<span class="safety-note">Fictional roles only · no real messages are sent</span>`}${nextButton}</footer></section><footer class="site-footer"><span>DEAD AIR · PRACTICE, NOT RESPONSE</span><span>Data stays in this page unless you export a file. GitHub Pages may log standard visitor data.</span></footer></main>`;

  document.querySelectorAll<HTMLButtonElement>("[data-phase]").forEach((button) => button.addEventListener("click", () => navigateToPhase(button.dataset.phase as ExercisePhase, button.dataset.advance === "true")));
  document.querySelectorAll<HTMLButtonElement>("[data-select-scenario]").forEach((button) => button.addEventListener("click", () => selectExercise(button.dataset.selectScenario!)));
  document.querySelector<HTMLButtonElement>("#toggle-editor")?.addEventListener("click", () => { editorOpen = !editorOpen; render(); });
  document.querySelector<HTMLButtonElement>("#close-editor")?.addEventListener("click", () => { editorOpen = false; render(); });
  document.querySelector<HTMLButtonElement>("#new-exercise")?.addEventListener("click", createExercise);
  document.querySelector<HTMLButtonElement>("#add-role")?.addEventListener("click", addRole);
  document.querySelector<HTMLButtonElement>("#add-route")?.addEventListener("click", addRoute);
  document.querySelectorAll<HTMLButtonElement>("[data-remove-role]").forEach((button) => button.addEventListener("click", () => removeRole(button.dataset.removeRole!)));
  document.querySelectorAll<HTMLButtonElement>("[data-remove-route]").forEach((button) => button.addEventListener("click", () => removeRoute(button.dataset.removeRoute!)));
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[data-package-field], [data-role-field], [data-route-field]").forEach((control) => {
    control.addEventListener("input", updateEditorValue);
    control.addEventListener("change", (event) => { updateEditorValue(event); const id = (event.currentTarget as HTMLElement).id; render(); if (id) document.getElementById(id)?.focus(); });
  });
  document.querySelectorAll<HTMLInputElement>("[data-role-mode]").forEach((control) => control.addEventListener("change", (event) => {
    const changed = event.currentTarget as HTMLInputElement;
    updateRoleMode(event);
    render();
    document.querySelector<HTMLInputElement>(`[data-role-mode="${changed.dataset.roleMode}"][data-role-id="${changed.dataset.roleId}"]`)?.focus();
  }));
  document.querySelectorAll<HTMLInputElement>("[data-route-ack]").forEach((control) => control.addEventListener("change", (event) => {
    const routeId = (event.currentTarget as HTMLInputElement).dataset.routeAck;
    updateAcknowledgementToggle(event);
    render();
    document.querySelector<HTMLInputElement>(`[data-route-ack="${routeId}"]`)?.focus();
  }));
  document.querySelector<HTMLSelectElement>("#initial-channel")?.addEventListener("change", (event) => {
    const previousFailure = exercise.initialFailedChannelId;
    exercise.initialFailedChannelId = (event.target as HTMLSelectElement).value;
    if (exercise.inject.failedChannelId === exercise.initialFailedChannelId) exercise.inject.failedChannelId = previousFailure;
    resetOutage();
    storeExerciseDraft();
    render();
  });
  document.querySelector<HTMLSelectElement>("#inject-failure")?.addEventListener("change", (event) => { exercise.inject.failedChannelId = (event.target as HTMLSelectElement).value; storeExerciseDraft(); render(); });
  document.querySelector<HTMLButtonElement>("#import-exercise")?.addEventListener("click", () => document.querySelector<HTMLInputElement>("#exercise-file")?.click());
  document.querySelector<HTMLInputElement>("#exercise-file")?.addEventListener("change", importExercise);
  document.querySelector<HTMLButtonElement>("#export-exercise")?.addEventListener("click", exportExercise);
  document.querySelectorAll<HTMLInputElement>("[data-alternate-group]").forEach((input) => input.addEventListener("change", () => {
    exercise.routes.filter((route) => route.alternate && route.channelId === input.dataset.alternateGroup).forEach((route) => input.checked ? activeAlternateRouteIds.add(route.id) : activeAlternateRouteIds.delete(route.id));
    render();
    document.querySelector<HTMLInputElement>(`[data-alternate-group="${input.dataset.alternateGroup}"]`)?.focus();
  }));
  document.querySelector<HTMLButtonElement>("#reveal-inject")?.addEventListener("click", () => {
    injectRevealed = true;
    failedChannelIds.add(exercise.inject.failedChannelId);
    furthestPhaseIndex = Math.max(furthestPhaseIndex, phases.findIndex((phase) => phase.id === "inject"));
    render();
    document.querySelector<HTMLElement>("#phase-title")?.focus();
  });
  document.querySelector<HTMLTextAreaElement>("#next-action")?.addEventListener("input", (event) => saveSessionDraft({ action: (event.target as HTMLTextAreaElement).value }));
  document.querySelector<HTMLSelectElement>("#owner-role")?.addEventListener("change", (event) => saveSessionDraft({ ownerId: (event.target as HTMLSelectElement).value }));
  document.querySelector<HTMLInputElement>("#practice-date")?.addEventListener("change", (event) => saveSessionDraft({ practiceDate: (event.target as HTMLInputElement).value }));
  document.querySelector<HTMLSelectElement>("#action-status")?.addEventListener("change", (event) => saveSessionDraft({ actionStatus: (event.target as HTMLSelectElement).value }));
  document.querySelector<HTMLButtonElement>("#print-plan")?.addEventListener("click", () => window.print());
}

render();
window.addEventListener("resize", () => {
  const nextCompactMap = window.matchMedia("(max-width: 560px)").matches;
  if (nextCompactMap !== compactMap) { compactMap = nextCompactMap; render(); }
});
