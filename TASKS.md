# TASKS

## Phase 1: Foundations & Documentation (Current Scope)
- [x] Create directory structure: `frontend/`, `engine/`, `docs/skills/`, `docs/superpowers/plans/`
- [x] Create project constraints and boundary specification (`RULES.md`)
- [x] Create exported skill references in `docs/skills/` and `docs/skills/SKILLS_INDEX.md`
- [x] Create documentation: `docs/SKILLS_ANALYSIS.md` (explicitly noting C engine exclusion)
- [x] Create documentation: `docs/COORDINATE_SYSTEM.md` (X East/West, Y Elevation, Z North/South with diagrams)
- [x] Create initial plan document: `docs/superpowers/plans/2026-10-04-graph-visualization-viewer.md`
- [x] Create placeholder `engine/routefinder.c` with architecture comments only
- [x] Initialize `frontend/package.json` with exact versions specified
- [x] Configure `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`
- [x] Setup TailwindCSS v4 with `@import "tailwindcss";` in `src/index.css`
- [x] Create campus mock data: `frontend/src/data/nodes.json` and `frontend/src/data/edges.json`
- [x] Implement visualization utilities in `frontend/src/lib/graphViewerUtils.ts` (TDD)
- [x] Build 3D Graph Viewer components:
  - `Scene.tsx` (Canvas, OrbitControls, Grid, AxisHelper, Ambient & Directional Lights)
  - `NodeMesh.tsx` (Spheres, labels, coordinate badges, hover & selection highlights)
  - `Edges.tsx` (Connections between resolved endpoints)
- [x] Build 3-panel UI in `frontend/src/App.tsx`:
  - Left panel: Node & Edge counts, search filter, node list, selection
  - Center panel: 3D Canvas, viewport camera presets, debug placement overlay
  - Right panel: Selected node details, coordinates inspection, validation warnings
- [x] Implement Debug Placement Mode (grid, axes, alignment checking, always-visible labels)
- [x] Run Vitest test suite and verify all 23 unit tests pass
- [x] Validate production build (`npm run build`)
- [x] Conduct 2026 UI/UX best practices research across 6 core domains
- [x] Author and install 6 project-level Antigravity skills in `.agents/skills/`
- [x] Create formal UI/UX and Design System Implementation Plan (`docs/superpowers/plans/2026-10-05-uiux-skills-and-design-system.md`)
- [x] Implement Source and Destination selection UI with swap, clear, and quick-set actions (`RouteSelectorPanel.tsx`)
- [x] Implement asynchronous C Engine Adapter (`engineBridge.ts`) and mock route fixtures (`mock_route_result.json`) adhering to `RULES.md`
- [x] Implement `useRouteAnimation` custom hook for sequential 3D path illumination of engine-returned paths
- [x] Enhance 3D Scene components (`Edges.tsx`, `NodeMesh.tsx`, `NodeLabel.tsx`, `Scene.tsx`) with START/DEST badges, path glowing, and background network visibility
- [x] Add automated unit and integration tests (44/44 tests passing across 5 test suites)
- [x] Verify in browser with subagent and capture visual walkthrough artifacts

## Phase 2: C Engine Implementation & Native Bridge (Completed)
- [x] Manual implementation of Adjacency List graph structure in C (`frontend/src/engine/routefinder.c`)
- [x] Manual implementation of FIFO Queue in C
- [x] Manual implementation of Breadth-First Search (BFS) algorithm in C
- [x] Integration of custom parser in C for node/edge loading (`nodes.json`, `edges.json`)
- [x] Implement `route_request.json` workflow in C engine
- [x] Implement `route_result.json` output workflow in C engine
- [x] Connect compiled `routefinder.exe` binary in `frontend/src/engine/` to frontend file contract
- [x] Relocate engine directory to `frontend/src/engine/` to conform with Vite project root boundaries

## Phase 3: Spatial Configuration & Main Axis Control (Completed)
- [x] Implement Central Origin Offset (Main Axis Control) configured via `.env` (`VITE_CAMPUS_ORIGIN_X/Y/Z`) and `originConfig.ts` to translate all nodes $(x + \Delta x, y + \Delta y, z + \Delta z)$ and connecting edges relative to the 3D world origin without modifying `nodes.json`
- [x] Add Central Origin indicator in the 3D canvas coordinate banner and selected node coordinate inspector
- [x] Add unit test suite (`originConfig.test.ts`) validating coordinate translations and edge cases

## Phase 4: In-Browser Node Editor & Special Tools (Completed)
- [x] Implement in-browser Node Editor panel (`NodeEditorPanel.tsx`) in Debug Placement Mode for editing node name, ID, and coordinates $(X, Y, Z)$
- [x] Add interactive 3D WebGL Transform Controls (`TransformControls` gizmo in `Scene.tsx`) to drag and reposition nodes directly in the 3D viewport
- [x] Implement axis nudge tools ($\pm 1\text{m}$, $\pm 5\text{m}$), Snap to Ground ($Y=0$), Center $(X,Z)\to(0,0)$, and Grid Snapping (1m, 5m)
- [x] Implement automatic ID cascading to connecting edges to preserve graph topology when node IDs change
- [x] Implement node lifecycle operations: Add Node, Clone/Duplicate Node, and Delete Node with edge cleanup
- [x] Implement persistence and export workflow: Vite dev-server API `POST /api/nodes/save` to write directly to `nodes.json` on disk, `localStorage` draft caching, and JSON file download / clipboard copy
- [x] Add unit and integration test suites (`useNodeEditor.test.ts`, `NodeEditorPanel.test.tsx`, `NodeEditorIntegration.test.tsx`) achieving 100% pass rate (70/70 tests)

## Phase 5: Transform Gizmo Node Alignment & Edge Creator (Completed)
- [x] Fix 3-axis drag mover alignment by binding `TransformControls` to an explicit node-positioned target group in `Scene.tsx` so the gizmo moves and aligns directly with each selected node as it changes
- [x] Implement Edge Creator in `NodeEditorPanel.tsx` with destination node dropdown, live duplicate/self-loop validation, and pathway connection
- [x] Implement attached pathways list with 1-click disconnect/delete actions in the editor
- [x] Implement `addEdge` and `deleteEdge` in `useNodeEditor.ts` with bidirectional duplicate prevention
- [x] Add unit and integration tests across 9 test suites (74/74 tests passing)

## Phase 6: Dynamic Resizable Right Sidebar & Responsive Edge Creator (Completed)
- [x] Implement interactive drag splitter handle (`cursor-col-resize`) between Center 3D Scene and Right Sidebar allowing continuous width adjustment from 280px to 650px
- [x] Persist user's customized sidebar width across reloads via `localStorage` (`campus_nav_right_panel_width`)
- [x] Add viewport-aware clamping (`max-w-[calc(100vw-80px)]` and `overflow-x-hidden`) to guarantee the right sidebar never overflows the browser window on any screen resolution
- [x] Refactor Edge Creator & Pathways connection form to a responsive stacked layout with `w-full min-w-0 truncate` on destination select and full-width `Connect Pathway` button, preventing layout blowout from long node names
- [x] Ensure all nested inspector and editor components (coordinate grids, action buttons, warnings) fluidly adapt to dynamic width changes
- [x] Achieve 100% test pass rate across all 9 test suites (75/75 tests passing) and clean production build

