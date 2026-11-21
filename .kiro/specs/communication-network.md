# Spec: analyzeCommunicationNetwork

## Scope

Implement `analyzeCommunicationNetwork` in
`src/domain/communication-network.ts` and its focused unit tests.
No other files change. No dependencies beyond the project's existing stack.
No network calls, no personal data, no emergency advice.

---

## Interface (preserve as-is)

```ts
type NetworkAnalysisInput = {
  roles: Role[];
  routes: CommunicationRoute[];
  coordinatorId: string;
  failedChannelId: string | null;   // null = no failure
  activeAlternateRouteIds: string[]; // IDs of alternate routes currently active
};

type NetworkAnalysisResult = {
  reachableRoleIds: string[];  // can receive a message from coordinator
  isolatedRoleIds: string[];   // cannot
};
```

The coordinator itself is always in `reachableRoleIds` (it is the source).

---

## Assumptions

1. **Directed graph.** A route `A → B` does not imply `B → A`.
2. **Channel failure.** When `failedChannelId` is set, every route whose
   `channelId` matches is removed before traversal.
3. **Alternate routes.** A route with `alternate: true` is included in the
   graph **only** when its `id` appears in `activeAlternateRouteIds`.
   An alternate route whose channel also failed is still excluded.
4. **Non-alternate routes** that are not on the failed channel are always
   included.
5. **Traversal.** BFS or iterative DFS from `coordinatorId` over the filtered
   edge set. Visited-node tracking guarantees termination on cycles.
6. **Result order.** Both output arrays are sorted alphabetically by role ID
   for determinism.
7. **Unknown coordinator.** If `coordinatorId` does not appear in `roles`,
   all roles are isolated.

---

## Algorithm (pseudo-code)

```
function analyzeCommunicationNetwork(input):
  // 1. Build active edge set
  activeEdges = []
  for route in input.routes:
    if route.channelId == input.failedChannelId:
      skip                            // channel is down
    if route.alternate AND route.id NOT IN input.activeAlternateRouteIds:
      skip                            // alternate not activated
    activeEdges.append(route)

  // 2. BFS from coordinator
  visited = { input.coordinatorId }
  queue  = [ input.coordinatorId ]
  while queue not empty:
    current = queue.shift()
    for edge in activeEdges where edge.fromRoleId == current:
      if edge.toRoleId NOT IN visited:
        visited.add(edge.toRoleId)
        queue.push(edge.toRoleId)

  // 3. Partition roles
  allIds      = input.roles.map(r => r.id).sort()
  reachable   = allIds.filter(id => id IN visited).sort()
  isolated    = allIds.filter(id => id NOT IN visited).sort()
  return { reachableRoleIds: reachable, isolatedRoleIds: isolated }
```

---

## Acceptance criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | No failure, no alternates active | Coordinator + all roles reachable via non-alternate routes are reachable. Roles only reachable via alternate routes are isolated. |
| 2 | `failedChannelId: "internet"` | All `internet` routes removed. Roles only reachable via internet are isolated. |
| 3 | `failedChannelId: "phone"` | All `phone` routes removed. Roles only reachable via phone are isolated. |
| 4 | Alternate route active + its channel intact | Role reached via that alternate is reachable. |
| 5 | Alternate route active + its channel failed | Alternate is still excluded (channel failure takes precedence). |
| 6 | Alternate route **not** in `activeAlternateRouteIds` | Does not contribute to reachability. |
| 7 | Graph with a directed cycle | BFS terminates; no infinite loop. |
| 8 | Same inputs called twice | Identical output both times (pure function, no mutation). |
| 9 | `coordinatorId` not in `roles` | `reachableRoleIds: []`, all roles isolated. |

---

## Test plan

File: `src/domain/communication-network.test.ts`
Framework: whatever the project already uses (Vitest preferred; fall back to
Jest if Vitest is absent). No new test dependencies.

Use a minimal inline fixture (3–4 roles, 4–5 routes covering all channel types)
rather than importing `sample-map.ts`, so tests stay independent of data
changes.

### Test cases (map to AC rows above)

**T1 – baseline (no failure)**
- Input: coordinator → A via internet, coordinator → B via phone; no alternates active.
- Expect: reachable = [coordinator, A, B], isolated = [].

**T2 – internet failure**
- Same fixture; `failedChannelId: "internet"`.
- Expect: A isolated; coordinator + B reachable.

**T3 – phone failure**
- Same fixture; `failedChannelId: "phone"`.
- Expect: B isolated; coordinator + A reachable.

**T4 – active alternate reconnects**
- Add alternate route coordinator → C via "paper"; set it active.
- Expect: C reachable even though no non-alternate path exists.

**T5 – alternate active but channel failed**
- Same alternate route via "paper"; `failedChannelId: "paper"`; alternate active.
- Expect: C isolated.

**T6 – inactive alternate**
- Alternate route exists but `activeAlternateRouteIds` is empty.
- Expect: C isolated.

**T7 – cycle terminates**
- Add routes A → coordinator and coordinator → A (cycle).
- Expect: function returns without hanging; both reachable.

**T8 – determinism**
- Call with same input twice; deep-equal the results.

**T9 – unknown coordinator**
- `coordinatorId: "ghost"`.
- Expect: `reachableRoleIds: []`, all role IDs in `isolatedRoleIds`.

---

## Out of scope

- UI changes.
- Changes to `sample-map.ts`.
- Multi-hop alternate routing (alternates are treated like any other directed
  edge once activated).
- Real-time updates or subscriptions.
