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
