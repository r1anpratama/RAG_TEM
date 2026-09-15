# Daily Log: 2026-09-14 - Agent Stage: a 2D Working-Agent Scene in the DSH Web UI

## 1. Objective
Add an animated 2D view of the running agent to the DeepSeek Harness (DSH) Web GUI at
`http://127.0.0.1:3080`, without forking DSH and without disturbing this repository.

## 2. Findings That Decided the Approach
1. **The running GUI is the checkout.** PID 42352 runs `node --import tsx/esm apps/cli/src/bin.ts "web"`
   from `D:\AGENT\deepseek-harness`; its client plugin packages resolve through junctions into
   `packages/client/*`.
2. **DSH's Web UI is a slot registry.** `packages/client/ui-*` are `dsh.client` plugin packages that
   contribute components through `SlotCore.register()`. The right Sidebar's tab types are the documented
   extension point: `ctx.sidebarRightTabs.register(...)` plus the keyed slots
   `sidebar.right.pane.tab` and `sidebar.right.pane.tab.title`.
3. **The only "agent working" signal needed is already a standard prop.**
   `SessionSnapshot.running`, `awaitingFirstTurn`, `queue`, `lastAgentError`
   (`packages/api/session-controller/src/client/contract/snapshot.ts`) plus
   `useSessionPendingInteraction` give a full five-state model with no new host wiring.
4. **The profile patch layer is hot-reloaded.** `~/.dsh/profiles/web/package.json` declares
   `"patchReload": "live"`, and `apps/cli/src/profile-boot.ts` watches both the profile patch file and
   `$DSH_HOME/cordis.patch.yml`. A new roster row therefore composes into the client entry graph
   **without restarting the server** - which mattered, because the server hosts this very session.
5. **The index HTML reads the live graph per request.** `ClientModuleRegistry` subscribes to
   `webserver/index-inject` and pushes `bootInjections(this.composed)`; the webserver collects
   injections fresh on every index response. A browser refresh is enough.
6. **The repository build preset cannot build an out-of-tree package.** `clientBundle()` in
   `packages/client/tsdown.client.ts` locates its manifest by scanning `packages/*/*/package.json`.
   A plugin outside the workspace must therefore satisfy the loader contract by hand - which is small:
   register a closure factory under the package-name id, resolve platform modules through the injected
   `require`, return the exports. `react` is a platform seed word
   (`packages/client/web/src/platform.ts`).

## 3. What Was Built
`~/.dsh/profiles/web/plugins/dsh-client-ui-agent-stage/` - package `@local/dsh-client-ui-agent-stage`:

| File | Role |
|---|---|
| `package.json` | `dsh.client.platform = "web"`; `exports["./client"]` is what the host reads for the bundle path |
| `lib/index.js` | host half - `apply() {}`, because a roster row must import a host module |
| `lib/client.js` | browser half - the scene, the stylesheet, and the four registrations |
| `README.md` | states, wiring, verification, limitations |

- **Scene**: one static inline SVG (character at a desk, monitor, keyboard) plus CSS keyframes gated by a
  single `data-state` on the body root. No JS animation loop, no dependency, no build step.
- **States** (precedence = what the reader must act on): `asking` -> `thinking` -> `working` -> `error` -> `idle`.
- **Mount**: one `- insert:` row in `~/.dsh/profiles/web/cordis.patch.yml` naming
  `./plugins/dsh-client-ui-agent-stage/lib/index.js`. Removing that row removes the tab.
- **Isolation**: no file in the DSH checkout and no file in this repository was modified.

## 4. Verification
1. **Bundle dry-run outside the browser** - imported `lib/client.js` under Node with a stubbed
   `window.__ModuleLoader__` and a stubbed `react`, then invoked the returned `apply(ctx)` with a fake
   context: registered id, exports (`apply`, `inject`), and all four effect call shapes were correct.
2. **Host half imports** - `import('./plugins/.../lib/index.js')` from the profile directory succeeds.
3. **Row is in the live graph** - read `GET /plugins/events` (the dev SSE channel sends the full graph on
   connect): the graph lists
   `{"id":"@local/dsh-client-ui-agent-stage","url":"/plugins/??@local/dsh-client-ui-agent-stage/client.js&rev=f105ab23b14345c1-53"}`.
4. **Bundle is served** - that exact composed URL answers `HTTP 200`, `18205` bytes,
   `text/javascript`. The compositor only advertises a URL it can serve, so this also proves the host row
   mounted without error.

`GET /` needs the browser's authentication cookie (launch-token exchange), so the index itself was not
fetched from the shell; the SSE graph is the same object the index injection serves.

## 5. Consequences / Known Limitations
- **The right Sidebar's default page changes.** Default pages depend on the number of registered guide
  entries: exactly one opens that page directly, zero or many open the guide
  (`ui-sidebar-right/src/client/contract/seed.ts`). Files was the only entry, so the guide is now the
  default and offers both capsules.
- **A refresh is required after mounting a new row**: a page already loaded keeps the boot graph it was
  served. New rows are not `rebuilt` HMR frames.
- **No dev watcher is running** (`pnpm run dev:web` is not active), so nothing rebuilds or hot-reloads
  client bundles on its own; editing `lib/client.js` needs a refresh, not a restart.