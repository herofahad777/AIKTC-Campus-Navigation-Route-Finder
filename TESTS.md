# TESTS SPECIFICATION

Test-Driven Development (TDD) plan for the Campus Navigation Route Finder 3D Graph Viewer.

## 1. Graph Viewer Visualization Utilities (`frontend/src/lib/graphViewerUtils.test.ts`)
- `countNodes`:
  - Returns 0 for empty array
  - Returns accurate count for populated nodes array
- `countEdges`:
  - Returns 0 for empty array
  - Returns accurate count for populated edges array
- `findNodeById`:
  - Returns node when ID matches
  - Returns undefined when ID is not found
- `resolveEdgeEndpoints`:
  - Resolves source and target node objects correctly for valid edge
  - Flags or omits edge when either source or target node is missing
- `validateGraphData`:
  - Returns no warnings for completely valid nodes and edges
  - Detects duplicate node IDs and generates descriptive warning
  - Detects missing node IDs and generates descriptive warning
  - Detects missing/non-numeric coordinates (x, y, z) and generates warning
  - Detects edge referencing unknown node IDs (dangling edge)
  - Detects self-referencing edge (`from === to`)

## 2. Component & Layout Integration Tests (`frontend/src/App.test.tsx`)
- Renders 3-panel application layout without crashing
- Displays Left Panel with correct node count, edge count, and node list items
- Clicking a node in the list updates the selected node state and displays info in the Right Panel
- Displays coordinates $(X, Y, Z)$ of selected node in Right Panel
- Displays Validation Warnings banner or list when data irregularities exist
- Toggle Debug Placement Mode reflects active status in UI
