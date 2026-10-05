# PROJECT RULES & CONSTRAINTS

This document establishes the mandatory rules and architectural boundaries for the Campus Navigation Route Finder project.

## 1. Core Mandates
- **Package Manager**: `npm` only. Do not use yarn, pnpm, or bun.
- **Development Methodology**: Test-Driven Development (TDD) is mandatory. Unit tests must accompany all visualization utilities and core UI flows.
- **Scope Limit**: VISUALIZATION ONLY. The frontend provides a JSON-driven 3D Graph Viewer, endpoint selector, and route visualization tool.
- **Stop Condition**: Stop immediately once the 3D Graph Viewer and coordinate placement tools are functional.

## 2. STRICT PROHIBITIONS & ENGINE SOLE OWNERSHIP
The C Navigation Engine (`frontend/src/engine/routefinder.c` / `routefinder.exe`) is the **SOLE OWNER** of:
1. **Graph Construction** (parsing `nodes.json` and `edges.json` into an Adjacency List).
2. **Queue Data Structure** (FIFO Queue for traversal).
3. **Breadth-First Search (BFS)** Algorithm.
4. **Route Computation & Shortest Path Calculation**.
5. **Route Result Generation** (`route_result.json`).

Under NO circumstances shall the frontend or any TypeScript/JavaScript files implement:
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra's Algorithm
- A* Algorithm
- Any Graph Traversal or Search
- Any Route Computation or Pathfinding
- Queue Data Structures / Queue Logic
- Adjacency List Traversal Logic
- Adjacency Matrix Pathfinding Logic

The frontend must **NEVER** calculate routes. It is solely an interactive renderer and consumer of engine outputs.

## 3. Architecture & Data Flow Contract

```
+-------------------------------------------------------------+
|                     SHARED INPUT FILES                      |
|          nodes.json                    edges.json           |
|   (React uses: x, y, z)          (React uses: endpoints)    |
|   (C uses: id)                   (C uses: from, to)         |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     1. ROUTE REQUEST                        |
| Frontend writes / exports: route_request.json               |
|                                                             |
| {                                                           |
|   "source": "gate",                                         |
|   "destination": "library"                                  |
| }                                                           |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                2. C ROUTE ENGINE (FUTURE)                   |
| Binary: routefinder.exe (in frontend/src/engine/routefinder.c)|
|                                                             |
| Reads:  nodes.json, edges.json, route_request.json          |
| Logic:  Adjacency List + Queue + BFS Traversal (C Only)     |
| Writes: route_result.json                                   |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     3. ROUTE RESULT                         |
| File: route_result.json                                     |
|                                                             |
| {                                                           |
|   "found": true,                                            |
|   "path": ["gate", "junction1", "library"],                 |
|   "visited": 4                                              |
| }                                                           |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 4. FRONTEND VISUALIZATION                   |
| Frontend reads: route_result.json                           |
|                                                             |
| Displays:                                                   |
| - Highlighted 3D path nodes and edges                       |
| - Sequential path animation                                 |
| - Hop count & route details                                 |
| - Error / not-found states                                  |
+-------------------------------------------------------------+
```

## 4. Architecture & Infrastructure Constraints
- **No Backend**: No Node.js server, Python backend, or API server.
- **No Database**: No PostgreSQL, SQLite, MongoDB, or local databases.
- **No API Layer**: The viewer consumes static JSON files directly via file contracts.
- **Visualization-Only Coordinates**: Coordinates $(X, Y, Z)$ represent 3D spatial points for visualization and placement verification only. They must not be transformed into weighted pathfinding matrices in TypeScript.
- **C Engine Implementation**: `frontend/src/engine/routefinder.c` is implemented in C with Adjacency List graph, custom FIFO Queue, and BFS algorithm. Compiled to `routefinder.exe`.
- **Engine Communication Bridge**: The frontend communicates with `routefinder.exe` using `route_request.json` and `route_result.json` via the file contract, with simulated fixtures (`mock_route_result.json`) serving as an offline fallback.
