import { alternateStrategies, channels, coordinatorId, roles, routes } from "./data/sample-map";
import { filterUsableRoutes } from "./domain/route-usability";
import { analyzeCommunicationNetwork } from "./domain/communication-network";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
let failedChannelId = channels[0].id;
const activeAlternateRouteIds = new Set<string>();
let worksheetOwnerId = "";
let practiceDate = "";
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

function render() {
  const result = analyze();
  const reachable = new Set(result?.reachableRoleIds ?? []);
  const isolated = new Set(result?.isolatedRoleIds ?? []);
  const mismatchedRoutes = routes.filter((route) =>
    route.alternate &&
    activeAlternateRouteIds.has(route.id) &&
    route.channelId !== failedChannelId &&
    !usableRouteIds.has(route.id),
  );
  const mismatchedRouteIds = new Set(mismatchedRoutes.map((route) => route.id));

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

  const failedLabel = channels.find((channel) => channel.id === failedChannelId)?.label ?? "No channel";
  const isolatedLabels = result
    ? roles.filter((role) => isolated.has(role.id)).map((role) => role.label).join(", ") || "None in this scenario"
    : "Network analysis pending";
  const triedStrategies = alternateStrategies.filter((strategy) =>
    routes.filter((route) => route.alternate && route.channelId === strategy.id)
      .every((route) => activeAlternateRouteIds.has(route.id)),
  );
  const mismatchSummary = mismatchedRoutes.map((route) => {
    const recipient = roles.find((role) => role.id === route.toRoleId)!;
    return `${route.label} → ${recipient.label}`;
  });
  const ownerLabel = roles.find((role) => role.id === worksheetOwnerId)?.label ?? "Choose a fictional role";
  const statusText = analysisError
    ? "Analysis unavailable"
    : isolated.size
      ? `${isolated.size} role${isolated.size === 1 ? "" : "s"} isolated${mismatchedRoutes.length ? ` · ${mismatchedRoutes.length} route mismatch${mismatchedRoutes.length === 1 ? "" : "es"}` : ""}`
      : "Everyone connected";
  const impactDetail = analysisError
    ? "The sample map could not be analyzed. Reload the page to try again."
    : mismatchedRoutes.length
      ? `${mismatchSummary.join("; ")} doesn’t fit the recipient’s fictional communication mode. Try Paper dispatch for written-first roles.`
      : "Reachability updates when you change the exercise.";

  app.innerHTML = `
    <header class="topbar"><a class="brand" href="#" aria-label="Dead Air home"><svg class="brand-mark" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/></svg> DEAD AIR</a><span class="exercise-tag"><span class="live-dot"></span> PRACTICE EXERCISE</span></header>
    <main>
      <section class="intro"><div><p class="eyebrow">COMMUNITY HOUSE · SAMPLE MAP</p><h1>When the signal<br><em>goes quiet.</em></h1><p class="lede">A tabletop drill that shows when a backup route still leaves a role out.</p></div><button class="button button--print" id="print-plan" type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 19 19 5M8 5h11v11"/></svg> Print follow-up plan</button></section>
      <section class="workbench" aria-label="Communications exercise">
        <div class="map-panel"><div class="map-head"><div><h2>Community House</h2><p>Fictional roles · route fit is simplified for practice</p></div><span class="map-status"><span class="status-mark"></span>${result ? `${isolated.size} ISOLATED${mismatchedRoutes.length ? ` · ${mismatchedRoutes.length} ROUTE GAPS` : ""}` : "ENGINE PENDING"}</span></div>
          <div class="map-canvas"><svg viewBox="${compactMap ? "0 0 360 730" : "0 0 920 520"}" role="img" aria-label="Fictional community map showing written-first and spoken-first roles with communication routes">${edges}${nodes}</svg><div class="map-compass" aria-hidden="true"><span>N</span><i></i></div><span class="map-caption">NOT TO SCALE · FICTIONAL ROLES</span></div>
          <div class="legend"><span><i class="legend-dot legend-dot--connected"></i> Connected</span><span><i class="legend-dot legend-dot--isolated"></i> Isolated</span><span><i class="legend-line legend-line--failed"></i> Channel down</span><span><i class="legend-line legend-line--gap"></i> Mode mismatch</span></div>
        </div>
        <aside class="controls"><div class="control-section"><p class="eyebrow">EXERCISE CONTROL</p><label for="channel-select">Simulate a channel failure</label><select id="channel-select">${channels.map((channel) => `<option value="${channel.id}" ${channel.id === failedChannelId ? "selected" : ""}>${channel.label}</option>`).join("")}</select><p class="hint">The selected channel is removed from the map.</p></div>
          <fieldset class="control-section strategy-section"><legend>Try another route</legend><p class="hint">A route only counts when its mode fits the receiving role.</p><div class="route-list">${alternateStrategies.map((strategy) => {
            const strategyRoutes = routes.filter((route) => route.alternate && route.channelId === strategy.id);
            const checked = strategyRoutes.every((route) => activeAlternateRouteIds.has(route.id));
            const incompatibleCount = strategyRoutes.filter((route) => !usableRouteIds.has(route.id)).length;
            const mismatchNote = incompatibleCount ? ` · ${incompatibleCount} written-first role${incompatibleCount === 1 ? "" : "s"} won’t fit this spoken route` : "";
            return `<label class="route-option"><input type="checkbox" data-strategy="${strategy.id}" ${checked ? "checked" : ""}><span class="route-switch" aria-hidden="true"></span><span class="route-copy"><strong>${strategy.label}</strong><small>${strategy.description}${strategy.id === "paper" ? " · Welcome desk → Programs lead" : " · all four role areas"}${mismatchNote}</small></span><b class="route-type">${strategy.mode.toUpperCase()}</b></label>`;
          }).join("")}</div></fieldset>
          <div class="impact" aria-live="polite"><span class="impact-icon" aria-hidden="true">!</span><div><strong>${statusText}</strong><p>${impactDetail}</p></div></div>
          <p class="safety-note">Fictional practice only. Mode labels are simplified scenario assumptions, not accessibility guarantees or emergency guidance.</p>
        </aside>
      </section>
      <section class="print-plan" id="follow-up"><p class="eyebrow">COMMUNITY HOUSE · FOLLOW-UP</p><h2>Leave a route worth practicing.</h2><p class="plan-intro">A fictional discussion record. Use role labels only; nothing is saved or sent.</p><div class="plan-grid"><div><h3>Scenario</h3><p>${failedLabel} unavailable</p></div><div><h3>Roles still isolated</h3><p>${isolatedLabels}</p></div><div><h3>Backup routes tried</h3><p>${triedStrategies.length ? triedStrategies.map((strategy) => strategy.label).join(", ") : "None selected"}</p></div></div>
        <div class="mismatch-report"><h3>Routes that didn’t fit</h3><p>${mismatchSummary.length ? mismatchSummary.join(" · ") : "No active route mismatches in this scenario"}</p></div>
        <div class="worksheet-fields"><div class="worksheet-field"><label for="owner-role">Fictional role to lead the next practice</label><select id="owner-role"><option value="">Choose a fictional role</option>${roles.filter((role) => role.id !== coordinatorId).map((role) => `<option value="${role.id}" ${role.id === worksheetOwnerId ? "selected" : ""}>${role.label}</option>`).join("")}</select><span class="print-only" id="owner-print">${ownerLabel}</span></div><div class="worksheet-field"><label for="practice-date">Next practice date</label><input id="practice-date" type="date" value="${practiceDate}"><span class="print-only" id="date-print">${practiceDate || "Write a date"}</span></div></div>
        <div class="next-step"><h3>One change to test next time</h3><p class="write-line">Write a route or adjustment here during your discussion.</p></div><p class="plan-foot">Dead Air is a practice and discussion tool. No messages were sent. Scenario modes are illustrative, not a real-world accessibility assessment.</p></section>
      <footer><span>DEAD AIR · FICTIONAL EXERCISE</span><span>Nothing is sent, stored, or shared.</span></footer>
    </main>`;

  document.querySelector<HTMLSelectElement>("#channel-select")!.addEventListener("change", (event) => {
    failedChannelId = (event.target as HTMLSelectElement).value;
    render();
  });
  document.querySelectorAll<HTMLInputElement>("[data-strategy]").forEach((input) => input.addEventListener("change", () => {
    const strategyRouteIds = routes.filter((route) => route.alternate && route.channelId === input.dataset.strategy).map((route) => route.id);
    strategyRouteIds.forEach((id) => input.checked ? activeAlternateRouteIds.add(id) : activeAlternateRouteIds.delete(id));
    render();
  }));
  document.querySelector<HTMLSelectElement>("#owner-role")!.addEventListener("change", (event) => {
    worksheetOwnerId = (event.target as HTMLSelectElement).value;
    document.querySelector<HTMLElement>("#owner-print")!.textContent = roles.find((role) => role.id === worksheetOwnerId)?.label ?? "Choose a fictional role";
  });
  document.querySelector<HTMLInputElement>("#practice-date")!.addEventListener("change", (event) => {
    practiceDate = (event.target as HTMLInputElement).value;
    document.querySelector<HTMLElement>("#date-print")!.textContent = practiceDate || "Write a date";
  });
  document.querySelector<HTMLButtonElement>("#print-plan")!.addEventListener("click", () => window.print());
}

render();

window.addEventListener("resize", () => {
  const nextCompactMap = window.matchMedia("(max-width: 560px)").matches;
  if (nextCompactMap !== compactMap) {
    compactMap = nextCompactMap;
    render();
  }
});
