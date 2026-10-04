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

## Phase 2: Future Scope (Exclusively Reserved for Manual C Implementation)
The following tasks are strictly OUT OF SCOPE for this build and will be implemented manually in C by the project owner:
- [ ] Manual implementation of Adjacency List graph structure in C (`engine/routefinder.c`)
- [ ] Manual implementation of circular FIFO Queue in C
- [ ] Manual implementation of Breadth-First Search (BFS) algorithm in C
- [ ] Integration of JSON parser in C for node/edge loading
- [ ] Route computation and traversal logic in C
- [ ] Compilation pipeline linking C engine output to navigation clients
