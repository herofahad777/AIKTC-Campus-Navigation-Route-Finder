# Implementation Plan: 3D Graph Visualization Viewer

- **Date**: 2026-10-04
- **Project**: Campus Navigation Route Finder
- **Scope**: Frontend 3D Graph Viewer & Debug Placement Tool (TDD)
- **Status**: Executing

## 1. Overview & Objective
Build an interactive, high-fidelity 3D visualization viewer for campus navigation nodes and edges using React 19, Three.js, React Three Fiber, and TailwindCSS v4. The system is strictly a visualizer and manual placement validation tool; all pathfinding, graph algorithms, and traversal are strictly excluded and reserved for manual C implementation in `engine/routefinder.c`.

## 2. Technical Stack
- **Framework**: React 19.3.0 + Vite 8.3.2 + TypeScript 7.0.2
- **3D Engine**: Three.js 0.186.1 + @react-three/fiber 9.8.1 + @react-three/drei 10.7.9
- **Styling**: TailwindCSS 4.3.3 (`@import "tailwindcss";`, no config file)
- **Testing**: Vitest 5.0.3 + Testing Library + JSDOM

## 3. Architecture & Data Flow
```
+-------------------------------------------------------+
|                 JSON Static Datasets                  |
|        nodes.json                edges.json           |
+-------------------+--------------------+--------------+
                    |                    |
                    v                    v
        +----------------------------------------+
        |        graphViewerUtils.ts             |
        | - countNodes / countEdges              |
        | - findNodeById                         |
        | - resolveEdgeEndpoints                 |
        | - validateGraphData (warnings only)    |
        +-------------------+--------------------+
                            |
                            v
+-------------------------------------------------------+
|                    App.tsx (Layout)                   |
|  +----------------+----------------+----------------+ |
|  |   Left Panel   |  Center Panel  |  Right Panel   | |
|  | - Metrics      |  - 3D Canvas   |  - Selection   | |
|  | - Node List    |  - Orbit Ctrl  |  - Coordinates | |
|  | - Placement Sw |  - Grid & Axes |  - Warnings    | |
|  +----------------+----------------+----------------+ |
|                           |                           |
|       +-------------------+-------------------+       |
|       v                                       v       |
|  [Scene.tsx]                             [Edges.tsx]  |
|  - Infinite Grid                         - Drei Line  |
|  - Axis Helper                           - Endpoints  |
|  - [NodeMesh.tsx] (Spheres, Labels)                   |
+-------------------------------------------------------+
```

## 4. Component Structure
1. `frontend/src/lib/graphViewerUtils.ts`:
   - Pure visualization functions.
   - Validation checks for duplicates, missing IDs, dangling edges, self-loops.
2. `frontend/src/components/Scene.tsx`:
   - R3F Canvas setup with perspective camera.
   - Ambient & Directional Lighting.
   - OrbitControls with smooth damping.
   - Grid and Gizmo/AxisHelper for visual alignment.
3. `frontend/src/components/NodeMesh.tsx`:
   - Spherical meshes positioned at $(x, y, z)$.
   - Interactive hover and click selection states.
   - Elevation drop-line down to ground plane $y=0$ for multi-level buildings.
   - HTML/Sprite label displaying node name and $(x, y, z)$.
4. `frontend/src/components/Edges.tsx`:
   - Line connections between resolved endpoints.
   - Distinct color and opacity for clear spatial understanding.
5. `frontend/src/App.tsx`:
   - 3-panel responsive layout adhering to the `impeccable` design standard.
   - Debug placement mode controls and view angle presets (Top, Front, Isometric).

## 5. Verification Plan
- Unit tests with Vitest covering all utility functions and graph data validation.
- App layout integration test with WebGL mocks.
- Build validation with `npm run build`.
- Live runtime check with Vite dev server.
