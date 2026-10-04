# PROJECT RULES & CONSTRAINTS

This document establishes the mandatory rules and boundaries for the Campus Navigation Route Finder project.

## 1. Core Mandates
- **Package Manager**: `npm` only. Do not use yarn, pnpm, or bun.
- **Development Methodology**: Test-Driven Development (TDD) is mandatory. Unit tests must accompany all visualization utilities and core UI flows.
- **Scope Limit**: VISUALIZATION ONLY. This repository provides a JSON-driven 3D Graph Viewer and debug placement verification tool.
- **Stop Condition**: Stop immediately once the 3D Graph Viewer and coordinate placement tools are functional.

## 2. STRICT PROHIBITIONS (C Engine Exclusivity)
The Graph, Queue, BFS, Route Computation, Pathfinding, Traversal Logic, and Navigation Engine **WILL BE MANUALLY IMPLEMENTED BY THE PROJECT OWNER IN C**.

Under NO circumstances shall the frontend or any TypeScript/JavaScript files implement:
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra's Algorithm
- A* Algorithm
- Any Graph Traversal
- Any Route Computation or Shortest Path Calculation
- Queue Data Structures / Queue Logic
- Adjacency List Traversal Logic
- Adjacency Matrix Pathfinding Logic
- Pathfinding Algorithms of any kind
- Navigation Algorithms of any kind
- Route Highlighting between arbitrary paths

## 3. Architecture & Infrastructure Constraints
- **No Backend**: No Node.js server, Python backend, or API server.
- **No Database**: No PostgreSQL, SQLite, MongoDB, or local databases.
- **No API Layer**: The viewer consumes static JSON files (`nodes.json` and `edges.json`) directly.
- **Visualization-Only Coordinates**: Coordinates $(X, Y, Z)$ represent 3D spatial points for visualization and placement verification only. They must not be transformed into weighted pathfinding matrices in TypeScript.
- **C Engine Placeholder**: `engine/routefinder.c` contains comments ONLY. No C code, no stubs, no algorithm skeletons. Manual implementation only.
