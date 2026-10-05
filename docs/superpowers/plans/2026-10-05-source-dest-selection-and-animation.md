# Implementation Plan: Source & Destination Selection with Engine Bridge & Sequential 3D Path Animation

- **Date**: 2026-10-05
- **Project**: Campus Navigation Route Finder
- **Scope**: Source & Destination Selection, C Engine Communication Contract, Sequential Path Highlighting Animation
- **Guiding Rule**: Strict compliance with `RULES.md` (Section 2 & 3: C Engine Exclusivity. No BFS/DFS/graph traversal algorithm in frontend TypeScript).

---

## 1. Goal Description

Implement an interactive route navigation workflow in the 3D Campus Viewer:
1. **Source & Destination Selection**: Users can choose a starting node (Source) and an ending node (Destination) via dropdowns, quick search, or directly by clicking nodes in the 3D scene.
2. **Engine Communication Bridge**: When "Find Route" is triggered, the frontend communicates with the C navigation engine interface according to the data contracts defined in `RULES.md`. Since the manual C implementation in `engine/routefinder.c` will be compiled and linked later, the frontend uses an asynchronous `EngineBridge` adapter that ingests static engine route outputs or pre-calculated route fixtures (`engine_routes.json`) without writing any graph traversal/BFS in TypeScript.
3. **Sequential Path Animation**: Animates the path step-by-step from source to destination:
   - Source node pulses and illuminates (Emerald "START" indicator).
   - Edge between step $i$ and step $i+1$ illuminates in sequence with a glowing trace.
   - Intermediate nodes light up in order of traversal.
   - Destination node pulses upon arrival (Crimson "DEST" indicator).
   - Non-route nodes and edges are smoothly dimmed to 15–35% opacity to minimize cognitive clutter (data visualization best practice).

---

## 2. Skill Analysis & Selection

The user explicitly requested: *"Analyze which skills you will need for this and use those only"*.

### Selected Skills to Utilize:
| Skill | Source | Purpose for this Task |
|---|---|---|
| **`react-patterns`** | `.agents/skills/react-patterns/SKILL.md` | Custom hooks (`useRouteAnimation`, `useRouteSelection`), compound component architecture for `RouteSelectorPanel`, TypeScript prop interfaces. |
| **`motion-micro-interactions`** | `.agents/skills/motion-micro-interactions/SKILL.md` | Staggered sequential timing (200–350ms per hop), compositor-friendly styling, easing, and `@media (prefers-reduced-motion)` fallback support. |
| **`data-viz-ux`** | `.agents/skills/data-viz-ux/SKILL.md` | Focus + context subgraph dimming (dimming background nodes to 0.35 and edges to 0.15), billboard waypoint badges (`START`, `STEP 1`, `DEST`), semantic category palette preservation. |
| **`r3f-3d-ux`** | `.agents/skills/r3f-3d-ux/SKILL.md` | Drei `Line` dynamic highlighting, glowing halos, manual `invalidate()` calls during sequential timer ticks in `frameloop="demand"`, camera framing. |
| **`tailwind-design-system`** | `.agents/skills/tailwind-design-system/SKILL.md` | Dark mode styling for route selector panel, inputs, playback controls, using existing OKLCH tokens. |
| **`ponytail`** | `C:\Users\AsusFahadLaptop\.gemini\config\plugins\ponytail` | Minimalist code, zero extra npm dependencies (native timers, pure CSS/Three.js shaders, no bloat). |

### Explicitly Excluded Skills:
- `debug-optimize-lcp` (Not applicable)
- `memory-leak-debugging` (Not applicable)
- `troubleshooting` (Not applicable)
- `a11y-debugging` (Not applicable for this feature build)

---

## 3. User Review Required

> [!IMPORTANT]
> **Strict Compliance with `RULES.md` (Engine Exclusivity)**:
> Section 2 of `RULES.md` strictly forbids implementing BFS, DFS, Dijkstra, or any graph traversal in TypeScript.
> Therefore:
> 1. The frontend **will NOT** compute the shortest path using any JavaScript graph algorithm.
> 2. The frontend will communicate via `engineBridge.ts` which defines the exact JSON contract expected from the C engine (`engine/routefinder.c`).
> 3. To allow full end-to-end interactive verification of the Source/Destination UI and sequential 3D animation immediately, we will provide an `engine_routes.json` dataset containing genuine pre-compiled routes between campus nodes (representing the C engine output) as well as an "Import C Engine JSON" file input.

---

## 4. Proposed Changes

### Component 1: Engine Bridge & Data Fixtures
- `frontend/src/data/engine_routes.json` [NEW]: Static pre-compiled route responses simulating the output of `engine/routefinder.c`.
- `frontend/src/lib/engineBridge.ts` [NEW]: Pure client adapter communicating with the engine.

### Component 2: Sequential Animation Hook
- `frontend/src/hooks/useRouteAnimation.ts` [NEW]: Manages the tick-by-tick animation sequence (`isPlaying`, `activeStep`, `illuminatedNodeIds`, `illuminatedEdgeKeys`).

### Component 3: UI & 3D Scene Integration
- `frontend/src/components/RouteSelectorPanel.tsx` [NEW]: Source and destination selection, swap button, find route action, and animation playback HUD.
- `frontend/src/components/Edges.tsx` [MODIFY]: Dynamic route highlighting and sequential path illumination.
- `frontend/src/components/NodeMesh.tsx` [MODIFY]: Role-based highlighting (Source Emerald, Destination Crimson, Waypoint Amber).
- `frontend/src/components/Scene.tsx` [MODIFY]: Wire route animation state and demand invalidation.
- `frontend/src/App.tsx` [MODIFY]: Tabbed panel integration and selection management.

---

## 5. Verification Plan
- Unit tests for engine bridge contract and route animation hook.
- Full Vitest suite passing with zero regressions.
- Verification of 60fps sequential path playback in the browser.
