# Skills Analysis & Architecture Boundary

## Architectural Boundaries

This project serves as a Data Structures visualization and verification tool for a Campus Navigation Route Finder.

> **CRITICAL DIRECTIVE:**
> The C Graph/BFS implementation is intentionally excluded and will be manually implemented.

### Division of Responsibilities

1. **Frontend Layer (TypeScript / React / Three.js)**:
   - Visualizing nodes (buildings, intersections, landmarks) in 3D coordinate space.
   - Rendering connecting pathways (edges) between nodes.
   - Providing interactive camera movement, orbit controls, ground reference grids, and coordinate axes.
   - Inspecting node positions $(X, Y, Z)$ for verification and debug placement.
   - Performing validation checks on the dataset (detecting duplicate IDs, unknown edge references, dangling pointers, self-referencing loops).
   - **STRICTLY PROHIBITED**: Graph traversal, shortest path algorithms (BFS, DFS, Dijkstra, A*), queue processing, or path computation.

2. **Core Engine Layer (`engine/routefinder.c`)**:
   - Manually authored in C by the student/project owner.
   - Implements the Adjacency List / Matrix representations.
   - Implements the FIFO Queue.
   - Implements the Breadth-First Search (BFS) pathfinding engine.
   - Computes routes and traversals.

3. **Skills Utilized**:
   - `impeccable`: High-end UI design, aesthetic hierarchy, dark theme glassmorphism, responsive panel layouts.
   - `chrome-devtools`: Runtime verification and browser debugging.
   - `a11y-debugging`: Keyboard navigation, semantic HTML, and accessibility compliance.
   - `memory-leak-debugging`: Three.js WebGL resource cleanup and performance auditing.
   - `debug-optimize-lcp`: Fast page load and rendering performance.
   - `ponytail-review`: Minimalistic, unbloated code architecture avoiding over-engineering.
   - `antigravity-guide` / `agy-customizations`: Antigravity environment best practices.
