# Skills Index

Reference index of all installed agent skills leveraged for the Campus Navigation Route Finder frontend, testing, and documentation.

> **CRITICAL NOTE**:
> No skills for BFS, DFS, Dijkstra, A*, or graph traversal algorithms are included. The C graph engine will be manually implemented by the project owner.

| Skill Name | Purpose | Usage In Project |
|:---|:---|:---|
| **impeccable** | UI Design, Frontend Craft, Glassmorphic Styling & Layout | Designed the 3-panel dashboard (Left: Metrics & List, Center: 3D Canvas, Right: Inspector & Warnings) with rich dark-mode aesthetics. |
| **chrome-devtools** | Browser Automation & Runtime Debugging | Used for runtime auditing, visual verification, and DevTools console inspection. |
| **a11y-debugging** | Accessibility & Semantic Structure | Validates semantic tags, ARIA attributes, contrast ratios, and keyboard accessibility for panel interactions. |
| **memory-leak-debugging** | WebGL / Three.js Resource Management | Audits Three.js geometries, line materials, and mesh lifecycle to prevent WebGL context memory leaks. |
| **debug-optimize-lcp** | Performance & Largest Contentful Paint | Ensures instantaneous loading of 3D Canvas assets and UI components. |
| **ponytail-review** | Anti-Bloat & Code Minimalization | Enforces strict boundaries in `graphViewerUtils.ts` so that no graph traversal or pathfinding logic is created. |
| **antigravity-guide** | Workspace Architecture & Documentation | Standardizes project structure, documentation format, and task logs. |
